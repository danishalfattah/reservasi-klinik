import { ReservationService } from '@/services/reservation.service';
import {
  PASIEN_ID,
  TANGGAL_SENIN,
  NOW,
  mockPasien,
  mockReservation,
  makeMockReservationRepo,
  makeMockDoctorRepo,
  makeMockUserRepo,
  makeMockPaymentService,
} from './fixtures/reservation.fixtures';

// Semua test menggunakan field 'now' agar deterministik,
// tidak bergantung pada tanggal eksekusi test.
describe('validasiReservasi', () => {
  let service: ReservationService;
  let reservationRepo: ReturnType<typeof makeMockReservationRepo>;
  let userRepo: ReturnType<typeof makeMockUserRepo>;

  beforeEach(() => {
    reservationRepo = makeMockReservationRepo();
    userRepo = makeMockUserRepo();
    service = new ReservationService(
      reservationRepo,
      makeMockDoctorRepo(),
      userRepo,
      makeMockPaymentService(),
    );
  });

  it('TC-UNIT-14 [Path 1]: returns PASIEN_NOT_FOUND jika ID pasien tidak ditemukan', async () => {
    userRepo.findById.mockResolvedValue(null);

    const result = await service.validasiReservasi({
      pasienId: 'USR-INVALID',
      tanggal: TANGGAL_SENIN,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('PASIEN_NOT_FOUND');
  });

  it('TC-UNIT-15 [Path 2]: returns BOOKING_TOO_SOON jika tanggal sama dengan now (selisih=0)', async () => {
    userRepo.findById.mockResolvedValue(mockPasien);

    const result = await service.validasiReservasi({
      pasienId: PASIEN_ID,
      tanggal: new Date('2026-05-11'), // sama dengan NOW → selisihHari = 0 < 1
      now: NOW,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('BOOKING_TOO_SOON');
  });

  it('TC-UNIT-16 [Path 3]: returns RESERVASI_DUPLIKAT jika sudah ada booking aktif di tanggal itu', async () => {
    userRepo.findById.mockResolvedValue(mockPasien);
    reservationRepo.findActiveByPasienTanggal.mockResolvedValue([mockReservation]);

    const result = await service.validasiReservasi({
      pasienId: PASIEN_ID,
      tanggal: TANGGAL_SENIN, // Senin, selisihHari=7 → valid
      now: NOW,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('RESERVASI_DUPLIKAT');
  });

  it('TC-UNIT-17 [Path 4]: returns valid:true jika semua validasi lolos', async () => {
    userRepo.findById.mockResolvedValue(mockPasien);
    reservationRepo.findActiveByPasienTanggal.mockResolvedValue([]);

    const result = await service.validasiReservasi({
      pasienId: PASIEN_ID,
      tanggal: TANGGAL_SENIN, // Senin, selisihHari=7 → valid, tidak duplikat
      now: NOW,
    });

    expect(result.valid).toBe(true);
  });
});
