'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fadeInUp } from '@/lib/motion';

interface Doctor {
  id: string;
  user: { name: string };
  spesialis: string;
  tarif: number;
  durasiMenit: number;
}

interface Schedule {
  id: string;
  hari: number;
  jamMulai: string;
  jamSelesai: string;
}

interface CheckResult {
  tersedia: boolean;
  estimasi: { nomorAntrian: number; estimasiMenit: number } | null;
}

interface SlotStatus {
  jam: string;
  tersedia: boolean;
  estimasi: CheckResult['estimasi'];
}

interface BookingState {
  doctorId: string;
  tanggal: string;
  jam: string;
}

const HARI_LABELS: Record<number, string> = {
  1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu',
};

function generateTimeSlots(jamMulai: string, jamSelesai: string, durasiMenit: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = jamMulai.split(':').map(Number);
  const [endH, endM] = jamSelesai.split(':').map(Number);
  let totalMin = startH * 60 + startM;
  const endTotalMin = endH * 60 + endM;
  while (totalMin + durasiMenit <= endTotalMin) {
    const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
    const m = (totalMin % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    totalMin += durasiMenit;
  }
  return slots;
}

function formatSlotLabel(jam: string, durasiMenit: number): string {
  const [h, m] = jam.split(':').map(Number);
  const endMin = h * 60 + m + durasiMenit;
  const endH = Math.floor(endMin / 60).toString().padStart(2, '0');
  const endM = (endMin % 60).toString().padStart(2, '0');
  return `${jam}–${endH}:${endM}`;
}

function dateLimits(): { min: string; max: string } {
  const today = new Date();
  const min = new Date(today); min.setDate(today.getDate() + 1);
  const max = new Date(today); max.setDate(today.getDate() + 30);
  return { min: min.toISOString().split('T')[0], max: max.toISOString().split('T')[0] };
}

function getScheduleForDate(schedules: Schedule[], dateStr: string): Schedule | null {
  if (!dateStr) return null;
  const dow = new Date(dateStr).getDay();
  return schedules.find((s) => s.hari === dow) ?? null;
}

async function loadDoctors(): Promise<Doctor[]> {
  const res = await fetch('/api/doctors');
  const data = (await res.json()) as { success: boolean; data?: Doctor[] };
  return data.success && data.data ? data.data : [];
}

async function loadSchedules(doctorId: string): Promise<Schedule[]> {
  const res = await fetch(`/api/doctors/${doctorId}/schedules`);
  const data = (await res.json()) as { success: boolean; data?: Schedule[] };
  return data.success && data.data ? data.data : [];
}

async function checkSlot(doctorId: string, tanggal: string, jam: string): Promise<CheckResult> {
  const res = await fetch('/api/reservations/check-slot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doctorId, tanggal, jam }),
  });
  const data = (await res.json()) as { success: boolean; data?: CheckResult };
  return data.success && data.data ? data.data : { tersedia: false, estimasi: null };
}

async function checkAllSlots(doctorId: string, tanggal: string, jams: string[]): Promise<SlotStatus[]> {
  return Promise.all(
    jams.map(async (jam) => {
      const result = await checkSlot(doctorId, tanggal, jam);
      return { jam, tersedia: result.tersedia, estimasi: result.estimasi };
    })
  );
}

async function createReservation(state: BookingState): Promise<string> {
  const res = await fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
  const data = (await res.json()) as { success: boolean; data?: { reservation: { id: string } }; error?: { message: string } };
  if (!data.success || !data.data) throw new Error(data.error?.message ?? 'Gagal membuat reservasi');
  return data.data.reservation.id;
}

