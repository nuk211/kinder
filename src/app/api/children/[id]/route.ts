import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest) {
  try {
    // Extract the `id` from the request URL
    const url = new URL(request.url);
    const childId = url.pathname.split('/').pop();

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Check if the child exists
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Delete attendance records related to the child
    await prisma.attendance.deleteMany({ where: { childId } });

    // Delete the child
    await prisma.child.delete({ where: { id: childId } });

    return NextResponse.json({ message: 'Child deleted successfully' });
  } catch (error) {
    console.error('Error deleting child:', error);
    return NextResponse.json({ error: 'Failed to delete child' }, { status: 500 });
  }
}
