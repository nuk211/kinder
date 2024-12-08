// src/app/api/parents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/utils';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const parents = await prisma.user.findMany({
      where: {
        role: 'PARENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        password: true,
        children: {
          select: {
            id: true,
            name: true,
            status: true,
          }
        }
      }
    });

    return NextResponse.json(parents);
  } catch (error) {
    console.error('Error fetching parents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const hashedPassword = await hashPassword(body.password);
    
    const parent = await prisma.user.create({
      data: {
        ...body,
        password: hashedPassword,
        role: 'PARENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true
      }
    });

    return NextResponse.json(parent, { status: 201 });
  } catch (error) {
    console.error('Error creating parent:', error);
    return NextResponse.json(
      { error: 'Failed to create parent' },
      { status: 500 }
    );
  }
}