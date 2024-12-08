import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for creating a child
const childCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  status: z.enum(['ABSENT', 'PRESENT', 'PICKUP_REQUESTED', 'PICKED_UP']).optional(),
});

// Function to generate a consistent QR code
const generateQRCode = async () => {
  const count = await prisma.child.count();
   // Count existing children
  return `QR${count + 1}`; // Generate QR code like QR126
};

// Function to fix existing QR codes
const fixQRCode = async () => {
  const children = await prisma.child.findMany();
  let counter = 1; // Start counter for QR codes
  for (const child of children) {
    // Check if QR code is invalid or missing
    if (!child.qrCode || child.qrCode.startsWith('default')) {
      const updatedQRCode = `QR${counter++}`;
      await prisma.child.update({
        where: { id: child.id },
        data: { qrCode: updatedQRCode },
      });
      console.log(`Fixed QR Code for ${child.name}: ${updatedQRCode}`);
    }
  }
};

// ** GET: Fetch all children **
export async function GET() {
  try {
    const children = await prisma.child.findMany({
      include: {
        parent: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        attendanceRecords: {
          orderBy: { date: 'desc' },
          take: 5, // Get the 5 most recent attendance records
        },
      },
    });

    return NextResponse.json(children);
  } catch (error) {
    console.error('Error fetching children:', error);
    return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 });
  }
}

// ** POST: Create a new child **
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract `name`, `status`, and `parentId` from the request body
    const { name, status, parentId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!parentId) {
      return NextResponse.json({ error: 'Parent ID is required' }, { status: 400 });
    }

    // Validate if the parent exists
    const parent = await prisma.user.findUnique({
      where: { id: parentId },
    });

    if (!parent || parent.role !== 'PARENT') {
      return NextResponse.json({ error: 'Invalid parent selected' }, { status: 400 });
    }

    // Generate a unique QR code
    const qrCode = await generateQRCode();

    // Create the child with the selected parent
    const child = await prisma.child.create({
      data: {
        name,
        status: status || 'ABSENT',
        parentId: parent.id,
        qrCode,
      },
    });
    return NextResponse.json(child, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error creating child:', error);
    return NextResponse.json({ error: 'Failed to create child' }, { status: 500 });
  }
}

// ** PUT: Update an existing child **
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const childId = url.pathname.split('/').pop();
    const body = await request.json();

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Validate input
    const validatedData = childCreateSchema.partial().parse(body);

    // Check if the child exists
    const childExists = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!childExists) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Update the child
    const updatedChild = await prisma.child.update({
      where: { id: childId },
      data: validatedData,
      include: {
        parent: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    return NextResponse.json(updatedChild);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error updating child:', error);
    return NextResponse.json({ error: 'Failed to update child' }, { status: 500 });
  }
}

// ** DELETE: Delete a child **
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const childId = url.pathname.split('/').pop();

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Check if the child exists
    const childExists = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!childExists) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Delete the child's attendance records (to avoid foreign key constraint issues)
    await prisma.attendance.deleteMany({
      where: { childId },
    });

    // Delete the child
    await prisma.child.delete({
      where: { id: childId },
    });

    return NextResponse.json({ message: 'Child deleted successfully' });
  } catch (error) {
    console.error('Error deleting child:', error);
    return NextResponse.json({ error: 'Failed to delete child' }, { status: 500 });
  }
}

// ** Optional: GET for fixing QR codes **
export async function FIX_QR_CODES(request: NextRequest) {
  try {
    await fixQRCode();
    return NextResponse.json({ message: 'QR codes fixed successfully' });
  } catch (error) {
    console.error('Error fixing QR codes:', error);
    return NextResponse.json({ error: 'Failed to fix QR codes' }, { status: 500 });
  }
}
