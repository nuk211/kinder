// src/lib/validations/parent.ts
import { z } from 'zod'

export const parentCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional().nullable(),
})

export const parentUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phoneNumber: z.string().optional().nullable(),
})

export type ParentCreate = z.infer<typeof parentCreateSchema>
export type ParentUpdate = z.infer<typeof parentUpdateSchema>