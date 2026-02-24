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
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Torre de Innovación Norte',
      latitude: 19.4326,
      longitude: -99.1332,
    },
  })

  const location2 = await prisma.location.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Hub Creativo Sur',
      latitude: 19.4284,
      longitude: -99.1671,
    },
  })

  console.log(`✅ Locations: ${location1.name}, ${location2.name}`)

  // --- Spaces ---
  const space1 = await prisma.space.upsert({
    where: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    update: {},
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      locationId: location1.id,
      name: 'Sala Azul',
      reference: 'Piso 3, Ala oeste',
      capacity: 8,
      description: 'Sala de reuniones con proyector y pizarrón inteligente.',
    },
  })

  const space2 = await prisma.space.upsert({
    where: { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
    update: {},
    create: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      locationId: location1.id,
      name: 'Área Colaborativa Verde',
      reference: 'Piso 1',
      capacity: 20,
      description: 'Espacio abierto con mesas modulares para trabajo en equipo.',
    },
  })

  const space3 = await prisma.space.upsert({
    where: { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' },
    update: {},
    create: {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      locationId: location2.id,
      name: 'Cabina Creativa A',
      reference: 'Planta baja',
      capacity: 4,
      description: 'Cabina privada con insonorización acústica.',
    },
  })

  const space4 = await prisma.space.upsert({
    where: { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd' },
    update: {},
    create: {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
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
    where: { id: 'res00001-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'res00001-0000-0000-0000-000000000001',
      spaceId: space1.id,
      locationId: location1.id,
      clientEmail: 'ana@example.com',
      bookingDate: tomorrow,
      startTime: new Date(tomorrow.setHours(9, 0, 0, 0)),
      endTime: new Date(new Date(tomorrow).setHours(11, 0, 0, 0)),
    },
  })

  await prisma.booking.upsert({
    where: { id: 'res00002-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'res00002-0000-0000-0000-000000000002',
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
        id: 'alert001-0000-0000-0000-000000000001',
        spaceId: space3.id,
        kind: AlertKind.CO2,
        startedAt: hoursAgo(26),
        resolvedAt: hoursAgo(24),
        metaJson: { value: 1182, threshold: 1000, unit: 'ppm' },
      },
      {
        id: 'alert002-0000-0000-0000-000000000002',
        spaceId: space3.id,
        kind: AlertKind.CO2,
        startedAt: hoursAgo(6),
        resolvedAt: hoursAgo(5),
        metaJson: { value: 1067, threshold: 1000, unit: 'ppm' },
      },
      // space1 (Sala Azul) — open OCCUPANCY_MAX (still active)
      {
        id: 'alert003-0000-0000-0000-000000000003',
        spaceId: space1.id,
        kind: AlertKind.OCCUPANCY_MAX,
        startedAt: hoursAgo(1),
        resolvedAt: null,
        metaJson: { occupancy: 1.0, capacity: 8 },
      },
      // space2 (Área Colaborativa Verde) — resolved out-of-hours occupancy
      {
        id: 'alert004-0000-0000-0000-000000000004',
        spaceId: space2.id,
        kind: AlertKind.OCCUPANCY_UNEXPECTED,
        startedAt: hoursAgo(14),
        resolvedAt: hoursAgo(13),
        metaJson: { occupancy: 0.15, outOfHours: true },
      },
      // space4 (Sala Principal) — open CO2 alert
      {
        id: 'alert005-0000-0000-0000-000000000005',
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
