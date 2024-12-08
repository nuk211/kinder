// src/app/api/children/attendance/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const range = url.searchParams.get('range') || 'week';

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const startDate = new Date(today);
    if (range === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }
    startDate.setHours(0, 0, 0, 0);

    // Get all attendance records for the date range
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: today,
        },
      },
      include: {
        child: {
          include: {
            parent: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Get total students count
    const totalStudents = await prisma.child.count();

    // Calculate daily statistics
    const dailyStats = [];
    let currentDate = new Date(startDate);

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Filter records for current day
      const dayRecords = attendanceRecords.filter(record => 
        record.date.toISOString().split('T')[0] === dateStr
      );

      // Count different statuses for the day
      const stats = {
        date: dateStr,
        present: dayRecords.filter(r => r.status === 'PRESENT').length,
        absent: dayRecords.filter(r => r.status === 'ABSENT').length,
        pickUps: dayRecords.filter(r => r.status === 'PICKED_UP').length,
        total: totalStudents,
      };

      dailyStats.push(stats);
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get currently present children
    const presentChildren = await prisma.child.findMany({
      where: {
        status: 'PRESENT',
      },
      include: {
        parent: true,
        attendanceRecords: {
          where: {
            date: {
              gte: new Date(today.setHours(0, 0, 0, 0)),
            },
            status: 'PRESENT',
          },
          orderBy: {
            date: 'desc',
          },
          take: 1,
        },
      },
    });

    // Calculate averages
    const weeklyAverage = Math.round(
      dailyStats.slice(0, 7).reduce((acc, day) => acc + day.present, 0) / 
      Math.min(dailyStats.length, 7)
    );

    const monthlyAverage = Math.round(
      dailyStats.reduce((acc, day) => acc + day.present, 0) / 
      dailyStats.length
    );

    // Format present children data
    const formattedPresentChildren = presentChildren.map(child => ({
      id: child.id,
      name: child.name,
      parentName: child.parent.name,
      status: child.status,
      checkInTime: child.attendanceRecords[0]?.date.toISOString(),
      checkOutTime: child.attendanceRecords[0]?.checkOutTime?.toISOString(),
    }));

    return NextResponse.json({
      dailyStats: dailyStats.reverse(), // Most recent first
      weeklyAverage,
      monthlyAverage,
      totalStudents,
      presentChildren: formattedPresentChildren,
    });

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance data' }, 
      { status: 500 }
    );
  }
}