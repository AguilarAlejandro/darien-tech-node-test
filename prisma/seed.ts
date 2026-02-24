import { PrismaClient, ApiKeyRole, AlertKind } from '@prisma/client'

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

  // --- Locations ---
  const location1 = await prisma.location.upsert({
    where: { id: 'cfaa672e-cf6e-4192-8736-254ca954928c' },
    update: {},
    create: {
      id: 'cfaa672e-cf6e-4192-8736-254ca954928c',
      name: 'Torre de Innovación Norte',
      latitude: 19.4326,
      longitude: -99.1332,
    },
  })

  const location2 = await prisma.location.upsert({
    where: { id: '3f1c44fe-d226-4c7a-9192-15c547011bda' },
    update: {},
    create: {
      id: '3f1c44fe-d226-4c7a-9192-15c547011bda',
      name: 'Hub Creativo Sur',
      latitude: 19.4284,
      longitude: -99.1671,
    },
  })

  console.log(`✅ Locations: ${location1.name}, ${location2.name}`)

  // --- Spaces ---
  const space1 = await prisma.space.upsert({
    where: { id: 'b6194839-7438-4587-a52e-eeef27d00282' },
    update: {},
    create: {
      id: 'b6194839-7438-4587-a52e-eeef27d00282',
      locationId: location1.id,
      name: 'Sala Azul',
      reference: 'Piso 3, Ala oeste',
      capacity: 8,
      description: 'Sala de reuniones con proyector y pizarrón inteligente.',
    },
  })

  const space2 = await prisma.space.upsert({
    where: { id: '7058a9a0-0fe6-4b77-b926-43ab0051eaee' },
    update: {},
    create: {
      id: '7058a9a0-0fe6-4b77-b926-43ab0051eaee',
      locationId: location1.id,
      name: 'Área Colaborativa Verde',
      reference: 'Piso 1',
      capacity: 20,
      description: 'Espacio abierto con mesas modulares para trabajo en equipo.',
    },
  })

  const space3 = await prisma.space.upsert({
    where: { id: 'd7ec71e6-263f-4cf2-a712-9e842f7694f4' },
    update: {},
    create: {
      id: 'd7ec71e6-263f-4cf2-a712-9e842f7694f4',
      locationId: location2.id,
      name: 'Cabina Creativa A',
      reference: 'Planta baja',
      capacity: 4,
      description: 'Cabina privada con insonorización acústica.',
    },
  })

  const space4 = await prisma.space.upsert({
    where: { id: '8a3be298-fde7-4e7f-9250-44ba968760a8' },
    update: {},
    create: {
      id: '8a3be298-fde7-4e7f-9250-44ba968760a8',
      locationId: location2.id,
      name: 'Sala Principal',
      reference: 'Piso 2',
      capacity: 30,
      description: 'Sala de conferencias para presentaciones y eventos.',
    },
  })

  console.log(`✅ Spaces: ${space1.name}, ${space2.name}, ${space3.name}, ${space4.name}`)

  // --- Office Hours ---
  const weekdays = [1, 2, 3, 4, 5]

  await prisma.officeHours.upsert({
    where: { spaceId: space1.id },
    update: {},
    create: {
      spaceId: space1.id,
      openTime: '09:00',
      closeTime: '18:00',
      timezone: 'America/Mexico_City',
      workDays: weekdays,
    },
  })

  await prisma.officeHours.upsert({
    where: { spaceId: space2.id },
    update: {},
    create: {
      spaceId: space2.id,
      openTime: '08:00',
      closeTime: '20:00',
      timezone: 'America/Mexico_City',
      workDays: weekdays,
    },
  })

  await prisma.officeHours.upsert({
    where: { spaceId: space3.id },
    update: {},
    create: {
      spaceId: space3.id,
      openTime: '09:00',
      closeTime: '17:00',
      timezone: 'America/Mexico_City',
      workDays: weekdays,
    },
  })

  await prisma.officeHours.upsert({
    where: { spaceId: space4.id },
    update: {},
    create: {
      spaceId: space4.id,
      openTime: '08:00',
      closeTime: '22:00',
      timezone: 'America/Mexico_City',
      workDays: [1, 2, 3, 4, 5, 6],
    },
  })

  // --- Device Desired (IoT config) ---
  for (const space of [space1, space2, space3, space4]) {
    await prisma.deviceDesired.upsert({
      where: { spaceId: space.id },
      update: {},
      create: {
        spaceId: space.id,
        samplingIntervalSec: 10,
        co2AlertThreshold: 1000,
      },
    })
  }

  console.log('✅ Office hours + device desired created')

  // --- Sample Bookings ---
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  await prisma.booking.upsert({
    where: { id: 'af9e6dfa-54dd-4d23-be0e-07414744e5a2' },
    update: {},
    create: {
      id: 'af9e6dfa-54dd-4d23-be0e-07414744e5a2',
      spaceId: space1.id,
      locationId: location1.id,
      clientEmail: 'ana@example.com',
      bookingDate: tomorrow,
      startTime: new Date(tomorrow.setHours(9, 0, 0, 0)),
      endTime: new Date(new Date(tomorrow).setHours(11, 0, 0, 0)),
    },
  })

  await prisma.booking.upsert({
    where: { id: 'f94ab727-6170-4189-8380-8bbf85687db8' },
    update: {},
    create: {
      id: 'f94ab727-6170-4189-8380-8bbf85687db8',
      spaceId: space2.id,
      locationId: location1.id,
      clientEmail: 'carlos@example.com',
      bookingDate: tomorrow,
      startTime: new Date(new Date(tomorrow).setHours(14, 0, 0, 0)),
      endTime: new Date(new Date(tomorrow).setHours(16, 0, 0, 0)),
    },
  })

  console.log('✅ Sample bookings created')

  // --- Sample Alerts ---
  // Provide pre-existing alert history so the Alerts tab is populated
  // without needing the IoT simulator running.
  const now = new Date()
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000)

  await prisma.alert.createMany({
    skipDuplicates: true,
    data: [
      // space3 (Cabina Creativa A) — two resolved CO2 spikes
      {
        id: '24712d6b-ba11-4d76-853e-e8cf1d11a730',
        spaceId: space3.id,
        kind: AlertKind.CO2,
        startedAt: hoursAgo(26),
        resolvedAt: hoursAgo(24),
        metaJson: { value: 1182, threshold: 1000, unit: 'ppm' },
      },
      {
        id: 'c12ad9f8-7204-478d-8490-23a14fd3732f',
        spaceId: space3.id,
        kind: AlertKind.CO2,
        startedAt: hoursAgo(6),
        resolvedAt: hoursAgo(5),
        metaJson: { value: 1067, threshold: 1000, unit: 'ppm' },
      },
      // space1 (Sala Azul) — open OCCUPANCY_MAX (still active)
      {
        id: '3e6c93ee-afcb-4a71-9756-ce0d8b600b68',
        spaceId: space1.id,
        kind: AlertKind.OCCUPANCY_MAX,
        startedAt: hoursAgo(1),
        resolvedAt: null,
        metaJson: { occupancy: 1.0, capacity: 8 },
      },
      // space2 (Área Colaborativa Verde) — resolved out-of-hours occupancy
      {
        id: '1ead58d7-5c6b-4fd5-92a1-a7294b6597b0',
        spaceId: space2.id,
        kind: AlertKind.OCCUPANCY_UNEXPECTED,
        startedAt: hoursAgo(14),
        resolvedAt: hoursAgo(13),
        metaJson: { occupancy: 0.15, outOfHours: true },
      },
      // space4 (Sala Principal) — open CO2 alert
      {
        id: 'bdf07ac7-f844-4af3-9b47-8c57fc75808d',
        spaceId: space4.id,
        kind: AlertKind.CO2,
        startedAt: hoursAgo(2),
        resolvedAt: null,
        metaJson: { value: 1340, threshold: 1000, unit: 'ppm' },
      },
    ],
  })

  console.log('✅ Sample alerts created')

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
