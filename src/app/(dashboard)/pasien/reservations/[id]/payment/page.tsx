'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp, staggerItem } from '@/lib/motion';
import { SnapButton } from '@/components/features/SnapButton';

interface ReservationPaymentDetail {
  id: string;
  tanggal: string;
  jam: string;
  status: string;
  doctor?: { spesialis: string; tarif: number; user?: { name: string } };
  payment?: { status: string; snapToken: string; midtransOrderId: string } | null;
}

async function fetchReservation(id: string): Promise<ReservationPaymentDetail> {
  const res = await fetch(`/api/reservations/${id}`);
  const data = (await res.json()) as { success: boolean; data?: ReservationPaymentDetail; error?: { message: string } };
  if (!data.success || !data.data) throw new Error(data.error?.message ?? 'Reservasi tidak ditemukan');
  return data.data;
}

interface PaymentToken { snapToken: string; midtransOrderId: string }

async function ensurePayment(reservationId: string): Promise<PaymentToken> {
  const res = await fetch('/api/payments/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reservationId }),
  });
  const data = (await res.json()) as { success: boolean; data?: PaymentToken; error?: { message: string } };
  if (!data.success || !data.data) throw new Error(data.error?.message ?? 'Gagal menyiapkan pembayaran');
  return data.data;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function isPaid(r: ReservationPaymentDetail): boolean {
  return r.status === 'CONFIRMED' || r.payment?.status === 'PAID';
}

function InvoiceRow({ label, value, bold }: { label: string; value: string; bold?: boolean }): React.JSX.Element {
  return (
    <motion.div variants={staggerItem} className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className={`text-[13px] text-foreground ${bold ? 'font-medium' : ''}`}>{value}</span>
    </motion.div>
  );
}

function getDoctorName(r: ReservationPaymentDetail): string { return r.doctor?.user?.name ?? 'Dokter'; }
function getSpesialis(r: ReservationPaymentDetail): string { return r.doctor?.spesialis ?? 'Konsultasi'; }
function getTarif(r: ReservationPaymentDetail): number { return r.doctor?.tarif ?? 0; }

function InvoiceRows({ r }: { r: ReservationPaymentDetail }): React.JSX.Element {
  return (
    <div className="px-5">
      <InvoiceRow label="Dokter" value={`dr. ${getDoctorName(r)}`} />
      <InvoiceRow label="Layanan" value={getSpesialis(r)} />
      <InvoiceRow label="Jadwal" value={`${formatDate(r.tanggal)}, ${r.jam}`} />
      <InvoiceRow label="Total" value={formatRupiah(getTarif(r))} bold />
    </div>
  );
}

function Invoice({ r }: { r: ReservationPaymentDetail }): React.JSX.Element {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-(--paper-2)">
        <span className="label-eyebrow text-[10px]">Ringkasan Pembayaran</span>
      </div>
      <InvoiceRows r={r} />
    </motion.div>
  );
}

function PaidState({ id }: { id: string }): React.JSX.Element {
  return (
    <div className="border border-(--moss-line) rounded-lg bg-(--moss-soft) p-5 flex items-center gap-3">
      <CheckCircle className="w-4 h-4 text-(--moss-ink) shrink-0" strokeWidth={1.5} />
      <div className="flex-1">
        <p className="text-[13px] font-medium text-(--moss-ink)">Pembayaran sudah selesai</p>
        <p className="text-[11px] text-(--moss-ink) opacity-70 mt-0.5">Reservasi Anda telah terkonfirmasi.</p>
      </div>
      <Link href={`/pasien/reservations/${id}`} className="text-[12px] text-(--moss-ink) underline shrink-0">Lihat detail</Link>
    </div>
  );
}

interface PaymentPageState { reservation: ReservationPaymentDetail | null; snapToken: string; orderId: string; error: string; loading: boolean }

function usePaymentPage(id: string | undefined): PaymentPageState {
  const [reservation, setReservation] = useState<ReservationPaymentDetail | null>(null);
  const [snapToken, setSnapToken] = useState('');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchReservation(id)
      .then(async (data) => {
        setReservation(data);
        if (isPaid(data)) {
          setSnapToken(data.payment?.snapToken ?? '');
          setOrderId(data.payment?.midtransOrderId ?? '');
          return;
        }
        const payment = await ensurePayment(id);
        setSnapToken(payment.snapToken);
        setOrderId(payment.midtransOrderId);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Gagal memuat pembayaran'))
      .finally(() => setLoading(false));
  }, [id]);

  return { reservation, snapToken, orderId, error, loading };
}

function PaymentHeader({ id }: { id: string }): React.JSX.Element {
  return (
    <motion.div variants={fadeInUp}>
      <Link href={`/pasien/reservations/${id}`} className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-5">
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />Detail Reservasi
      </Link>
      <div className="label-eyebrow text-[10px] mb-2">Pembayaran</div>
      <h1 className="font-display text-[28px] leading-tight text-foreground">
        Selesaikan <span className="font-display-italic text-primary">pembayaran.</span>
      </h1>
    </motion.div>
  );
}

function PaymentContent({ id, reservation, snapToken, orderId }: { id: string; reservation: ReservationPaymentDetail; snapToken: string; orderId: string }): React.JSX.Element {
  return (
    <motion.div className="max-w-sm px-8 py-10 space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
      <PaymentHeader id={id} />
      <motion.div variants={fadeInUp}><Invoice r={reservation} /></motion.div>
      <motion.div variants={fadeInUp}>
        {isPaid(reservation) ? <PaidState id={id} /> : <SnapButton snapToken={snapToken} reservationId={id} orderId={orderId} />}
      </motion.div>
    </motion.div>
  );
}

function PaymentLoading(): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function PaymentError({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="max-w-sm px-8 py-10">
      <p className="text-[13px] text-(--terracotta-ink) bg-(--terracotta-soft) px-4 py-3 rounded-sm mb-4">{message}</p>
      <Link href="/pasien/reservations" className="text-[13px] text-primary hover:text-(--moss-hover) transition-colors">← Kembali ke daftar</Link>
    </div>
  );
}

function resolveId(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

export default function PaymentPage(): React.JSX.Element {
  const id = resolveId(useParams().id);
  const { reservation, snapToken, orderId, error, loading } = usePaymentPage(id);

  if (loading) return <PaymentLoading />;
  if (error || !reservation || !id) return <PaymentError message={error || 'Reservasi tidak ditemukan'} />;
  return <PaymentContent id={id} reservation={reservation} snapToken={snapToken} orderId={orderId} />;
}
