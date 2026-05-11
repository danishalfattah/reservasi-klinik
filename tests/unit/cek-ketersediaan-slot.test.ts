import { ReservationService } from '@/services/reservation.service';
import { NotFoundError } from '@/lib/errors';
import {
  DOCTOR_ID,
  TANGGAL_SENIN,
  TANGGAL_MINGGU,
  mockDoctor,
  mockReservation,
  makeMockReservationRepo,
  makeMockDoctorRepo,
  makeMockUserRepo,
  makeMockPaymentService,
} from './fixtures/reservation.fixtures';

describe('cekKetersediaanSlot', () => {
  let service: ReservationService;
  let reservationRepo: ReturnType<typeof makeMockReservationRepo>;
  let doctorRepo: ReturnType<typeof makeMockDoctorRepo>;
  let userRepo: ReturnType<typeof makeMockUserRepo>;
  let paymentService: ReturnType<typeof makeMockPaymentService>;

  beforeEach(() => {
    reservationRepo = makeMockReservationRepo();
    doctorRepo = makeMockDoctorRepo();
    userRepo = makeMockUserRepo();
    paymentService = makeMockPaymentService();
    service = new ReservationService(reservationRepo, doctorRepo, userRepo, paymentService);
  });

  it('TC-UNIT-01 [Path 1]: throws NotFoundError jika dokter tidak ditemukan', async () => {
    doctorRepo.findByIdWithSchedules.mockResolvedValue(null);

    await expect(
      service.cekKetersediaanSlot('DOC-999', TANGGAL_SENIN, '09:00'),
    ).rejects.toThrow(NotFoundError);

    await expect(
      service.cekKetersediaanSlot('DOC-999', TANGGAL_SENIN, '09:00'),
    ).rejects.toThrow('Dokter tidak ditemukan');
  });

  it('TC-UNIT-02 [Path 2]: returns false jika tanggal adalah hari Minggu', async () => {
    doctorRepo.findByIdWithSchedules.mockResolvedValue(mockDoctor);

    const result = await service.cekKetersediaanSlot(DOCTOR_ID, TANGGAL_MINGGU, '09:00');

    expect(result).toBe(false);
  });

  it('TC-UNIT-03 [Path 3]: returns false jika jam di luar jam operasional klinik', async () => {
    doctorRepo.findByIdWithSchedules.mockResolvedValue(mockDoctor);

    // 02:00 — di bawah jam buka klinik (08:00)
    const result = await service.cekKetersediaanSlot(DOCTOR_ID, TANGGAL_SENIN, '02:00');

    expect(result).toBe(false);
  });

  it('TC-UNIT-04 [Path 4]: returns false jika jam valid klinik tapi di luar jadwal dokter', async () => {
    doctorRepo.findByIdWithSchedules.mockResolvedValue(mockDoctor);

    // 15:00 ada di jam klinik (08:00–17:00), tapi di luar jadwal dokter (09:00–14:00)
    const result = await service.cekKetersediaanSlot(DOCTOR_ID, TANGGAL_SENIN, '15:00');

    expect(result).toBe(false);
  });

  it('TC-UNIT-05 [Path 5]: returns false jika slot sudah di-booking pasien lain', async () => {
    doctorRepo.findByIdWithSchedules.mockResolvedValue(mockDoctor);
    reservationRepo.findActiveByDoctorTanggalJam.mockResolvedValue([mockReservation]);

    const result = await service.cekKetersediaanSlot(DOCTOR_ID, TANGGAL_SENIN, '09:00');

    expect(result).toBe(false);
  });

  it('TC-UNIT-06 [Path 6]: returns true jika semua validasi lolos dan slot kosong', async () => {
    doctorRepo.findByIdWithSchedules.mockResolvedValue(mockDoctor);
    reservationRepo.findActiveByDoctorTanggalJam.mockResolvedValue([]);

    const result = await service.cekKetersediaanSlot(DOCTOR_ID, TANGGAL_SENIN, '09:00');

    expect(result).toBe(true);
  });
});
