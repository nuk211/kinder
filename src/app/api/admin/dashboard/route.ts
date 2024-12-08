// src/app/api/admin/dashboard/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get the total number of children
    const totalChildren = await prisma.child.count();

    // Get the number of children present today
    const presentToday = await prisma.child.count({
      where: { status: 'PRESENT' },
    });

    // Get the number of pickup requests
    const pickupRequests = await prisma.child.count({
      where: { status: 'PICKUP_REQUESTED' },
    });

    // Fetch the 10 most recent attendance records
    const recentActivities = await prisma.attendance.findMany({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)), // From start of today
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
      take: 10,
    });

    // Fetch all children marked as PRESENT
    const presentChildren = await prisma.child.findMany({
      where: { status: 'PRESENT' },
      include: {
        parent: true,
      },
    });

    // Format the recent activities for better readability
    const formattedRecentActivities = recentActivities.map((record) => ({
      id: record.id,
      type: record.checkOutTime ? 'PICK_UP' : 'CHECK_IN',
      childName: record.child.name,
      parentName: record.child.parent?.name || 'Unknown',
      timestamp: record.date.toISOString(),
    }));

    // Format present children for better readability
    const formattedPresentChildren = presentChildren.map((child) => ({
      id: child.id,
      name: child.name,
      parentName: child.parent?.name || 'Unknown',
      checkInTime: child.updatedAt.toISOString(), // Assuming updatedAt represents the last check-in time
    }));

    // Return the dashboard data
    return NextResponse.json({
      totalChildren,
      presentToday,
      pickupRequests,
      recentActivities: formattedRecentActivities,
      presentChildren: formattedPresentChildren,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
