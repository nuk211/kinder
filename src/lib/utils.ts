import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { hash, compare } from 'bcryptjs';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export async function hashPassword(password: string) {
  return await hash(password, 12);
}

export async function verifyPassword(input: string, hashedPassword: string) {
  return await compare(input, hashedPassword);
}