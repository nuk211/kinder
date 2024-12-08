// src/app/api/parents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const parentUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phoneNumber: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const parent = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: 'PARENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        children: {
          select: {
            id: true,
            name: true,
            status: true,
          }
        }
      }
    })

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(parent)
  } catch (error) {
    console.error('Error fetching parent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parent' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = parentUpdateSchema.parse(body)
    
    // Check if parent exists
    const existingParent = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: 'PARENT'
      }
    })
    
    if (!existingParent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      )
    }
    
    // If email is being updated, check if it's already in use
    if (validatedData.email && validatedData.email !== existingParent.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })
      
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }
    
    // Update parent
    const updatedParent = await prisma.user.update({
      where: { id: params.id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true
      }
    })
    
    return NextResponse.json(updatedParent)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating parent:', error)
    return NextResponse.json(
      { error: 'Failed to update parent' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if parent exists and has no children
    const parent = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: 'PARENT'
      },
      include: {
        children: true
      }
    })
    
    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      )
    }
    
    if (parent.children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete parent with existing children' },
        { status: 400 }
      )
    }
    
    // Delete parent
    await prisma.user.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json(
      { message: 'Parent deleted successfully' }
    )
  } catch (error) {
    console.error('Error deleting parent:', error)
    return NextResponse.json(
      { error: 'Failed to delete parent' },
      { status: 500 }
    )
  }
}