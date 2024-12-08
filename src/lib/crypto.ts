// src/lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// We'll use the NEXTAUTH_SECRET as our encryption key
const ENCRYPTION_KEY = process.env.NEXTAUTH_SECRET || '';
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

// Ensure the key is the right length
const getKey = () => {
  return Buffer.from(ENCRYPTION_KEY).slice(0, 32);
};

export function encrypt(text: string) {
  try {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
}

export function decrypt(text: string) {
  try {
    const [ivHex, encryptedHex] = text.split(':');
    if (!ivHex || !encryptedHex) return text;
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    return text;
  }
}