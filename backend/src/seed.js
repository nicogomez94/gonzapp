require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Planes
  const basicPlan = await prisma.plan.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Básico',
      price: 30000,
      maxImages: 6,
      daysActive: 30,
      features: ['Publicación por 30 días', '6 imágenes del vehículo', 'Contacto por WhatsApp']
    }
  });

  const intermediatePlan = await prisma.plan.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Intermedio',
      price: 55000,
      maxImages: 8,
      daysActive: 30,
      features: ['Publicación por 30 días', '8 imágenes del vehículo', 'Informe de Dominio y Multas', 'Insignia "Documentación Verificada"', 'Contacto por WhatsApp']
    }
  });

  const premiumPlan = await prisma.plan.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Premium',
      price: 80000,
      maxImages: 10,
      daysActive: 30,
      features: ['Publicación por 30 días', '10 imágenes del vehículo', 'Informe de Dominio y Multas', 'Insignia "Documentación Verificada"', '15% descuento en Honorarios de Gestoría', 'Contacto por WhatsApp']
    }
  });

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@autozona.com' },
    update: {},
    create: {
      email: 'admin@autozona.com',
      password: adminPassword,
      name: 'Administrador',
      phone: '2665016253',
      role: 'ADMIN'
    }
  });

  // Sample user
  const userPassword = await bcrypt.hash('user123', 10);
  const sampleUser = await prisma.user.upsert({
    where: { email: 'juan@example.com' },
    update: {},
    create: {
      email: 'juan@example.com',
      password: userPassword,
      name: 'Juan Martínez',
      phone: '1150001234',
      role: 'USER',
      planId: intermediatePlan.id
    }
  });

  // Sample listings
  const listings = [
    {
      title: 'Toyota Hilux SRX 4×4 2.8 TDI Automática',
      brand: 'Toyota',
      model: 'Hilux SRX',
      engine: '2.8',
      year: 2022,
      mileage: 32000,
      fuel: 'Diesel',
      transmission: 'Automático',
      description: 'Toyota Hilux SRX 4x4 2022 automática, motor 2.8 turbo diesel intercooler de 204 cv. Único dueño, siempre en concesionaria oficial para sus servicios. Cuenta con todos sus extras de fábrica: techo solar eléctrico panorámico, asientos de cuero calefaccionados, cámara de reversa 360°, pantalla táctil 9" con CarPlay y Android Auto.',
      equipment: ['Techo solar panorámico', 'Asientos de cuero calefaccionados', 'CarPlay / Android Auto', 'Cámara 360°', 'Control crucero adaptativo', 'Toyota Safety Sense'],
      priceArs: 28500000,
      priceUsd: 28500,
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&h=500&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=900&h=500&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=900&h=500&fit=crop&auto=format'
      ],
      location: 'Zona Norte, Buenos Aires',
      phone: '2665016253',
      featured: true,
      verified: true,
      userId: sampleUser.id
    },
    {
      title: 'Toyota Corolla XEI 2.0 CVT',
      brand: 'Toyota',
      model: 'Corolla XEI',
      engine: '2.0',
      year: 2024,
      mileage: 0,
      fuel: 'Nafta',
      transmission: 'CVT',
      description: 'Toyota Corolla XEI 2024 0km, de concesionaria oficial. Motor 2.0 nafta, CVT. Todos los extras incluidos de fábrica.',
      equipment: ['0 km', 'Pantalla táctil', 'Sensores de estacionamiento', 'Climatizador bi-zona'],
      priceArs: 36800000,
      priceUsd: 36800,
      images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&h=500&fit=crop&auto=format'],
      location: 'CABA',
      phone: '2665016253',
      featured: false,
      verified: true,
      userId: sampleUser.id
    },
    {
      title: 'Toyota SW4 SRX 7 asientos 4×4 AT',
      brand: 'Toyota',
      model: 'SW4 SRX',
      engine: '2.8',
      year: 2020,
      mileage: 78000,
      fuel: 'Diesel',
      transmission: 'Automático',
      description: 'Toyota SW4 SRX 7 asientos 4x4 2020. Motor diesel 2.8. Acepta permutas.',
      equipment: ['7 asientos', 'Cuero', 'Pantalla táctil', '4x4'],
      priceArs: 38200000,
      priceUsd: 38200,
      images: ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=900&h=500&fit=crop&auto=format'],
      location: 'Buenos Aires',
      phone: '2665016253',
      featured: false,
      verified: false,
      userId: sampleUser.id
    },
    {
      title: 'Ford Explorer 4WD AT 2.3 EcoBoost',
      brand: 'Ford',
      model: 'Explorer',
      engine: '2.3',
      year: 2021,
      mileage: 48000,
      fuel: 'Nafta',
      transmission: 'Automático',
      description: 'Ford Explorer 2021 4WD, motor 2.3 EcoBoost, automático. Excelente estado. Único dueño.',
      equipment: ['4WD', 'Pantalla 8"', 'Asientos de cuero', 'Techo solar'],
      priceArs: 31200000,
      priceUsd: 31200,
      images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&h=500&fit=crop&auto=format'],
      location: 'Buenos Aires',
      phone: '2665016253',
      featured: true,
      verified: true,
      userId: sampleUser.id
    },
    {
      title: 'Volkswagen Tiguan Highline 7 plazas',
      brand: 'Volkswagen',
      model: 'Tiguan Highline',
      engine: '1.4',
      year: 2023,
      mileage: 18500,
      fuel: 'Nafta',
      transmission: 'Automático',
      description: 'VW Tiguan Highline 7 plazas 2023. Motor 1.4 TSI. Muy pocos kilómetros.',
      equipment: ['7 plazas', 'Cuero', 'Pantalla 9.2"', 'Asistente de carril'],
      priceArs: 42800000,
      priceUsd: 42800,
      images: ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=900&h=500&fit=crop&auto=format'],
      location: 'Córdoba',
      phone: '2665016253',
      featured: false,
      verified: true,
      userId: sampleUser.id
    },
    {
      title: 'Honda HR-V LX CVT',
      brand: 'Honda',
      model: 'HR-V LX',
      engine: '1.8',
      year: 2022,
      mileage: 41000,
      fuel: 'Nafta',
      transmission: 'CVT',
      description: 'Honda HR-V LX 2022 CVT. Motor 1.8 nafta. Un solo dueño. Muy buen estado.',
      equipment: ['CVT', 'Pantalla táctil', 'Cámara de reversa', 'Bluetooth'],
      priceArs: 22400000,
      priceUsd: 22400,
      images: ['https://images.unsplash.com/photo-1583267746897-2cf415887172?w=900&h=500&fit=crop&auto=format'],
      location: 'Rosario',
      phone: '2665016253',
      featured: false,
      verified: false,
      userId: sampleUser.id
    },
    {
      title: 'Chevrolet Onix Plus Premier AT',
      brand: 'Chevrolet',
      model: 'Onix Plus Premier',
      engine: '1.0',
      year: 2023,
      mileage: 12000,
      fuel: 'Nafta',
      transmission: 'Automático',
      description: 'Chevrolet Onix Plus Premier 2023, automático, 1.0 turbo. Muy bajo kilometraje.',
      equipment: ['Turbo', 'Pantalla 8"', 'Apple CarPlay', 'Sensores'],
      priceArs: 18600000,
      priceUsd: 18600,
      images: ['https://images.unsplash.com/photo-1542362567-b07e54358753?w=900&h=500&fit=crop&auto=format'],
      location: 'Mendoza',
      phone: '2665016253',
      featured: false,
      verified: true,
      userId: sampleUser.id
    },
    {
      title: 'Renault Duster Oroch Outsider Plus',
      brand: 'Renault',
      model: 'Duster Oroch',
      engine: '2.0',
      year: 2021,
      mileage: 55000,
      fuel: 'Nafta',
      transmission: 'Manual',
      description: 'Renault Duster Oroch Outsider Plus 2021. Motor 2.0 nafta, manual. Muy buena pickup para trabajo y campo.',
      equipment: ['4x4', 'Caja manual', 'Aire acondicionado', 'Dirección asistida'],
      priceArs: 19800000,
      priceUsd: 19800,
      images: ['https://images.unsplash.com/photo-1547744152-14d985cb937f?w=900&h=500&fit=crop&auto=format'],
      location: 'La Plata',
      phone: '2665016253',
      featured: false,
      verified: false,
      userId: sampleUser.id
    },
    {
      title: 'Jeep Compass Longitude Plus 4WD',
      brand: 'Jeep',
      model: 'Compass Longitude',
      engine: '2.4',
      year: 2020,
      mileage: 62000,
      fuel: 'Nafta',
      transmission: 'Automático',
      description: 'Jeep Compass Longitude Plus 4WD 2020. Motor 2.4 nafta. Todo el equipamiento. Excelente estado.',
      equipment: ['4WD', 'Cuero', 'Techo panorámico', 'Uconnect 8.4"'],
      priceArs: 27500000,
      priceUsd: 27500,
      images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=900&h=500&fit=crop&auto=format'],
      location: 'Buenos Aires',
      phone: '2665016253',
      featured: false,
      verified: true,
      userId: sampleUser.id
    }
  ];

  for (const listing of listings) {
    await prisma.listing.create({ data: listing });
  }

  console.log('✅ Seed completado:');
  console.log('   Admin: admin@autozona.com / admin123');
  console.log('   User:  juan@example.com / user123');
  console.log(`   Planes: ${basicPlan.name}, ${intermediatePlan.name}, ${premiumPlan.name}`);
  console.log(`   Publicaciones: ${listings.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
