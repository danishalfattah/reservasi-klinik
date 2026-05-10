'use client';

import Link from 'next/link';
import { CalendarPlus, ClipboardList, History, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { ReservationCard, type ReservationCardItem } from '@/components/features/ReservationCard';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/motion';

interface Profile { name: string }

async function fetchProfile(): Promise<Profile> {
  const res = await fetch('/api/users/me');
  const json = (await res.json()) as { success: boolean; data?: Profile };
  return json.success && json.data ? json.data : { name: 'Pasien' };
}

async function fetchReservations(): Promise<ReservationCardItem[]> {
  const res = await fetch('/api/reservations');
  const json = (await res.json()) as { success: boolean; data?: ReservationCardItem[] };
  return json.success && json.data ? json.data : [];
}

function isActive(item: ReservationCardItem): boolean {
  return item.status === 'PENDING' || item.status === 'CONFIRMED';
}

function splitReservations(items: ReservationCardItem[]): { active: ReservationCardItem[]; history: ReservationCardItem[] } {
  return { active: items.filter(isActive), history: items.filter((i) => !isActive(i)) };
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }): React.JSX.Element {
  return (
    <motion.div variants={staggerItem} className="border border-border rounded-lg bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        <span className="label-eyebrow text-[10px]">{label}</span>
      </div>
      <p className="font-display text-[36px] leading-none text-foreground">{value}</p>
    </motion.div>
  );
}

function EmptyState({ text }: { text: string }): React.JSX.Element {
  return (
    <div className="border border-dashed border-border rounded-lg p-8 text-center text-[13px] text-muted-foreground">
      {text}
    </div>
  );
}

function ReservationSection({ title, items, emptyText }: {
  title: string; items: ReservationCardItem[]; emptyText: string;
}): React.JSX.Element {
  return (
    <motion.section variants={fadeInUp}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-medium text-foreground">{title}</h2>
        <Link href="/pasien/reservations" className="text-[12px] text-primary hover:text-(--moss-hover) transition-colors">
          Lihat semua
        </Link>
      </div>
      {items.length === 0 ? (
        <EmptyState text={emptyText} />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {items.map((item) => <ReservationCard key={item.id} item={item} />)}
        </div>
      )}
    </motion.section>
  );
}

function PageHeader({ name }: { name: string }): React.JSX.Element {
  return (
    <motion.div variants={fadeInUp} className="flex items-end justify-between pb-6 border-b border-border">
      <div>
        <div className="label-eyebrow text-[10px] mb-2">Dashboard Pasien</div>
        <h1 className="font-display text-[32px] leading-tight text-foreground">
          Halo, <span className="font-display-italic text-primary">{name}.</span>
        </h1>
      </div>
      <Link
        href="/pasien/booking"
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-[13px] rounded-sm hover:bg-(--moss-hover) transition-colors"
      >
        <CalendarPlus className="w-3.5 h-3.5" strokeWidth={1.5} />
        Booking Baru
      </Link>
    </motion.div>
  );
}

function useDashboardData(): { profile: Profile; grouped: { active: ReservationCardItem[]; history: ReservationCardItem[] }; loading: boolean } {
  const [profile, setProfile] = useState<Profile>({ name: 'Pasien' });
  const [reservations, setReservations] = useState<ReservationCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const grouped = useMemo(() => splitReservations(reservations), [reservations]);

  useEffect(() => {
    Promise.all([fetchProfile(), fetchReservations()])
      .then(([p, r]) => { setProfile(p); setReservations(r); })
      .finally(() => setLoading(false));
  }, []);

  return { profile, grouped, loading };
}

function DashboardContent({ profile, grouped }: { profile: Profile; grouped: { active: ReservationCardItem[]; history: ReservationCardItem[] } }): React.JSX.Element {
  return (
    <motion.div className="max-w-5xl px-8 py-10 space-y-8" variants={staggerContainer} initial="hidden" animate="visible">
      <PageHeader name={profile.name} />
      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3 max-w-sm">
        <StatCard icon={ClipboardList} label="Aktif" value={grouped.active.length} />
        <StatCard icon={History} label="Riwayat" value={grouped.history.length} />
      </motion.div>
      <ReservationSection title="Reservasi Aktif" items={grouped.active} emptyText="Belum ada reservasi aktif. Mulai booking untuk membuat jadwal konsultasi." />
      <ReservationSection title="Riwayat" items={grouped.history} emptyText="Riwayat reservasi selesai atau dibatalkan akan tampil di sini." />
    </motion.div>
  );
}

export default function PasienPage(): React.JSX.Element {
  const { profile, grouped, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <DashboardContent profile={profile} grouped={grouped} />;
}
