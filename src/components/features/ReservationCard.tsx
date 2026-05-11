'use client';

import Link from 'next/link';
import { CalendarDays, Clock, CreditCard } from 'lucide-react';

export interface ReservationCardItem {
  id: string;
  tanggal: string;
  jam: string;
  status: string;
  doctor?: {
    spesialis: string;
    user?: { name: string };
  };
  payment?: { status: string } | null;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
}

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: 'bg-(--moss-soft) text-(--moss-ink)',
  PENDING:   'bg-(--amber-soft) text-(--amber-ink)',
  DONE:      'bg-(--sage-soft) text-(--sage-ink)',
  CANCELLED: 'bg-(--paper-3) text-(--ink-3)',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Menunggu Pembayaran',
  CONFIRMED: 'Terkonfirmasi',
  DONE: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

function doctorName(item: ReservationCardItem): string {
  return item.doctor?.user?.name ?? 'Dokter';
}

function canPay(item: ReservationCardItem): boolean {
  return item.status === 'PENDING' && item.payment?.status !== 'PAID';
}

function MetaRow({ icon: Icon, text }: { icon: React.ElementType; text: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
      <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
      <span>{text}</span>
    </div>
  );
}

function CardHeader({ item }: { item: ReservationCardItem }): React.JSX.Element {
  const statusStyle = STATUS_STYLE[item.status] ?? 'bg-(--paper-3) text-(--ink-3)';
  const statusText = STATUS_LABEL[item.status] ?? item.status;
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] text-muted-foreground">dr. {doctorName(item)}</p>
        <p className="mt-0.5 text-[15px] font-medium text-foreground">{item.doctor?.spesialis ?? 'Konsultasi'}</p>
      </div>
      <span className={`shrink-0 px-2.5 py-1 rounded-sm text-[11px] font-medium ${statusStyle}`}>{statusText}</span>
    </div>
  );
}

function CardMeta({ item }: { item: ReservationCardItem }): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-y-2">
      <MetaRow icon={CalendarDays} text={formatDate(item.tanggal)} />
      <MetaRow icon={Clock} text={item.jam} />
      <MetaRow icon={CreditCard} text={item.payment?.status ?? 'BELUM BAYAR'} />
    </div>
  );
}

function CardActions({ item }: { item: ReservationCardItem }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 pt-1 border-t border-border">
      <Link href={`/pasien/reservations/${item.id}`} className="text-[12px] text-primary hover:text-(--moss-hover) transition-colors">
        Lihat detail →
      </Link>
      {canPay(item) && (
        <Link href={`/pasien/reservations/${item.id}/payment`} className="ml-auto text-[12px] px-3 py-1.5 bg-primary text-primary-foreground rounded-sm hover:bg-(--moss-hover) transition-colors">
          Bayar sekarang
        </Link>
      )}
    </div>
  );
}

export function ReservationCard({ item }: { item: ReservationCardItem }): React.JSX.Element {
  return (
    <div className="border border-border rounded-lg bg-card p-5 flex flex-col gap-4">
      <CardHeader item={item} />
      <CardMeta item={item} />
      <CardActions item={item} />
    </div>
  );
}
