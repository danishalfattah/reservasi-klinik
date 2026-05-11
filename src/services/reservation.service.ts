import { NotFoundError, ValidationError, ConflictError } from '@/lib/errors';
import {
  BOOKING_MIN_DAYS_AHEAD,
  BOOKING_MAX_DAYS_AHEAD,
  JAM_OPERASIONAL,
} from '@/lib/constants';
import { isJamDalamRange, hitungSelisihHari } from '@/lib/time';
import { ReservationRepository } from '@/repositories/reservation.repository';
import { DoctorRepository } from '@/repositories/doctor.repository';
import { UserRepository } from '@/repositories/user.repository';
import { PaymentService } from '@/services/payment.service';
import type {
  CreateReservationInput,
  ValidasiReservasiInput,
  ValidasiReservasiResult,
} from '@/types/reservation.types';
import type { Prisma } from '@/generated/prisma/client';

type PaymentParty = {
  doctor: Prisma.DoctorGetPayload<{ include: { user: true } }>;
  pasien: Prisma.UserGetPayload<object>;
};

/**
 * ReservationService — Business logic untuk reservasi pasien.
 * Bergantung pada 3 repository: Reservation, Doctor, User.
 * Semua dependency di-inject melalui constructor untuk testability.
 */
export class ReservationService {
  constructor(
    private reservationRepo: ReservationRepository,
    private doctorRepo: DoctorRepository,
    private userRepo: UserRepository,
    private paymentService: PaymentService
  ) {}

  /**
   * Private helper: Validasi jam operasional klinik.
   */
  private validasiJamOperasional(hari: number, jam: string): boolean {
    const jamOperasional = JAM_OPERASIONAL[hari];
    return jamOperasional ? isJamDalamRange(jam, jamOperasional.buka, jamOperasional.tutup) : false;
  }

  /**
   * Private helper: Validasi jadwal praktik dokter.
   */
  private validasiJadwalDokter(
    hari: number,
    jam: string,
    schedules: Array<{ hari: number; jamMulai: string; jamSelesai: string }>
  ): boolean {
    const jadwal = schedules.find((s) => s.hari === hari);
    if (!jadwal) return false;
    return isJamDalamRange(jam, jadwal.jamMulai, jadwal.jamSelesai);
  }

  private async requirePaymentParty(
    doctorId: string,
    pasienId: string
  ): Promise<PaymentParty> {
    const doctor = await this.doctorRepo.findById(doctorId);
    const pasien = await this.userRepo.findById(pasienId);
    if (!doctor) throw new ValidationError('DATA_INCOMPLETE', 'Data dokter tidak lengkap untuk pembayaran');
    if (!pasien) throw new ValidationError('DATA_INCOMPLETE', 'Data pasien tidak lengkap untuk pembayaran');
    return { doctor, pasien };
  }

  /**
   * cekKetersediaanSlot() — Mengecek apakah slot waktu tertentu masih tersedia untuk booking.
   *
   * Business Rules (early return pattern):
   * R1: Dokter tidak ditemukan → throw NotFoundError
   * R2: Hari Minggu (klinik tutup) → return false
   * R3: Jam di luar jam operasional klinik → return false
   * R4: Dokter tidak punya jadwal di hari itu → return false
   * R5: Jam di luar jadwal praktik dokter → return false
   * R6: Sudah ada reservasi aktif di slot itu → return false
   *
   * @throws NotFoundError jika dokter tidak ditemukan
   * @returns true jika slot tersedia, false jika tidak tersedia
   */
  async cekKetersediaanSlot(
    doctorId: string,
    tanggal: Date,
    jam: string
  ): Promise<boolean> {
    const hari = tanggal.getDay();

    // R1: Validasi dokter ada
    const doctor = await this.doctorRepo.findByIdWithSchedules(doctorId);
    if (!doctor) {
      throw new NotFoundError('Dokter tidak ditemukan');
    }

    // R2: Validasi hari bukan Minggu
    if (hari === 0) return false;

    // R3: Validasi jam dalam jam operasional klinik
    if (!this.validasiJamOperasional(hari, jam)) return false;

    // R4-R5: Validasi jam dalam jadwal praktik dokter
    if (!this.validasiJadwalDokter(hari, jam, doctor.schedules)) return false;

    // R6: Validasi tidak ada reservasi aktif di slot itu
    const existing = await this.reservationRepo.findActiveByDoctorTanggalJam(
      doctorId,
      tanggal,
      jam
    );

    return existing.length === 0;
  }

