/* eslint-disable @typescript-eslint/no-explicit-any */

import { ReservationService } from '@/services/reservation.service';

const mockReservationRepo = {
  findActiveByPasienTanggal: jest.fn(),
  findActiveByDoctorTanggalJam: jest.fn(),
  create: jest.fn(),
} as any;

const mockDoctorRepo = {
  findByIdWithSchedules: jest.fn(),
  findById: jest.fn(),
} as any;

const mockUserRepo = {
  findById: jest.fn(),
} as any;

const mockPaymentService = {
  buatPayment: jest.fn(),
} as any;

describe('Test Fungsi buatReservasi', () => {
  let service: ReservationService;

  beforeEach(() => {
    service = new ReservationService(
      mockReservationRepo,
      mockDoctorRepo,
      mockUserRepo,
      mockPaymentService
    );

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-11T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('harus error kalau booking di hari Minggu karena klinik libur', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'pasien-1' });

    const tanggalMinggu = new Date('2026-05-17');

    try {
      await service.buatReservasi({
        pasienId: 'pasien-1',
        doctorId: 'dokter-1',
        tanggal: tanggalMinggu,
        jam: '09:00',
      });
    } catch (error: any) {
      expect(error.code).toBe('KLINIK_TUTUP');
    }
  });

  it('harus gagal kalau jamnya udah dibooking orang lain', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'pasien-1' });
    mockReservationRepo.findActiveByPasienTanggal.mockResolvedValue([]);
    mockDoctorRepo.findByIdWithSchedules.mockResolvedValue({ id: 'dokter-1' });

    mockReservationRepo.findActiveByDoctorTanggalJam.mockResolvedValue([{ id: 'reservasi-lama' }]);

    const tanggalSenin = new Date('2026-05-18');

    await expect(
      service.buatReservasi({
        pasienId: 'pasien-1',
        doctorId: 'dokter-1',
        tanggal: tanggalSenin,
        jam: '09:00',
      })
    ).rejects.toThrow();
  });

  it('berhasil simpan reservasi dan dapat token midtrans', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'pasien-1' });
    mockReservationRepo.findActiveByPasienTanggal.mockResolvedValue([]);

    mockDoctorRepo.findByIdWithSchedules.mockResolvedValue({
      id: 'dokter-1',
      schedules: [{ hari: 1, jamMulai: '09:00', jamSelesai: '12:00' }],
    });

    mockReservationRepo.findActiveByDoctorTanggalJam.mockResolvedValue([]);
    mockDoctorRepo.findById.mockResolvedValue({ id: 'dokter-1' });

    mockReservationRepo.create.mockResolvedValue({
      id: 'reservasi-baru',
      status: 'PENDING',
    });

    mockPaymentService.buatPayment.mockResolvedValue({
      snapToken: 'token-midtrans-123',
    });

    const result = await service.buatReservasi({
      pasienId: 'pasien-1',
      doctorId: 'dokter-1',
      tanggal: new Date('2026-05-18'),
      jam: '09:00',
    });

    expect(result.reservation.status).toBe('PENDING');
    expect(result.snapToken).toBe('token-midtrans-123');
  });
});
