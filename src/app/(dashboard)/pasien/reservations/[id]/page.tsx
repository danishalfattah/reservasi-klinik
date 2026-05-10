'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';

interface ReservationDetail {
  id: string;
  doctorId: string;
  tanggal: string;
  jam: string;
  nomorAntrian: number;
  status: string;
  doctor?: { spesialis: string; tarif: number; user?: { name: string } };
  payment?: { status: string; snapToken: string; midtransOrderId: string } | null;
}

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: 'bg-accent text-accent-foreground',
  PENDING:   'bg-(--amber-soft) text-(--amber-ink)',
  DONE:      'bg-(--sage-soft) text-(--sage-ink)',
  CANCELLED: 'bg-(--paper-3) text-(--ink-3)',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Menunggu Pembayaran', CONFIRMED: 'Terkonfirmasi', DONE: 'Selesai', CANCELLED: 'Dibatalkan',
};

async function fetchReservation(id: string): Promise<ReservationDetail> {
  const res = await fetch(`/api/reservations/${id}`);
  const data = (await res.json()) as { success: boolean; data?: ReservationDetail; error?: { message: string } };
  if (!data.success || !data.data) throw new Error(data.error?.message ?? 'Reservasi tidak ditemukan');
  return data.data;
}

async function cancelReservation(id: string): Promise<ReservationDetail> {
  const res = await fetch(`/api/reservations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'CANCELLED' }),
  });
  const data = (await res.json()) as { success: boolean; data?: ReservationDetail; error?: { message: string } };
  if (!data.success || !data.data) throw new Error(data.error?.message ?? 'Gagal membatalkan reservasi');
  return data.data;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function MetaItem({ label, value, mono }: { label: string; value: string | number; mono?: boolean }): React.JSX.Element {
  return (
    <motion.div variants={staggerItem} className="space-y-1">
      <p className="label-eyebrow text-[10px]">{label}</p>
      <p className={`text-[14px] text-foreground ${mono ? 'font-mono-tnum font-medium' : ''}`}>{value}</p>
    </motion.div>
  );
}

type DetailRow = { label: string; value: string | number; mono?: boolean };

function getDoctorName(r: ReservationDetail): string { return r.doctor?.user?.name ?? r.doctorId; }
function getPaymentStatus(r: ReservationDetail): string { return r.payment?.status ?? 'BELUM BAYAR'; }
function getSpesialis(r: ReservationDetail): string { return r.doctor?.spesialis ?? '-'; }

function baseRows(r: ReservationDetail): DetailRow[] {
  return [
    { label: 'Tanggal', value: formatDate(r.tanggal) },
    { label: 'Jam', value: r.jam, mono: true },
    { label: 'Nomor Antrian', value: r.nomorAntrian, mono: true },
    { label: 'Status Pembayaran', value: getPaymentStatus(r) },
    { label: 'Dokter', value: `dr. ${getDoctorName(r)}` },
    { label: 'Spesialisasi', value: getSpesialis(r) },
  ];
}

function buildDetailRows(r: ReservationDetail): DetailRow[] {
  const rows = baseRows(r);
  if (r.doctor?.tarif) rows.push({ label: 'Tarif', value: `Rp ${r.doctor.tarif.toLocaleString('id-ID')}`, mono: true });
  return rows;
}

function DetailGrid({ r }: { r: ReservationDetail }): React.JSX.Element {
  return (
    <motion.div className="grid grid-cols-2 gap-x-6 gap-y-5" variants={staggerContainer} initial="hidden" animate="visible">
      {buildDetailRows(r).map((row) => <MetaItem key={row.label} label={row.label} value={row.value} mono={row.mono} />)}
    </motion.div>
  );
}

function Actions({ r, busy, onCancel }: { r: ReservationDetail; busy: boolean; onCancel: () => Promise<void> }): React.JSX.Element {
  const canCancel = r.status === 'PENDING' || r.status === 'CONFIRMED';
  return (
    <div className="flex items-center gap-3 pt-6 border-t border-border">
      {r.status === 'PENDING' && (
        <Link href={`/pasien/reservations/${r.id}/payment`} className="px-4 py-2 bg-primary text-primary-foreground text-[13px] rounded-sm hover:bg-(--moss-hover) transition-colors">
          Bayar Sekarang
        </Link>
      )}
      {canCancel && (
        <button
          onClick={onCancel}
          disabled={busy}
          className="px-4 py-2 border border-(--terracotta) text-(--terracotta-ink) text-[13px] rounded-sm hover:bg-(--terracotta-soft) disabled:opacity-60 transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Batalkan Reservasi'}
        </button>
      )}
    </div>
  );
}

function useReservationDetail(id: string | undefined): { reservation: ReservationDetail | null; loading: boolean; error: string; busy: boolean; handleCancel: () => Promise<void> } {
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchReservation(id)
      .then(setReservation)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Reservasi tidak ditemukan'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCancel(): Promise<void> {
    if (!id || !confirm('Batalkan reservasi ini?')) return;
    setBusy(true);
    try {
      setReservation(await cancelReservation(id));
      toast.success('Reservasi dibatalkan');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membatalkan reservasi');
    } finally {
      setBusy(false);
    }
  }

  return { reservation, loading, error, busy, handleCancel };
}

function DetailHeader({ reservation }: { reservation: ReservationDetail }): React.JSX.Element {
  const badgeStyle = STATUS_STYLE[reservation.status] ?? 'bg-(--paper-3) text-(--ink-3)';
  return (
    <motion.div variants={fadeInUp} className="mb-6">
      <Link href="/pasien/reservations" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-5">
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />Reservasi Saya
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="label-eyebrow text-[10px] mb-2">Detail Reservasi</div>
          <h1 className="font-display text-[28px] leading-tight text-foreground">
            {reservation.doctor?.spesialis ?? 'Konsultasi'}
          </h1>
        </div>
        <span className={`mt-1 shrink-0 px-2.5 py-1 rounded-sm text-[11px] font-medium ${badgeStyle}`}>
          {STATUS_LABEL[reservation.status] ?? reservation.status}
        </span>
      </div>
    </motion.div>
  );
}

function DetailContent({ reservation, busy, handleCancel }: { reservation: ReservationDetail; busy: boolean; handleCancel: () => Promise<void> }): React.JSX.Element {
  return (
    <motion.div className="max-w-lg px-8 py-10" variants={staggerContainer} initial="hidden" animate="visible">
      <DetailHeader reservation={reservation} />
      <motion.div variants={fadeInUp} className="border border-border rounded-lg bg-card p-6 space-y-6">
        <DetailGrid r={reservation} />
        <Actions r={reservation} busy={busy} onCancel={handleCancel} />
      </motion.div>
    </motion.div>
  );
}

export default function ReservationDetailPage(): React.JSX.Element {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { reservation, loading, error, busy, handleCancel } = useReservationDetail(id);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error || !reservation) {
    return (
      <div className="max-w-lg px-8 py-10">
        <p className="text-[13px] text-(--terracotta-ink) bg-(--terracotta-soft) px-4 py-3 rounded-sm mb-4">{error || 'Reservasi tidak ditemukan'}</p>
        <Link href="/pasien/reservations" className="text-[13px] text-primary hover:text-(--moss-hover) transition-colors">← Kembali ke daftar</Link>
      </div>
    );
  }
  return <DetailContent reservation={reservation} busy={busy} handleCancel={handleCancel} />;
}
