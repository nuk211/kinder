// src/app/api/children/attendance/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AttendanceStatus, ChildStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const childId = params.id;
    const body = await request.json();
    const { status } = body;

    // Convert the incoming status to proper enum values
    let attendanceStatus: AttendanceStatus;
    let childStatus: ChildStatus;

    switch (status) {
      case 'PRESENT':
        attendanceStatus = AttendanceStatus.PRESENT;
        childStatus = ChildStatus.PRESENT;
        break;
      case 'ABSENT':
        attendanceStatus = AttendanceStatus.ABSENT;
        childStatus = ChildStatus.ABSENT;
        break;
      case 'PICKED_UP':
        attendanceStatus = AttendanceStatus.PICKED_UP;
        childStatus = ChildStatus.PICKED_UP;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        );
    }

    // Check if child exists
    const existingChild = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!existingChild) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Update the child's status
    const updatedChild = await prisma.child.update({
      where: { id: childId },
      data: { 
        status: childStatus,
        updatedAt: now
      },
    });

    // Create an attendance record
    await prisma.attendance.create({
      data: {
        childId,
        status: attendanceStatus,
        date: now,
        checkInTime: status === 'PRESENT' ? now : null,
        checkOutTime: status === 'PICKED_UP' ? now : null,
      },
    });

    return NextResponse.json(updatedChild);
  } catch (error) {
    console.error('Error updating child status:', error);
    return NextResponse.json(
      { error: 'Failed to update child status' },
      { status: 500 }
    );
  }
}