  /**
   * Private helper: Validasi keberadaan pasien.
   */
  private async validasiPasienExists(
    pasienId: string
  ): Promise<{ valid: boolean; errorCode?: string; errorMessage?: string }> {
    const pasien = await this.userRepo.findById(pasienId);
    if (!pasien) {
      return {
        valid: false,
        errorCode: 'PASIEN_NOT_FOUND',
        errorMessage: 'Pasien tidak terdaftar dalam sistem',
      };
    }
    return { valid: true };
  }

  /**
   * Private helper: Validasi booking window & hari.
   */
  public validasiWindowDanHari(
    tanggal: Date,
    selisihHari: number
  ): { valid: boolean; errorCode?: string; errorMessage?: string } {
    if (selisihHari < BOOKING_MIN_DAYS_AHEAD) {
      return {
        valid: false,
        errorCode: 'BOOKING_TOO_SOON',
        errorMessage: 'Reservasi minimal H+1 dari hari ini',
      };
    }

    if (selisihHari > BOOKING_MAX_DAYS_AHEAD) {
      return {
        valid: false,
        errorCode: 'BOOKING_TOO_FAR',
        errorMessage: 'Reservasi maksimal 30 hari ke depan',
      };
    }

    if (tanggal.getDay() === 0) {
      return {
        valid: false,
        errorCode: 'KLINIK_TUTUP',
        errorMessage: 'Klinik tutup pada hari Minggu',
      };
    }

    return { valid: true };
  }

  /**
   * validasiReservasi() — Validasi apakah pasien boleh booking pada tanggal tertentu.
   * Checks: pasien exists, booking window (H+1 to H+30), not Sunday, no duplicate.
   * @returns {valid: true} or {valid: false, errorCode, errorMessage}
   */
  async validasiReservasi(input: ValidasiReservasiInput): Promise<ValidasiReservasiResult> {
    const pasienCheck = await this.validasiPasienExists(input.pasienId);
    if (!pasienCheck.valid) return pasienCheck;

    const now = input.now ?? new Date();
    const selisihHari = hitungSelisihHari(input.tanggal, now);
    const windowCheck = this.validasiWindowDanHari(input.tanggal, selisihHari);
    if (!windowCheck.valid) return windowCheck;

    const existing = await this.reservationRepo.findActiveByPasienTanggal(
      input.pasienId,
      input.tanggal
    );

    if (existing.length > 0) {
      return {
        valid: false,
        errorCode: 'RESERVASI_DUPLIKAT',
        errorMessage: 'Anda sudah memiliki reservasi aktif di tanggal tersebut',
      };
    }

    return { valid: true };
  }

  /**
   * buatReservasi() — Orchestrate: validate → check availability → calculate queue → create.
   * @throws ValidationError if validation fails
   * @throws ConflictError if availability check fails
   * @returns reservation & snapToken
   */
  async buatReservasi(input: CreateReservationInput): Promise<{
    reservation: Prisma.ReservationGetPayload<object>;
    snapToken: string | null;
  }> {
    const validasi = await this.validasiReservasi({
      pasienId: input.pasienId,
      tanggal: input.tanggal,
    });
    if (!validasi.valid) {
      throw new ValidationError(
        validasi.errorCode ?? 'INVALID_RESERVATION',
        validasi.errorMessage ?? 'Reservasi tidak valid'
      );
    }

    const tersedia = await this.cekKetersediaanSlot(input.doctorId, input.tanggal, input.jam);
    if (!tersedia) {
      throw new ConflictError('SLOT_NOT_AVAILABLE', 'Slot waktu tidak tersedia');
    }

    const reservation = await this.reservationRepo.create({
      pasienId: input.pasienId,
      doctorId: input.doctorId,
      tanggal: input.tanggal,
      jam: input.jam,
      status: 'PENDING',
    });

    const { doctor, pasien } = await this.requirePaymentParty(input.doctorId, input.pasienId);
    const { snapToken } = await this.paymentService.buatPayment(reservation, doctor, pasien);

    return { reservation, snapToken };
  }
}
