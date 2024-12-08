// src/app/api/qr/validate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient, ChildStatus, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();
const smsApiUrl = '/api/sms'; // Path to your SMS API

const actionCache = new Map<string, { lastAction: 'CHECK_IN' | 'PICK_UP'; timestamp: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of actionCache.entries()) {
    if (now - value.timestamp > 5 * 60 * 1000) {
      actionCache.delete(key);
    }
  }
}, 60 * 1000);

const getLocalTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 3 * 60 * 60 * 1000); // Adjust to your timezone
};

async function sendSms(to: string, message: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'; // Replace with your base URL
    const response = await fetch(`${baseUrl}/api/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('SMS sending failed:', data.error);
    }
    return data.success;
  } catch (error) {
    console.error('SMS sending error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { qrCode } = await request.json();
    const today = new Date().toISOString().split('T')[0];

    if (!qrCode.includes(today)) {
      return NextResponse.json(
        { error: 'QR code has expired. Please scan today\'s code.' },
        { status: 400 }
      );
    }

    const parent = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { children: true },
    });

    if (!parent || parent.role !== 'PARENT') {
      return NextResponse.json({ error: 'Not authorized as parent' }, { status: 403 });
    }

    const currentTime = getLocalTime();
    const formattedTime = currentTime.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Baghdad',
    });

    const results = await Promise.all(
      parent.children.map(async (child) => {
        const cacheKey = `${child.id}-${today}`;
        const cachedAction = actionCache.get(cacheKey);
        const now = Date.now();

        const currentChild = await prisma.child.findUnique({ where: { id: child.id } });

        if (!currentChild) {
          return { success: false, message: `Child ${child.name} not found` };
        }

        if (cachedAction && now - cachedAction.timestamp < 5 * 60 * 1000) {
          return { success: false, message: `Action for ${child.name} was performed recently.` };
        }

        if (currentChild.status === ChildStatus.ABSENT) {
          await prisma.attendance.create({
            data: {
              childId: child.id,
              status: AttendanceStatus.PRESENT,
              date: currentTime,
              checkInTime: currentTime,
            },
          });

          await prisma.child.update({
            where: { id: child.id },
            data: { status: ChildStatus.PRESENT },
          });

          actionCache.set(cacheKey, { lastAction: 'CHECK_IN', timestamp: now });

          const smsMessage = `${child.name} has been checked in at ${formattedTime}.`;
          if (parent.phoneNumber) {
            await sendSms(parent.phoneNumber, smsMessage);
          }

          return { success: true, action: 'CHECK_IN', time: formattedTime, message: smsMessage };
        } else if (currentChild.status === ChildStatus.PRESENT) {
          await prisma.attendance.updateMany({
            where: {
              childId: child.id,
              date: {
                gte: new Date(today),
                lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1)),
              },
              checkOutTime: null,
            },
            data: {
              checkOutTime: currentTime,
              status: AttendanceStatus.ABSENT,
            },
          });

          await prisma.child.update({
            where: { id: child.id },
            data: { status: ChildStatus.PICKED_UP },
          });

          actionCache.set(cacheKey, { lastAction: 'PICK_UP', timestamp: now });

          const smsMessage = `${child.name} has been picked up at ${formattedTime}.`;
          if (parent.phoneNumber) {
            await sendSms(parent.phoneNumber, smsMessage);
          }

          return { success: true, action: 'PICK_UP', time: formattedTime, message: smsMessage };
        }

        return {
          success: false,
          message: `${child.name} is already ${currentChild.status.toLowerCase()}.`,
        };
      })
    );

    const successfulResults = results.filter((result) => result.success);

    if (successfulResults.length === 0) {
      return NextResponse.json({
        success: false,
        message: results[0]?.message || 'No actions performed',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Actions processed successfully',
      data: {
        parent: { name: parent.name },
        children: successfulResults.map((result) => ({
          status: result.action,
          message: result.message,
          timestamp: result.time,
        })),
      },
    });
  } catch (error) {
    console.error('QR validation error:', error);
    return NextResponse.json({ error: 'Failed to process QR code' }, { status: 500 });
  }
}
