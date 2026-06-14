import prisma from './prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Starting seed...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Try direct access
  try {
    await (prisma as any).admin.upsert({
      where: { username: 'admin' },
      update: { password: hashedPassword },
      create: {
        username: 'admin',
        password: hashedPassword,
      },
    });
    console.log('Admin seeded successfully.');
  } catch (err: any) {
    console.error('Failed to seed admin:', err.message);
  }

  const services = [
    { id: 's1', name: 'Corte de Cabelo', description: 'Corte clássico ou moderno com acabamento premium', price: 50.0, duration: 30 },
    { id: 's2', name: 'Barba Completa', description: 'Aparação, desenho e toalha quente', price: 35.0, duration: 25 },
    { id: 's3', name: 'Combo: Corte + Barba', description: 'O pacote completo para o seu visual', price: 75.0, duration: 50 },
    { id: 's4', name: 'Pezinho e Acabamento', description: 'Limpeza rápida das laterais e nuca', price: 20.0, duration: 15 },
    { id: 's5', name: 'Sombrancelha na Navalha', description: 'Desenho preciso com acabamento na lâmina', price: 15.0, duration: 10 },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }

  const barbers = [
    { id: 'b1', name: 'Marcelo Simões', email: 'marcelo@barbearia.com' },
    { id: 'b2', name: 'João Silva', email: 'joao@barbearia.com' },
    { id: 'b3', name: 'Ricardo Oliveira', email: 'ricardo@barbearia.com' },
    { id: 'b4', name: 'Felipe Santos', email: 'felipe@barbearia.com' },
  ];

  for (const b of barbers) {
    const barber = await prisma.barber.upsert({
      where: { email: b.email },
      update: b,
      create: b,
    });

    // Create default schedules (Mon-Fri 09:00-18:00)
    for (let day = 1; day <= 5; day++) {
      await prisma.workSchedule.upsert({
        where: { id: `${barber.id}-${day}` }, // Using a composite-like ID for seed
        update: { startTime: '09:00', endTime: '18:00', isActive: true },
        create: {
          id: `${barber.id}-${day}`,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '18:00',
          barberId: barber.id
        }
      });
    }
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
