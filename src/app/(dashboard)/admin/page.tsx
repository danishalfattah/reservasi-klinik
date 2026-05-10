'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Stethoscope, Users, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/motion';

interface Stats {
  doctors: number;
  patients: number;
}

async function fetchStats(): Promise<Stats> {
  const [docRes, patRes] = await Promise.all([
    fetch('/api/doctors'),
    fetch('/api/users?role=PASIEN'),
  ]);
  const docData = (await docRes.json()) as { success: boolean; data?: unknown[] };
  const patData = (await patRes.json()) as { success: boolean; data?: unknown[] };
  return {
    doctors: docData.success && docData.data ? docData.data.length : 0,
    patients: patData.success && patData.data ? patData.data.length : 0,
  };
}

function StatCard({ icon: Icon, label, value, href }: {
  icon: React.ElementType; label: string; value: number; href: string;
}): React.JSX.Element {
  return (
    <motion.div variants={staggerItem}>
      <Link href={href} className="group block border border-border rounded-lg bg-card p-6 hover:border-(--line-2) transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="w-9 h-9 rounded-sm bg-(--moss-soft) flex items-center justify-center">
            <Icon className="w-[17px] h-[17px] text-(--moss-ink)" strokeWidth={1.5} />
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" strokeWidth={1.5} />
        </div>
        <p className="font-display text-[40px] leading-none text-foreground mb-1">{value}</p>
        <p className="text-[12px] text-muted-foreground">{label}</p>
      </Link>
    </motion.div>
  );
}

const QUICK_LINKS = [
  { href: '/admin/doctors', label: 'Kelola Data Dokter', desc: 'Tambah, edit, dan atur jadwal dokter' },
  { href: '/admin/patients', label: 'Data Pasien', desc: 'Lihat daftar pasien yang terdaftar' },
];

function QuickLinks(): React.JSX.Element {
  return (
    <motion.div variants={fadeInUp} className="space-y-2">
      <div className="label-eyebrow text-[10px] mb-3">Akses Cepat</div>
      {QUICK_LINKS.map((l) => (
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

export default function AdminPage(): React.JSX.Element {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats().then(setStats).finally(() => setLoading(false));
  }, []);

  return (
    <motion.div className="max-w-2xl px-8 py-10 space-y-8" variants={staggerContainer} initial="hidden" animate="visible">
      <motion.div variants={fadeInUp} className="pb-6 border-b border-border">
        <div className="label-eyebrow text-[10px] mb-2">Admin</div>
        <h1 className="font-display text-[32px] leading-tight text-foreground">
          Panel <span className="font-display-italic text-primary">Administrasi.</span>
        </h1>
      </motion.div>

      {loading ? (
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />Memuat data...
        </div>
      ) : (
        <motion.div className="grid grid-cols-2 gap-3" variants={staggerContainer} initial="hidden" animate="visible">
          <StatCard icon={Stethoscope} label="Total Dokter" value={stats?.doctors ?? 0} href="/admin/doctors" />
          <StatCard icon={Users} label="Total Pasien" value={stats?.patients ?? 0} href="/admin/patients" />
        </motion.div>
      )}

      <QuickLinks />
    </motion.div>
  );
}
