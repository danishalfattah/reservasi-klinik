/* eslint-disable @typescript-eslint/no-explicit-any */

import { ReservationService } from '@/services/reservation.service';

const mockReservationRepo = {
  findActiveByPasienTanggal: jest.fn(),
} as any;

const mockUserRepo = {
  findById: jest.fn(),
} as any;

describe('Test Fungsi validasiReservasi', () => {
  let service: ReservationService;

  beforeEach(() => {
    service = new ReservationService(mockReservationRepo, {} as any, mockUserRepo, {} as any);
  });

  it('return PASIEN_NOT_FOUND kalau usernya ngasal / ga ada di DB', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    const result = await service.validasiReservasi({
      pasienId: 'user-ngasal',
      tanggal: new Date('2026-05-18'),
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('PASIEN_NOT_FOUND');
  });

  it('gagal kalau pesennya buat hari ini juga (dadakan)', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'pasien-1' });

    const result = await service.validasiReservasi({
      pasienId: 'pasien-1',
      tanggal: new Date('2026-05-11'),
      now: new Date('2026-05-11'),
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('BOOKING_TOO_SOON');
  });

  it('gagal kalau pasien sudah punya bookingan aktif di tanggal yang sama (duplikat)', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'pasien-1' });

    mockReservationRepo.findActiveByPasienTanggal.mockResolvedValue([
      { id: 'reservasi-lama-pasien' },
    ]);

    const result = await service.validasiReservasi({
      pasienId: 'pasien-1',
      tanggal: new Date('2026-05-18'),
      now: new Date('2026-05-11'),
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('RESERVASI_DUPLIKAT');
  });

  it('sukses tervalidasi kalau semua syarat terpenuhi', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'pasien-1' });
    mockReservationRepo.findActiveByPasienTanggal.mockResolvedValue([]);

    const result = await service.validasiReservasi({
      pasienId: 'pasien-1',
      tanggal: new Date('2026-05-18'),
      now: new Date('2026-05-11'),
    });

    expect(result.valid).toBe(true);
  });
});