function SectionCard({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <div className="border border-border rounded-lg bg-card p-6 space-y-4">{children}</div>;
}

function SectionLabel({ icon: Icon, text }: { icon: React.ElementType; text: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
      <span className="text-[13px] font-medium text-foreground">{text}</span>
    </div>
  );
}

function DoctorCard({ doctor, selected, onClick }: { doctor: Doctor; selected: boolean; onClick: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-sm border transition-colors ${
        selected ? 'border-primary bg-(--moss-soft)' : 'border-border hover:border-(--line-2) hover:bg-(--paper-2)'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-foreground">{doctor.user.name}</p>
          <p className="text-[11px] text-muted-foreground">{doctor.spesialis}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[12px] font-medium text-primary">Rp {doctor.tarif.toLocaleString('id-ID')}</p>
          <p className="text-[11px] text-muted-foreground">{doctor.durasiMenit} mnt/sesi</p>
        </div>
      </div>
    </button>
  );
}

function SlotButton({ jam, tersedia, selected, durasiMenit, onSelect }: {
  jam: string; tersedia: boolean; selected: boolean; durasiMenit: number; onSelect: (v: string) => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={() => tersedia && onSelect(jam)}
      disabled={!tersedia}
      className={`py-2 px-3 rounded-sm border text-[12px] transition-colors ${
        !tersedia
          ? 'border-border bg-(--paper-2) text-muted-foreground line-through cursor-not-allowed opacity-50'
          : selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border hover:border-primary hover:bg-(--moss-soft) text-foreground'
      }`}
    >
      {formatSlotLabel(jam, durasiMenit)}
    </button>
  );
}

function TimeSlotGrid({ slots, selected, durasiMenit, checkingSlots, onSelect }: {
  slots: SlotStatus[]; selected: string; durasiMenit: number; checkingSlots: boolean; onSelect: (v: string) => void;
}): React.JSX.Element {
  if (checkingSlots) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground py-3">
        <Loader2 className="w-4 h-4 animate-spin" />Mengecek ketersediaan...
      </div>
    );
  }
  if (slots.length === 0) return <p className="text-[13px] text-muted-foreground">Tidak ada sesi tersedia untuk hari ini.</p>;
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map(({ jam, tersedia }) => (
        <SlotButton key={jam} jam={jam} tersedia={tersedia} selected={selected === jam} durasiMenit={durasiMenit} onSelect={onSelect} />
      ))}
    </div>
  );
}

function ConfirmBanner({ onSubmit, submitting }: { onSubmit: () => void; submitting: boolean }): React.JSX.Element {
  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="border border-(--moss-line) rounded-lg bg-(--moss-soft) p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="w-4 h-4 text-(--moss-ink) shrink-0" strokeWidth={1.5} />
        <p className="text-[13px] text-(--moss-ink) font-medium">Sesi tersedia — siap dibooking</p>
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-[13px] rounded-sm hover:bg-(--moss-hover) disabled:opacity-60 transition-colors shrink-0"
      >
        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buat Reservasi'}
      </button>
    </motion.div>
  );
}

interface BookingHook {
  doctors: Doctor[];
  state: BookingState;
  slotStatuses: SlotStatus[];
  checkingSlots: boolean;
  submitting: boolean;
  selectedDoctor: Doctor | null;
  activeSchedule: Schedule | null;
  selectedSlot: SlotStatus | null;
  selectDoctor: (id: string) => void;
  setState: React.Dispatch<React.SetStateAction<BookingState>>;
  handleSubmit: () => Promise<void>;
}

