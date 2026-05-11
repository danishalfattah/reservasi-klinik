'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, CalendarPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/motion';

interface ReservationListItem {
  id: string;
  tanggal: string;
  jam: string;
  status: string;
  doctor?: { spesialis: string; user?: { name: string } };
  payment?: { status: string } | null;
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

async function fetchReservations(): Promise<ReservationListItem[]> {
  const res = await fetch('/api/reservations');
  const data = (await res.json()) as { success: boolean; data?: ReservationListItem[] };
  return data.success && data.data ? data.data : [];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getDoctorName(item: ReservationListItem): string {
  return item.doctor?.user?.name ?? 'Dokter';
}

function canPay(item: ReservationListItem): boolean {
  return item.status === 'PENDING' && item.payment?.status !== 'PAID';
}

function ReservationRow({ item }: { item: ReservationListItem }): React.JSX.Element {
  const badgeStyle = STATUS_STYLE[item.status] ?? 'bg-(--paper-3) text-(--ink-3)';
  return (
    <motion.div variants={staggerItem} className="border border-border rounded-lg bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[14px] font-medium text-foreground">{item.doctor?.spesialis ?? 'Konsultasi'}</p>
          <span className={`px-2 py-0.5 rounded-sm text-[11px] font-medium ${badgeStyle}`}>{STATUS_LABEL[item.status] ?? item.status}</span>
        </div>
        <p className="text-[12px] text-muted-foreground">{formatDate(item.tanggal)} · {item.jam}</p>
        <p className="text-[12px] text-muted-foreground">dr. {getDoctorName(item)}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href={`/pasien/reservations/${item.id}`} className="text-[12px] text-primary hover:text-(--moss-hover) transition-colors">
          Detail →
        </Link>
        {canPay(item) && (
          <Link href={`/pasien/reservations/${item.id}/payment`} className="text-[12px] px-3 py-1.5 bg-primary text-primary-foreground rounded-sm hover:bg-(--moss-hover) transition-colors">
            Bayar
          </Link>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState(): React.JSX.Element {
  return (
    <div className="border border-dashed border-border rounded-lg p-12 text-center space-y-4">
      <p className="text-[13px] text-muted-foreground">Belum ada riwayat reservasi.</p>
      <Link href="/pasien/booking" className="inline-flex items-center gap-2 text-[13px] text-primary hover:text-(--moss-hover) transition-colors">
        <CalendarPlus className="w-3.5 h-3.5" strokeWidth={1.5} />
        Buat reservasi pertama
      </Link>
    </div>
  );
}

function PageHeader(): React.JSX.Element {
  return (
    <motion.div variants={fadeInUp} className="flex items-end justify-between pb-6 mb-6 border-b border-border">
      <div>
        <div className="label-eyebrow text-[10px] mb-2">Reservasi Saya</div>
        <h1 className="font-display text-[28px] leading-tight text-foreground">
          Riwayat <span className="font-display-italic text-primary">konsultasi.</span>
        </h1>
      </div>
      <Link href="/pasien/booking" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-[13px] rounded-sm hover:bg-(--moss-hover) transition-colors">
        <CalendarPlus className="w-3.5 h-3.5" strokeWidth={1.5} />
        Booking Baru
      </Link>
    </motion.div>
  );
}

function ReservationsList({ reservations }: { reservations: ReservationListItem[] }): React.JSX.Element {
  if (reservations.length === 0) return <EmptyState />;
  return (
    <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="visible">
      {reservations.map((item) => <ReservationRow key={item.id} item={item} />)}
    </motion.div>
  );
}

export default function PasienReservationsPage(): React.JSX.Element {
  const [reservations, setReservations] = useState<ReservationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations().then(setReservations).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div className="max-w-3xl px-8 py-10" variants={staggerContainer} initial="hidden" animate="visible">
      <PageHeader />
      <ReservationsList reservations={reservations} />
    </motion.div>
  );
}
