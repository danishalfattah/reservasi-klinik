/* eslint-disable @typescript-eslint/no-explicit-any */

import { ReservationService } from '@/services/reservation.service';

describe('Test Fungsi validasiWindowDanHari', () => {
  let service: ReservationService;

  beforeEach(() => {
    service = new ReservationService({} as any, {} as any, {} as any, {} as any);
  });

  it('gagal kalau pesen buat hari ini juga (selisih hari = 0)', () => {
    const result = service.validasiWindowDanHari(new Date('2026-05-18'), 0);

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('BOOKING_TOO_SOON');
  });

  it('gagal kalau pesennya kejauhan (lebih dari 30 hari ke depan)', () => {
    const result = service.validasiWindowDanHari(new Date('2026-06-18'), 31);

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('BOOKING_TOO_FAR');
  });

  it('gagal kalau pas hari Minggu, biarpun selisih harinya wajar', () => {
    const hariMinggu = new Date('2026-05-17');
    const result = service.validasiWindowDanHari(hariMinggu, 5);

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('KLINIK_TUTUP');
  });

  it('sukses tervalidasi kalau jarak harinya pas dan bukan hari libur', () => {
    const hariSenin = new Date('2026-05-18');
    const result = service.validasiWindowDanHari(hariSenin, 5);

    expect(result.valid).toBe(true);
  });
});
