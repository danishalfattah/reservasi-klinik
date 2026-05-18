/* eslint-disable @typescript-eslint/no-explicit-any */

import { ReservationService } from '@/services/reservation.service';
import { NotFoundError } from '@/lib/errors';

// Mocking repo seadanya aja
const mockReservationRepo = {
  findActiveByDoctorTanggalJam: jest.fn(),
} as any;

const mockDoctorRepo = {
  findByIdWithSchedules: jest.fn(),
} as any;

describe('Test Fungsi cekKetersediaanSlot', () => {
  let service: ReservationService;

  beforeEach(() => {
    service = new ReservationService(mockReservationRepo, mockDoctorRepo, {} as any, {} as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('bakal error (NotFoundError) kalau id dokter ngawur / ga ada di DB', async () => {
    mockDoctorRepo.findByIdWithSchedules.mockResolvedValue(null);

    await expect(
      service.cekKetersediaanSlot('dokter-ngawur', new Date('2026-05-18'), '09:00')
    ).rejects.toThrow(NotFoundError);
  });

  it('return false kalau bookingnya buat hari Minggu (Klinik libur)', async () => {
    mockDoctorRepo.findByIdWithSchedules.mockResolvedValue({ id: 'dokter-1' });

    const hariMinggu = new Date('2026-05-17');
    const result = await service.cekKetersediaanSlot('dokter-1', hariMinggu, '09:00');

    expect(result).toBe(false);
  });

  it('return false kalau jam booking di luar jam buka klinik (misal jam 2 pagi)', async () => {
    mockDoctorRepo.findByIdWithSchedules.mockResolvedValue({ id: 'dokter-1' });

    const hariSenin = new Date('2026-05-18');
    const result = await service.cekKetersediaanSlot('dokter-1', hariSenin, '02:00');

    expect(result).toBe(false);
  });

  it('return false kalau jamnya di luar jadwal praktik si dokter', async () => {
    mockDoctorRepo.findByIdWithSchedules.mockResolvedValue({
      id: 'dokter-1',
      schedules: [{ hari: 1, jamMulai: '09:00', jamSelesai: '12:00' }],
    });

    const hariSenin = new Date('2026-05-18');
    const result = await service.cekKetersediaanSlot('dokter-1', hariSenin, '15:00');

    expect(result).toBe(false);
  });

  it('return false kalau slot jam tersebut udah dibooking pasien lain (bentrok)', async () => {
    mockDoctorRepo.findByIdWithSchedules.mockResolvedValue({
      id: 'dokter-1',
      schedules: [{ hari: 1, jamMulai: '09:00', jamSelesai: '12:00' }],
    });

    mockReservationRepo.findActiveByDoctorTanggalJam.mockResolvedValue([
      { id: 'reservasi-orang-lain' },
    ]);

    const result = await service.cekKetersediaanSlot('dokter-1', new Date('2026-05-18'), '09:00');
    expect(result).toBe(false);
  });

  it('return true kalau semua aman dan slotnya kosong', async () => {
    mockDoctorRepo.findByIdWithSchedules.mockResolvedValue({
      id: 'dokter-1',
      schedules: [{ hari: 1, jamMulai: '09:00', jamSelesai: '12:00' }],
    });

    mockReservationRepo.findActiveByDoctorTanggalJam.mockResolvedValue([]);

    const result = await service.cekKetersediaanSlot('dokter-1', new Date('2026-05-18'), '09:00');
    expect(result).toBe(true);
  });
});
