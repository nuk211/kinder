import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust this import based on your project structure

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const range = url.searchParams.get('range') || 'week';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    if (range === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate.setDate(startDate.getDate() - 7); // Default to weekly range
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: today,
        },
      },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            parent: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const totalStudents = await prisma.child.count();
    const presentCount = attendanceRecords.filter((record) => record.status === 'PRESENT').length;

    const dailyStats = attendanceRecords.reduce((acc, record) => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          present: 0,
          absent: 0,
          total: 0,
        };
      }
      acc[dateKey].total += 1;

      if (record.status === 'PRESENT') acc[dateKey].present += 1;
      if (record.status === 'ABSENT') acc[dateKey].absent += 1;

      return acc;
    }, {});

    const dailyStatsArray = Object.values(dailyStats);

    const presentChildren = attendanceRecords
      .filter((record) => record.status === 'PRESENT')
      .map((record) => ({
        id: record.child.id,
        name: record.child.name,
        parentName: record.child.parent?.name || 'Unknown',
      }));

    return NextResponse.json({
      dailyStats: dailyStatsArray,
      totalStudents,
      presentChildren,
    });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();

    // Update child details, including parent if specified
    const updatedChild = await prisma.child.update({
      where: { id: data.id },
      data: {
        name: data.name,
        status: data.status,
        parent: {
          update: {
            name: data.parent.name,
            email: data.parent.email,
            phoneNumber: data.parent.phoneNumber,
          },
        },
      },
      include: {
        parent: true,
      },
    });

    return NextResponse.json(updatedChild);
  } catch (error) {
    console.error('Error updating child details:', error);
    return NextResponse.json({ error: 'Failed to update child details' }, { status: 500 });
  }
}
