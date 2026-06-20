import prisma from './prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Starting SaaS multi-tenant seed...');
  
  // 1. Create a default Barbershop (Tenant) - accessible at /demo
  const barbershop = await prisma.barbershop.upsert({
    where: { id: 'bs1' },
    update: {
      name: 'Barbearia Scheasy',
      slug: 'demo',
      phone: '11999999999',
      address: 'Rua da Barbearia, 123 - São Paulo, SP',
    },
    create: {
      id: 'bs1',
      name: 'Barbearia Scheasy',
      slug: 'demo',
      phone: '11999999999',
      address: 'Rua da Barbearia, 123 - São Paulo, SP',
    }
  });

  console.log(`[SEED] Barbershop created: ${barbershop.name} (Slug: ${barbershop.slug})`);

  // 2. Create Admin linked to Barbershop
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  try {
    await prisma.admin.upsert({
      where: { username: 'admin' },
      update: { password: hashedPassword, barbershopId: barbershop.id },
      create: {
        username: 'admin',
        password: hashedPassword,
        barbershopId: barbershop.id
      },
    });
    console.log('[SEED] Admin seeded successfully.');
  } catch (err: any) {
    console.error('Failed to seed admin:', err.message);
  }

  // 3. Create Services
  const services = [
    { id: 's1', name: 'Corte de Cabelo', description: 'Corte clássico ou moderno com acabamento premium', price: 50.0, duration: 30, barbershopId: barbershop.id },
    { id: 's2', name: 'Barba Completa', description: 'Aparação, desenho e toalha quente', price: 35.0, duration: 25, barbershopId: barbershop.id },
    { id: 's3', name: 'Combo: Corte + Barba', description: 'O pacote completo para o seu visual', price: 75.0, duration: 50, barbershopId: barbershop.id },
    { id: 's4', name: 'Pezinho e Acabamento', description: 'Limpeza rápida das laterais e nuca', price: 20.0, duration: 15, barbershopId: barbershop.id },
    { id: 's5', name: 'Sombrancelha na Navalha', description: 'Desenho preciso com acabamento na lâmina', price: 15.0, duration: 10, barbershopId: barbershop.id },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }
  console.log('[SEED] Services seeded successfully.');

  // 4. Create Barbers
  const barbers = [
    { id: 'b1', name: 'Marcelo Simões', email: 'marcelo@barbearia.com', barbershopId: barbershop.id },
    { id: 'b2', name: 'João Silva', email: 'joao@barbearia.com', barbershopId: barbershop.id },
    { id: 'b3', name: 'Ricardo Oliveira', email: 'ricardo@barbearia.com', barbershopId: barbershop.id },
    { id: 'b4', name: 'Felipe Santos', email: 'felipe@barbearia.com', barbershopId: barbershop.id },
  ];

  for (const b of barbers) {
    const barber = await prisma.barber.upsert({
      where: { email_barbershopId: { email: b.email, barbershopId: barbershop.id } },
      update: b,
      create: b,
    });

    // Create default schedules (Mon-Fri 09:00-18:00)
    for (let day = 1; day <= 5; day++) {
      await prisma.workSchedule.upsert({
        where: { id: `${barber.id}-${day}` }, 
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
  console.log('[SEED] Barbers & Schedules seeded successfully.');

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
