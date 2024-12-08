const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@kindergarten.com',
      password: await bcrypt.hash('admin123', 12),
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Create parent users
  const janeDoe = await prisma.user.create({
    data: {
      email: 'jane.doe@example.com',
      password: await bcrypt.hash('parent123', 12),
      name: 'Jane Doe',
      role: 'PARENT',
      phoneNumber: '+1234567890',
    },
  });

  const peterParker = await prisma.user.create({
    data: {
      email: 'peter.parker@example.com',
      password: await bcrypt.hash('parent123', 12),
      name: 'Peter Parker',
      role: 'PARENT',
      phoneNumber: '+9647701613172',
    },
  });

  const elsaPataky = await prisma.user.create({
    data: {
      email: 'elsa.pataky@example.com',
      password: await bcrypt.hash('parent123', 12),
      name: 'Elsa Pataky',
      role: 'PARENT',
      phoneNumber: '+2233445566',
    },
  });

  // Create children linked to parents using parentId
  await prisma.child.createMany({
    data: [
      {
        name: 'John Doe',
        parentId: janeDoe.id,
        status: 'PRESENT',
        qrCode: 'QR123',
      },
      {
        name: 'Mary Jane',
        parentId: peterParker.id,
        status: 'ABSENT',
        qrCode: 'QR124',
      },
      {
        name: 'Chris Hemsworth',
        parentId: elsaPataky.id,
        status: 'PRESENT',
        qrCode: 'QR125',
      },
    ],
  });

  // Fetch created children
  const createdChildren = await prisma.child.findMany({
    where: {
      qrCode: { in: ['QR123', 'QR124', 'QR125'] }
    }
  });

  // Create attendance records
  await prisma.attendance.createMany({
    data: createdChildren.map((child: { id: string; status: string }) => ({
      childId: child.id,
      status: child.status === 'PRESENT' ? 'PRESENT' : 'ABSENT',
      date: new Date(),
    })),
  });

  console.log('Seed data created successfully');
  console.log('\nTest credentials:');
  console.log('Admin - Email: admin@kindergarten.com, Password: admin123');
  console.log('Parent - Email: jane.doe@example.com, Password: parent123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
