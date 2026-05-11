import { ReservationService } from '@/services/reservation.service';
import {
  TANGGAL_SENIN,
  TANGGAL_MINGGU,
  TANGGAL_KAMIS,
  makeMockReservationRepo,
  makeMockDoctorRepo,
  makeMockUserRepo,
  makeMockPaymentService,
} from './fixtures/reservation.fixtures';

// validasiWindowDanHari kini public — dapat dipanggil langsung.
// Fungsi murni (synchronous), tidak ada dependency eksternal.
describe('validasiWindowDanHari', () => {
  let service: ReservationService;

  beforeEach(() => {
    service = new ReservationService(
      makeMockReservationRepo(),
      makeMockDoctorRepo(),
      makeMockUserRepo(),
      makeMockPaymentService(),
    );
  });

  it('TC-UNIT-10 [Path 1]: returns BOOKING_TOO_SOON jika selisihHari = 0 (hari ini)', () => {
    // selisihHari=0 < BOOKING_MIN_DAYS_AHEAD(1) → terlalu dekat
    const result = service.validasiWindowDanHari(TANGGAL_SENIN, 0);

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('BOOKING_TOO_SOON');
    expect(result.errorMessage).toBe('Reservasi minimal H+1 dari hari ini');
  });

  it('TC-UNIT-11 [Path 2]: returns BOOKING_TOO_FAR jika selisihHari = 31', () => {
    // selisihHari=31 > BOOKING_MAX_DAYS_AHEAD(30) → terlalu jauh
    const result = service.validasiWindowDanHari(TANGGAL_KAMIS, 31);

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('BOOKING_TOO_FAR');
    expect(result.errorMessage).toBe('Reservasi maksimal 30 hari ke depan');
  });

  it('TC-UNIT-12 [Path 3]: returns KLINIK_TUTUP jika tanggal adalah hari Minggu', () => {
    // selisihHari=5 valid (1–30), tapi tanggal.getDay()===0 → Minggu
    const result = service.validasiWindowDanHari(TANGGAL_MINGGU, 5);

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('KLINIK_TUTUP');
    expect(result.errorMessage).toBe('Klinik tutup pada hari Minggu');
  });

  it('TC-UNIT-13 [Path 4]: returns valid:true jika semua kondisi terpenuhi', () => {
    // selisihHari=5 valid, Senin → semua lolos
    const result = service.validasiWindowDanHari(TANGGAL_SENIN, 5);

    expect(result.valid).toBe(true);
    expect(result.errorCode).toBeUndefined();
  });
});
