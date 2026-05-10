import { PrismaClient, ReservationStatus } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// --- Helper functions to stay under complexity & line limits ---

async function cleanDatabase(): Promise<void> {
  console.warn('Menghapus data lama...');
  await prisma.payment.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();
}

async function seedAdmin(password: string): Promise<void> {
  console.warn('Membuat Admin...');
  await prisma.user.create({
    data: { name: 'Administrator', email: 'admin@test.com', password, role: 'ADMIN' },
  });
}

interface SeedDoctor { id: string; doctorId: string }

async function seedDoctors(password: string): Promise<SeedDoctor[]> {
  console.warn('Membuat 3 Dokter...');
  const list = [
    { name: 'Dr. Andi Pratama', email: 'dr.andi@test.com', spesialis: 'Dokter Umum' },
    { name: 'Dr. Budi Santoso', email: 'dr.budi@test.com', spesialis: 'Dokter Gigi' },
    { name: 'Dr. Citra Lestari', email: 'dr.citra@test.com', spesialis: 'Dokter Anak' },
  ];

  const result: SeedDoctor[] = [];
  for (const doc of list) {
    const user = await prisma.user.create({
      data: { name: doc.name, email: doc.email, password, role: 'DOKTER' },
    });
    const doctor = await prisma.doctor.create({
      data: { userId: user.id, spesialis: doc.spesialis, tarif: 150000, durasiMenit: 30 },
    });
    result.push({ id: user.id, doctorId: doctor.id });
  }
  return result;
}

interface SeedSchedule { doctorId: string; jamMulai: string }

async function seedSchedules(doctors: SeedDoctor[]): Promise<SeedSchedule[]> {
  console.warn('Membuat Jadwal Dokter...');
  const schedules: SeedSchedule[] = [];
  for (const doc of doctors) {
    for (let i = 1; i <= 5; i++) {
      await prisma.schedule.create({
        data: { doctorId: doc.doctorId, hari: i, jamMulai: '09:00', jamSelesai: '14:00' },
      });
      schedules.push({ doctorId: doc.doctorId, jamMulai: '09:00' });
    }
  }
  return schedules;
}

async function seedPatients(password: string): Promise<string[]> {
  console.warn('Membuat 5 Pasien...');
  const names = ['Satu', 'Dua', 'Tiga', 'Empat', 'Lima'];
  const ids: string[] = [];
  for (let i = 0; i < names.length; i++) {
    const user = await prisma.user.create({
      data: { name: `Pasien ${names[i]}`, email: `patient${i + 1}@test.com`, password, role: 'PASIEN' },
    });
    ids.push(user.id);
  }
  return ids;
}

async function seedReservations(patientIds: string[], schedules: SeedSchedule[]): Promise<void> {
  console.warn('Membuat data Reservasi...');
  const statuses: ReservationStatus[] = ['PENDING', 'CONFIRMED', 'DONE', 'CANCELLED'];

  for (let i = 0; i < patientIds.length; i++) {
    const sched = schedules[i % schedules.length];
    const status = statuses[i % statuses.length];
    const resDate = new Date();
    resDate.setDate(resDate.getDate() + (i + 1));

    const reservation = await prisma.reservation.create({
      data: {
        pasienId: patientIds[i], doctorId: sched.doctorId,
        tanggal: resDate, jam: sched.jamMulai, status, nomorAntrian: i + 1,
      },
    });

    await seedPaymentForReservation(reservation.id, status);
  }
}

async function seedPaymentForReservation(reservationId: string, status: ReservationStatus): Promise<void> {
  if (status !== 'CONFIRMED' && status !== 'DONE') return;

  await prisma.payment.create({
    data: {
      reservationId, amount: 150000, status: 'PAID',
      midtransOrderId: `seed-order-${reservationId}`,
      snapToken: `seed-snap-${reservationId}`,
      paidAt: new Date(),
    },
  });
}

// --- Entry point ---

async function main(): Promise<void> {
  console.warn('🌱 Memulai proses seeding database...');
  await cleanDatabase();

  const password = await hashPassword('password123');
  await seedAdmin(password);
  const doctors = await seedDoctors(password);
  const schedules = await seedSchedules(doctors);
  const patientIds = await seedPatients(password);
  await seedReservations(patientIds, schedules);

  console.warn('✅ Seeding database selesai!');
  console.warn(`
  ==== DAFTAR AKUN TEST ====
  Password untuk semua akun: password123
  
  Admin: admin@test.com
  Dokter: dr.andi@test.com
  Pasien: patient1@test.com
  ==========================
  `);
}

main()
  .catch((e) => {
    console.error('❌ Gagal melakukan seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
