// prisma/migrations/[timestamp]_fix_passwords.ts
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/utils';

const prisma = new PrismaClient();

async function main() {
  // Get all users with encrypted passwords (those containing ':')
  const users = await prisma.user.findMany({
    where: {
      password: {
        contains: ':'
      }
    }
  });

  // Update each user with a new hashed password
  for (const user of users) {
    const tempPassword = 'Password123!'; // You can change this
    const hashedPassword = await hashPassword(tempPassword);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    console.log(`Updated password for user: ${user.email}`);
    console.log(`New temporary password is: ${tempPassword}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });