'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/motion';

interface Pasien { id: string; name: string; email: string; phone: string | null }
interface Reservation {
  id: string;
  tanggal: string;
  jam: string;
  nomorAntrian: number;
  status: string;
  pasien: Pasien;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Menunggu Bayar',
  CONFIRMED: 'Terkonfirmasi',
  DONE: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'text-(--terracotta-ink) bg-(--terracotta-soft)',
  CONFIRMED: 'text-(--moss-ink) bg-(--moss-soft)',
  DONE: 'text-muted-foreground bg-secondary',
  CANCELLED: 'text-muted-foreground bg-secondary',
};

async function fetchReservations(tanggal: string): Promise<Reservation[]> {
  const url = tanggal ? `/api/dokter/reservasi?tanggal=${tanggal}` : '/api/dokter/reservasi';
  const res = await fetch(url);
  const json = (await res.json()) as { success: boolean; data?: Reservation[] };
  return json.success && json.data ? json.data : [];
}

function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-sm font-medium ${STATUS_CLASS[status] ?? 'text-muted-foreground bg-secondary'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function TableHeader(): React.JSX.Element {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 border-b border-border bg-(--paper-2)">
      {['Antrian', 'Pasien', 'Jam', 'Status'].map((h) => (
        <span key={h} className="label-eyebrow text-[10px]">{h}</span>
      ))}
    </div>
  );
}

function ReservationRow({ r }: { r: Reservation }): React.JSX.Element {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-(--paper-2) transition-colors">
      <span className="text-[13px] font-mono-tnum font-medium text-foreground w-6 text-center">{r.nomorAntrian}</span>
      <div>
        <p className="text-[13px] font-medium text-foreground">{r.pasien.name}</p>
        <p className="text-[11px] text-muted-foreground">{r.pasien.email}</p>
        {r.pasien.phone && <p className="text-[11px] text-muted-foreground">{r.pasien.phone}</p>}
      </div>
      <span className="text-[12px] font-mono-tnum text-foreground">{r.jam}</span>
      <StatusBadge status={r.status} />
    </div>
  );
}

function EmptyState(): React.JSX.Element {
  return (
    <div className="border border-dashed border-border rounded-lg p-12 text-center text-[13px] text-muted-foreground">
      Tidak ada reservasi pada tanggal ini.
    </div>
  );
}

function ReservationTable({ reservations }: { reservations: Reservation[] }): React.JSX.Element {
  if (reservations.length === 0) return <EmptyState />;
  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <TableHeader />
      {reservations.map((r) => <ReservationRow key={r.id} r={r} />)}
    </div>
  );
}

function DateFilter({ value, onChange }: { value: string; onChange: (v: string) => void }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <label className="text-[12px] text-muted-foreground">Tanggal</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[12px] border border-border rounded-sm px-3 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

function PageHeader({ tanggal, onChangeTanggal }: { tanggal: string; onChangeTanggal: (v: string) => void }): React.JSX.Element {
  return (
    <motion.div variants={fadeInUp} className="pb-6 border-b border-border space-y-4">
      <div>
        <div className="label-eyebrow text-[10px] mb-2">Dokter · Reservasi</div>
        <h1 className="font-display text-[28px] leading-tight text-foreground">
          Daftar <span className="font-display-italic text-primary">Pasien.</span>
        </h1>
        {tanggal && (
          <p className="text-[12px] text-muted-foreground mt-1">{formatDisplayDate(tanggal)}</p>
        )}
      </div>
      <DateFilter value={tanggal} onChange={onChangeTanggal} />
    </motion.div>
  );
}

export default function DokterReservasiPage(): React.JSX.Element {
  const [tanggal, setTanggal] = useState(toLocalDateString(new Date()));
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchReservations(tanggal)
      .then(setReservations)
      .finally(() => setLoading(false));
  }, [tanggal]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div className="max-w-3xl px-8 py-10 space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
      <PageHeader tanggal={tanggal} onChangeTanggal={setTanggal} />
      <motion.div variants={fadeInUp}>
        <ReservationTable reservations={reservations} />
      </motion.div>
    </motion.div>
  );
}
