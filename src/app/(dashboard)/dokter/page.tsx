'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Loader2, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp, staggerItem } from '@/lib/motion';

interface DoctorProfile {
  id: string;
  name: string;
  role: string;
  doctorProfile?: { id: string; spesialis: string; tarif: number; durasiMenit: number } | null;
}

interface Schedule {
  id: string;
  hari: number;
  jamMulai: string;
  jamSelesai: string;
}

const HARI_LABEL: Record<number, string> = {
  1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu',
};

function getTodayHari(): number {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

async function fetchProfile(): Promise<DoctorProfile> {
  const res = await fetch('/api/users/me');
  const json = (await res.json()) as { success: boolean; data?: DoctorProfile };
  if (!json.success || !json.data) throw new Error('Gagal memuat profil');
  return json.data;
}

async function fetchSchedules(doctorId: string): Promise<Schedule[]> {
  const res = await fetch(`/api/doctors/${doctorId}/schedules`);
  const json = (await res.json()) as { success: boolean; data?: Schedule[] };
  return json.success && json.data ? json.data : [];
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function DashboardHeader({ name }: { name: string }): React.JSX.Element {
  return (
    <motion.div variants={fadeInUp} className="pb-6 border-b border-border">
      <div className="label-eyebrow text-[10px] mb-2">Dokter</div>
      <h1 className="font-display text-[32px] leading-tight text-foreground">
        Halo, <span className="font-display-italic text-primary">{name}.</span>
      </h1>
    </motion.div>
  );
}

function ProfileCard({ profile }: { profile: DoctorProfile }): React.JSX.Element {
  const doc = profile.doctorProfile;
  return (
    <motion.div variants={fadeInUp} className="border border-border rounded-lg bg-card p-5 space-y-3">
      <div className="label-eyebrow text-[10px]">Profil Saya</div>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-sm bg-accent flex items-center justify-center shrink-0">
          <UserCircle className="w-5 h-5 text-accent-foreground" strokeWidth={1.5} />
        </div>
        <div className="space-y-0.5">
          <p className="text-[14px] font-medium text-foreground">dr. {profile.name}</p>
          <p className="text-[12px] text-muted-foreground">{doc?.spesialis ?? '—'}</p>
          {doc && (
            <p className="text-[11px] text-muted-foreground">
              {formatRupiah(doc.tarif)} · {doc.durasiMenit} mnt/pasien
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TodaySlot({ s }: { s: Schedule }): React.JSX.Element {
  return (
    <motion.div variants={staggerItem} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
      <span className="text-[13px] text-foreground font-mono-tnum">{s.jamMulai} – {s.jamSelesai}</span>
      <span className="text-[11px] text-muted-foreground">{HARI_LABEL[s.hari]}</span>
    </motion.div>
  );
}

function TodaySchedule({ slots, doctorId }: { slots: Schedule[]; doctorId: string }): React.JSX.Element {
  return (
    <motion.div variants={fadeInUp} className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border bg-(--paper-2) flex items-center justify-between">
        <span className="label-eyebrow text-[10px]">Jadwal Hari Ini</span>
        <Link href={`/admin/doctors/${doctorId}/schedules`} className="text-[11px] text-primary hover:text-(--moss-hover) transition-colors">Kelola semua</Link>
      </div>
      {slots.length === 0 ? (
        <p className="text-[13px] text-muted-foreground text-center py-8">Tidak ada jadwal hari ini</p>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          {slots.map((s) => <TodaySlot key={s.id} s={s} />)}
        </motion.div>
      )}
    </motion.div>
  );
}

function QuickLinks({ doctorId }: { doctorId: string }): React.JSX.Element {
  const links = [
    { href: `/admin/doctors/${doctorId}/schedules`, label: 'Kelola Jadwal Praktik', desc: 'Tambah dan atur jam praktik harian' },
    { href: '/profile', label: 'Edit Profil', desc: 'Perbarui data spesialisasi dan tarif' },
  ];
  return (
    <motion.div variants={fadeInUp} className="space-y-2">
      <div className="label-eyebrow text-[10px] mb-3">Akses Cepat</div>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="group flex items-center justify-between px-4 py-3 border border-border rounded-sm bg-card hover:border-(--line-2) transition-colors">
          <div>
            <p className="text-[13px] font-medium text-foreground">{l.label}</p>
            <p className="text-[11px] text-muted-foreground">{l.desc}</p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" strokeWidth={1.5} />
        </Link>
      ))}
    </motion.div>
  );
}

interface DashboardData { profile: DoctorProfile; todaySlots: Schedule[] }

function useDashboard(): { data: DashboardData | null; loading: boolean; error: string } {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile()
      .then(async (profile) => {
        const doctorId = profile.doctorProfile?.id ?? '';
        const schedules = doctorId ? await fetchSchedules(doctorId) : [];
        const today = getTodayHari();
        const todaySlots = schedules.filter((s) => s.hari === today);
        setData({ profile, todaySlots });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

function DashboardContent({ data }: { data: DashboardData }): React.JSX.Element {
  const doctorId = data.profile.doctorProfile?.id ?? '';
  return (
    <motion.div className="max-w-2xl px-8 py-10 space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
      <DashboardHeader name={data.profile.name} />
      <ProfileCard profile={data.profile} />
      <TodaySchedule slots={data.todaySlots} doctorId={doctorId} />
      <QuickLinks doctorId={doctorId} />
    </motion.div>
  );
}

export default function DokterPage(): React.JSX.Element {
  const { data, loading, error } = useDashboard();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-8 py-10 max-w-2xl">
        <p className="text-[13px] text-(--terracotta-ink) bg-(--terracotta-soft) px-4 py-3 rounded-sm">{error || 'Data tidak tersedia'}</p>
      </div>
    );
  }

  return <DashboardContent data={data} />;
}
