import { ReservationService } from '@/services/reservation.service';
import { ValidationError, ConflictError } from '@/lib/errors';
import {
  DOCTOR_ID,
  PASIEN_ID,
  TANGGAL_SENIN,
  TANGGAL_MINGGU,
  mockDoctor,
  mockPasien,
  mockReservation,
  makeMockReservationRepo,
  makeMockDoctorRepo,
  makeMockUserRepo,
  makeMockPaymentService,
} from './fixtures/reservation.fixtures';

// buatReservasi memanggil validasiReservasi tanpa 'now',
// sehingga fake timer diperlukan agar new Date() = 2026-05-11.
describe('buatReservasi', () => {
  let service: ReservationService;
  let reservationRepo: ReturnType<typeof makeMockReservationRepo>;
  let doctorRepo: ReturnType<typeof makeMockDoctorRepo>;
  let userRepo: ReturnType<typeof makeMockUserRepo>;
  let paymentService: ReturnType<typeof makeMockPaymentService>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-11T00:00:00.000Z'));

    reservationRepo = makeMockReservationRepo();
    doctorRepo = makeMockDoctorRepo();
    userRepo = makeMockUserRepo();
    paymentService = makeMockPaymentService();
    service = new ReservationService(reservationRepo, doctorRepo, userRepo, paymentService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('TC-UNIT-07 [Path 1]: throws ValidationError jika validasiReservasi gagal (hari Minggu)', async () => {
    // Pasien ditemukan, tetapi tanggal Minggu → KLINIK_TUTUP
    userRepo.findById.mockResolvedValue(mockPasien);

    await expect(
      service.buatReservasi({
        pasienId: PASIEN_ID,
        doctorId: DOCTOR_ID,
        tanggal: TANGGAL_MINGGU, // Minggu, selisihHari=6 → lolos window tapi hari tutup
        jam: '09:00',
      }),
    ).rejects.toThrow(ValidationError);

    await expect(
      service.buatReservasi({
        pasienId: PASIEN_ID,
        doctorId: DOCTOR_ID,
        tanggal: TANGGAL_MINGGU,
        jam: '09:00',
      }),
    ).rejects.toMatchObject({ code: 'KLINIK_TUTUP' });
  });

  it('TC-UNIT-08 [Path 2]: throws ConflictError jika slot tidak tersedia', async () => {
    // validasiReservasi: pasien valid, window valid (selisihHari=7), Senin, tidak duplikat
    userRepo.findById.mockResolvedValue(mockPasien);
    reservationRepo.findActiveByPasienTanggal.mockResolvedValue([]);
    // cekKetersediaanSlot: dokter ditemukan, jam valid, tapi slot sudah terisi
    doctorRepo.findByIdWithSchedules.mockResolvedValue(mockDoctor);
    reservationRepo.findActiveByDoctorTanggalJam.mockResolvedValue([mockReservation]);

    await expect(
      service.buatReservasi({
        pasienId: PASIEN_ID,
        doctorId: DOCTOR_ID,
        tanggal: TANGGAL_SENIN, // Senin, selisihHari=7
        jam: '09:00',
      }),
    ).rejects.toThrow(ConflictError);

    await expect(
      service.buatReservasi({
        pasienId: PASIEN_ID,
        doctorId: DOCTOR_ID,
        tanggal: TANGGAL_SENIN,
        jam: '09:00',
      }),
    ).rejects.toMatchObject({ code: 'SLOT_NOT_AVAILABLE' });
  });

  it('TC-UNIT-09 [Path 3]: returns reservation dan snapToken jika semua validasi lolos', async () => {
    // validasiReservasi passes
    userRepo.findById.mockResolvedValue(mockPasien);
    reservationRepo.findActiveByPasienTanggal.mockResolvedValue([]);
    // cekKetersediaanSlot passes (slot kosong)
    doctorRepo.findByIdWithSchedules.mockResolvedValue(mockDoctor);
    reservationRepo.findActiveByDoctorTanggalJam.mockResolvedValue([]);
    // buat reservasi
    reservationRepo.create.mockResolvedValue(mockReservation);
    // requirePaymentParty
    doctorRepo.findById.mockResolvedValue(mockDoctor);
    // snap token
    paymentService.buatPayment.mockResolvedValue({
      snapToken: 'snap-token-xxx',
      midtransOrderId: 'TRX-RSV-001',
    });

    const result = await service.buatReservasi({
      pasienId: PASIEN_ID,
      doctorId: DOCTOR_ID,
      tanggal: TANGGAL_SENIN,
      jam: '09:00',
    });

    expect(result.reservation).toEqual(mockReservation);
    expect(result.reservation.status).toBe('PENDING');
    expect(result.snapToken).toBe('snap-token-xxx');
  });
});