function useSlots(state: BookingState, schedules: Schedule[], doctors: Doctor[]): { slotStatuses: SlotStatus[]; checkingSlots: boolean } {
  const [slotStatuses, setSlotStatuses] = useState<SlotStatus[]>([]);
  const [checkingSlots, setCheckingSlots] = useState(false);
  const activeSchedule = getScheduleForDate(schedules, state.tanggal);
  const selectedDoctor = doctors.find((d) => d.id === state.doctorId) ?? null;

  useEffect(() => {
    if (!state.doctorId || !state.tanggal || !activeSchedule || !selectedDoctor) {
      Promise.resolve().then(() => setSlotStatuses([]));
      return;
    }
    const jams = generateTimeSlots(activeSchedule.jamMulai, activeSchedule.jamSelesai, selectedDoctor.durasiMenit);
    Promise.resolve().then(() => setCheckingSlots(true));
    checkAllSlots(state.doctorId, state.tanggal, jams)
      .then((slots) => setSlotStatuses(slots))
      .catch(() => toast.error('Gagal mengecek ketersediaan sesi'))
      .finally(() => setCheckingSlots(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.doctorId, state.tanggal]);

  return { slotStatuses, checkingSlots };
}

function useBooking(push: (path: string) => void): BookingHook {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [state, setState] = useState<BookingState>({ doctorId: '', tanggal: '', jam: '' });
  const [submitting, setSubmitting] = useState(false);
  const { slotStatuses, checkingSlots } = useSlots(state, schedules, doctors);

  const selectedDoctor = doctors.find((d) => d.id === state.doctorId) ?? null;
  const activeSchedule = getScheduleForDate(schedules, state.tanggal);
  const selectedSlot = slotStatuses.find((s) => s.jam === state.jam) ?? null;

  useEffect(() => {
    loadDoctors().then(setDoctors).catch(() => toast.error('Gagal memuat daftar dokter'));
  }, []);

  function selectDoctor(id: string): void {
    setState({ doctorId: id, tanggal: '', jam: '' });
    setSchedules([]);
    loadSchedules(id).then(setSchedules).catch(() => toast.error('Gagal memuat jadwal dokter'));
  }

  async function handleSubmit(): Promise<void> {
    setSubmitting(true);
    try {
      const id = await createReservation(state);
      toast.success('Reservasi berhasil dibuat');
      push(`/pasien/reservations/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat reservasi');
    } finally {
      setSubmitting(false);
    }
  }

  return { doctors, state, slotStatuses, checkingSlots, submitting, selectedDoctor, activeSchedule, selectedSlot, selectDoctor, setState, handleSubmit }; }

function DoctorSection({ doctors, doctorId, selectDoctor }: { doctors: Doctor[]; doctorId: string; selectDoctor: (id: string) => void }): React.JSX.Element {
  return (
    <SectionCard>
      <SectionLabel icon={Calendar} text="Pilih Dokter" />
      <div className="space-y-2">
        {doctors.length === 0
          ? <p className="text-[13px] text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Memuat dokter...</p>
          : doctors.map((doc) => <DoctorCard key={doc.id} doctor={doc} selected={doctorId === doc.id} onClick={() => selectDoctor(doc.id)} />)
        }
      </div>
    </SectionCard>
  );
}

function DateSection({ state, limits, activeSchedule, setState }: {
  state: BookingState; limits: { min: string; max: string }; activeSchedule: Schedule | null;
  setState: React.Dispatch<React.SetStateAction<BookingState>>;
}): React.JSX.Element {
  return (
    <SectionCard>
      <SectionLabel icon={Calendar} text="Pilih Tanggal" />
      <input type="date" min={limits.min} max={limits.max} value={state.tanggal}
        onChange={(e) => setState((p) => ({ ...p, tanggal: e.target.value, jam: '' }))}
        className="w-full px-3 py-2 border border-border rounded-sm text-[13px] text-foreground bg-background focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <p className="text-[11px] text-muted-foreground">Tersedia H+1 hingga H+30. Hari Minggu libur.</p>
      {state.tanggal && !activeSchedule && (
        <p className="text-[12px] text-(--amber-ink) bg-(--amber-soft) px-3 py-2 rounded-sm">
          Dokter tidak berpraktik pada hari {new Date(state.tanggal).toLocaleDateString('id-ID', { weekday: 'long' })} ini.
        </p>
      )}
      {activeSchedule && (
        <p className="text-[11px] text-accent-foreground bg-accent px-3 py-2 rounded-sm">
          Jadwal: {HARI_LABELS[activeSchedule.hari]} · {activeSchedule.jamMulai}–{activeSchedule.jamSelesai}
        </p>
      )}
    </SectionCard>
  );
}

function BookingForm({ hook, limits }: { hook: BookingHook; limits: { min: string; max: string } }): React.JSX.Element {
  const { doctors, state, slotStatuses, checkingSlots, submitting, selectedDoctor, activeSchedule, selectedSlot, selectDoctor, setState, handleSubmit } = hook;
  return (
    <div className="space-y-5">
      <DoctorSection doctors={doctors} doctorId={state.doctorId} selectDoctor={selectDoctor} />
      <AnimatePresence>
        {state.doctorId && (
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
            <DateSection state={state} limits={limits} activeSchedule={activeSchedule} setState={setState} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activeSchedule && selectedDoctor && (
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
            <SectionCard>
              <SectionLabel icon={Clock} text="Pilih Sesi" />
              <TimeSlotGrid slots={slotStatuses} selected={state.jam} durasiMenit={selectedDoctor.durasiMenit}
                checkingSlots={checkingSlots} onSelect={(jam) => setState((p) => ({ ...p, jam }))} />
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedSlot?.tersedia && <ConfirmBanner onSubmit={handleSubmit} submitting={submitting} />}
      </AnimatePresence>
    </div>
  );
}

export default function BookingPage(): React.JSX.Element {
  const router = useRouter();
  const limits = dateLimits();
  const hook = useBooking(router.push);

  return (
    <div className="max-w-xl px-8 py-10 space-y-5">
      <div className="pb-6 border-b border-border">
        <div className="label-eyebrow text-[10px] mb-2">Buat Reservasi</div>
        <h1 className="font-display text-[28px] leading-tight text-foreground">
          Pilih dokter &amp; jadwal <span className="font-display-italic text-primary">Anda.</span>
        </h1>
      </div>
      <BookingForm hook={hook} limits={limits} />
    </div>
  );
}
