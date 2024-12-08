import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get today's date range with timezone adjustment
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Basic stats
    const [totalChildren, presentToday, pickupRequests, unreadNotifications] = await Promise.all([
      prisma.child.count(),
      prisma.child.count({ where: { status: 'PRESENT' } }),
      prisma.child.count({ where: { status: 'PICKUP_REQUESTED' } }),
      prisma.notification.count({ where: { read: false } })
    ]);

    // Fetch recent activities with more detailed information
    const recentActivities = await prisma.attendance.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        child: {
          include: {
            parent: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 10
    });

    // Format recent activities
    const formattedActivities = recentActivities.map(record => ({
      id: record.id,
      childName: record.child.name,
      parentName: record.child.parent.name,
      type: record.checkOutTime ? 'PICK_UP' : 'CHECK_IN',
      timestamp: record.date.toISOString(),
      checkInTime: record.checkInTime?.toISOString(),
      checkOutTime: record.checkOutTime?.toISOString(),
    }));

    // Fetch present children with their latest attendance records
    const presentChildren = await prisma.child.findMany({
      where: { 
        status: 'PRESENT'
      },
      include: {
        parent: true,
        attendanceRecords: {
          where: {
            date: {
              gte: today,
              lt: tomorrow
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 1
        }
      }
    });

    // Format present children data
    const formattedPresentChildren = presentChildren.map(child => ({
      id: child.id,
      name: child.name,
      parentName: child.parent.name,
      checkInTime: child.attendanceRecords[0]?.checkInTime?.toISOString() || null,
      status: child.status
    }));

    // Calculate hourly stats for today (7 AM to 6 PM)
    const operatingHours = Array.from({ length: 12 }, (_, i) => ({
      hour: `${(i + 7).toString().padStart(2, '0')}:00`,
      checkIns: 0,
      checkOuts: 0
    }));

    // Fill in the hourly stats
    recentActivities.forEach(record => {
      if (record.checkInTime) {
        const hour = record.checkInTime.getHours() - 7;
        if (hour >= 0 && hour < 12) {
          operatingHours[hour].checkIns++;
        }
      }
      if (record.checkOutTime) {
        const hour = record.checkOutTime.getHours() - 7;
        if (hour >= 0 && hour < 12) {
          operatingHours[hour].checkOuts++;
        }
      }
    });

    // Calculate attendance trend for the last 7 days
    const pastWeek = new Date(today);
    pastWeek.setDate(pastWeek.getDate() - 7);

    const attendanceRecords = await prisma.attendance.groupBy({
      by: ['date', 'status'],
      where: {
        date: {
          gte: pastWeek,
          lt: tomorrow
        }
      },
      _count: true
    });

    // Process attendance trends
    const trendMap = new Map();
    for (let d = new Date(pastWeek); d < tomorrow; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      trendMap.set(dateStr, {
        date: dateStr,
        present: 0,
        absent: totalChildren // Default to total children absent
      });
    }

    attendanceRecords.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      const data = trendMap.get(dateStr);
      if (data) {
        if (record.status === 'PRESENT') {
          data.present = record._count;
          data.absent = totalChildren - record._count;
        }
      }
    });

    const attendanceTrend = Array.from(trendMap.values());

    // Return complete dashboard data
    return NextResponse.json({
      totalChildren,
      presentToday,
      pickupRequests,
      unreadNotifications,
      recentActivities: formattedActivities,
      presentChildren: formattedPresentChildren,
      dailyStats: operatingHours,
      attendanceTrend,
      attendanceRate: totalChildren > 0 
        ? ((presentToday / totalChildren) * 100).toFixed(1) 
        : '0'
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}