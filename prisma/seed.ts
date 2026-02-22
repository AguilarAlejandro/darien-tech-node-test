import { PrismaClient, ApiKeyRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // --- API Keys ---
  const adminKey = await prisma.apiKey.upsert({
    where: { key: 'admin-secret-key-123' },
    update: {},
    create: {
      key: 'admin-secret-key-123',
      role: ApiKeyRole.ADMIN,
      label: 'Admin Key (dev)',
    },
  })

  const userKey = await prisma.apiKey.upsert({
    where: { key: 'user-secret-key-456' },
    update: {},
    create: {
      key: 'user-secret-key-456',
      role: ApiKeyRole.USER,
      label: 'User Key (dev)',
    },
  })

  console.log(`✅ API Keys created: admin=${adminKey.key}, user=${userKey.key}`)

  // --- Lugares ---
  const lugar1 = await prisma.lugar.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'Torre de Innovación Norte',
      latitud: 19.4326,
      longitud: -99.1332,
    },
  })

  const lugar2 = await prisma.lugar.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      nombre: 'Hub Creativo Sur',
      latitud: 19.4284,
      longitud: -99.1671,
    },
  })

  console.log(`✅ Lugares: ${lugar1.nombre}, ${lugar2.nombre}`)

  // --- Espacios ---
  const sala1 = await prisma.espacio.upsert({
    where: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    update: {},
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      lugarId: lugar1.id,
      nombre: 'Sala Azul',
      referencia: 'Piso 3, Ala oeste',
      capacidad: 8,
      descripcion: 'Sala de reuniones con proyector y pizarrón inteligente.',
    },
  })

  const sala2 = await prisma.espacio.upsert({
    where: { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
    update: {},
    create: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      lugarId: lugar1.id,
      nombre: 'Área Colaborativa Verde',
      referencia: 'Piso 1',
      capacidad: 20,
      descripcion: 'Espacio abierto con mesas modulares para trabajo en equipo.',
    },
  })

  const sala3 = await prisma.espacio.upsert({
    where: { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' },
    update: {},
    create: {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      lugarId: lugar2.id,
      nombre: 'Cabina Creativa A',
      referencia: 'Planta baja',
      capacidad: 4,
      descripcion: 'Cabina privada con insonorización acústica.',
    },
  })

  const sala4 = await prisma.espacio.upsert({
    where: { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd' },
    update: {},
    create: {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      lugarId: lugar2.id,
      nombre: 'Sala Principal',
      referencia: 'Piso 2',
      capacidad: 30,
      descripcion: 'Sala de conferencias para presentaciones y eventos.',
    },
  })

  console.log(`✅ Espacios: ${sala1.nombre}, ${sala2.nombre}, ${sala3.nombre}, ${sala4.nombre}`)

  // --- Office Hours ---
  const weekdays = [1, 2, 3, 4, 5]

  await prisma.officeHours.upsert({
    where: { espacioId: sala1.id },
    update: {},
    create: {
      espacioId: sala1.id,
      apertura: '09:00',
      cierre: '18:00',
      timezone: 'America/Mexico_City',
      diasLaborales: weekdays,
    },
  })

  await prisma.officeHours.upsert({
    where: { espacioId: sala2.id },
    update: {},
    create: {
      espacioId: sala2.id,
      apertura: '08:00',
      cierre: '20:00',
      timezone: 'America/Mexico_City',
      diasLaborales: weekdays,
    },
  })

  await prisma.officeHours.upsert({
    where: { espacioId: sala3.id },
    update: {},
    create: {
      espacioId: sala3.id,
      apertura: '09:00',
      cierre: '17:00',
      timezone: 'America/Mexico_City',
      diasLaborales: weekdays,
    },
  })

  await prisma.officeHours.upsert({
    where: { espacioId: sala4.id },
    update: {},
    create: {
      espacioId: sala4.id,
      apertura: '08:00',
      cierre: '22:00',
      timezone: 'America/Mexico_City',
      diasLaborales: [1, 2, 3, 4, 5, 6],
    },
  })

  // --- Device Desired (IoT config) ---
  for (const espacio of [sala1, sala2, sala3, sala4]) {
    await prisma.deviceDesired.upsert({
      where: { espacioId: espacio.id },
      update: {},
      create: {
        espacioId: espacio.id,
        samplingIntervalSec: 10,
        co2AlertThreshold: 1000,
      },
    })
  }

  console.log('✅ Office hours + device desired created')

  // --- Sample Reservations ---
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  await prisma.reserva.upsert({
    where: { id: 'res00001-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'res00001-0000-0000-0000-000000000001',
      espacioId: sala1.id,
      lugarId: lugar1.id,
      emailCliente: 'ana@example.com',
      fechaDeReserva: tomorrow,
      horaInicio: new Date(tomorrow.setHours(9, 0, 0, 0)),
      horaFin: new Date(new Date(tomorrow).setHours(11, 0, 0, 0)),
    },
  })

  await prisma.reserva.upsert({
    where: { id: 'res00002-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'res00002-0000-0000-0000-000000000002',
      espacioId: sala2.id,
      lugarId: lugar1.id,
      emailCliente: 'carlos@example.com',
      fechaDeReserva: tomorrow,
      horaInicio: new Date(new Date(tomorrow).setHours(14, 0, 0, 0)),
      horaFin: new Date(new Date(tomorrow).setHours(16, 0, 0, 0)),
    },
  })

  console.log('✅ Sample reservations created')

  console.log('\n🎉 Seed complete!')
  console.log(`\n📋 Dev API Keys:`)
  console.log(`   Admin: admin-secret-key-123`)
  console.log(`   User:  user-secret-key-456`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
