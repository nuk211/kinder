// src/app/api/notifications/sse/route.ts

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    const sendNotifications = async () => {
      const notifications = await prisma.notification.findMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        orderBy: {
          timestamp: 'desc',
        },
        include: {
          child: true,
          parent: true,
        },
      });

      const data = `data: ${JSON.stringify(notifications)}\n\n`;
      await writer.write(encoder.encode(data));
    };

    // Send initial notifications
    await sendNotifications();

    // Set up interval to check for new notifications
    const interval = setInterval(sendNotifications, 5000);

    // Clean up on connection close
    request.signal.addEventListener('abort', () => {
      clearInterval(interval);
      writer.close();
      prisma.$disconnect();
    });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('SSE error:', error);
    return new Response('Error', { status: 500 });
  }
}