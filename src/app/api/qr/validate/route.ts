import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient, ChildStatus, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();
const SCAN_COOLDOWN = 10000; // 10 seconds in milliseconds

export async function POST(request: NextRequest) {
  try {
    console.log('1. Starting validation...');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { qrCode } = await request.json();
    console.log('2. Received request body:', { qrCode });
    
    const today = new Date().toISOString().split('T')[0];
    if (!qrCode.includes(today)) {
      return NextResponse.json(
        { error: 'QR code has expired. Please scan today\'s code.' },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check for recent scans by this parent
      const recentNotification = await tx.notification.findFirst({
        where: {
          parentId: session.user.id,
          createdAt: {
            gte: new Date(Date.now() - SCAN_COOLDOWN)
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (recentNotification) {
        throw new Error('Please wait 10 seconds before scanning again');
      }

      const parent = await tx.user.findUnique({
        where: { id: session.user.id },
        include: { children: true }
      });

      if (!parent || parent.role !== 'PARENT') {
        throw new Error('Not authorized as parent');
      }

      const admin = await tx.user.findFirst({
        where: { role: 'ADMIN' }
      });

      if (!admin) {
        throw new Error('No admin found in the system');
      }

      const currentTime = new Date();
      const results = [];

      for (const child of parent.children) {
        const currentChild = await tx.child.findUnique({
          where: { id: child.id }
        });

        if (!currentChild) continue;

        const newStatus = currentChild.status === ChildStatus.PRESENT 
          ? ChildStatus.PICKED_UP 
          : ChildStatus.PRESENT;
        
        const action = newStatus === ChildStatus.PRESENT ? 'CHECK_IN' : 'PICK_UP';

        // Update child status
        const updatedChild = await tx.child.update({
          where: { id: child.id },
          data: { status: newStatus }
        });

        // Create attendance record
        await tx.attendance.create({
          data: {
            childId: child.id,
            status: AttendanceStatus.PRESENT,
            date: currentTime,
            checkInTime: action === 'CHECK_IN' ? currentTime : undefined,
            checkOutTime: action === 'PICK_UP' ? currentTime : undefined
          }
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: admin.id,
            childId: child.id,
            parentId: parent.id,
            type: action,
            message: `${child.name} has been ${
              action === 'CHECK_IN' ? 'checked in' : 'picked up'
            } by ${parent.name}`,
            timestamp: currentTime
          }
        });

        results.push({
          child: updatedChild,
          action,
          time: currentTime,
          message: action === 'CHECK_IN' 
            ? 'Marked as present' 
            : 'Marked as picked up'
        });
      }

      return {
        parent,
        results
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      data: {
        parent: {
          name: result.parent.name
        },
        children: result.results.map(res => ({
          name: res.child.name,
          status: res.action,
          message: res.message,
          timestamp: res.time.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        }))
      }
    });

  } catch (error) {
    console.error('QR validation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process QR code' 
    }, { status: 400 });
  } finally {
    await prisma.$disconnect();
  }
}