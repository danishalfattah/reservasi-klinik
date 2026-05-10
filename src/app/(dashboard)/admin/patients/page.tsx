'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/motion';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  _count: { reservations: number };
}

async function fetchPatients(): Promise<Patient[]> {
  const res = await fetch('/api/users?role=PASIEN');
  const json = (await res.json()) as { success: boolean; data?: Patient[] };
  return json.success && json.data ? json.data : [];
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function TableHeader(): React.JSX.Element {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border bg-(--paper-2)">
      {['Pasien', 'No. HP', 'Terdaftar', 'Reservasi'].map((h) => (
        <span key={h} className="label-eyebrow text-[10px]">{h}</span>
      ))}
    </div>
  );
}

function PatientRow({ p }: { p: Patient }): React.JSX.Element {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-(--paper-2) transition-colors">
      <div>
        <p className="text-[13px] font-medium text-foreground">{p.name}</p>
        <p className="text-[11px] text-muted-foreground">{p.email}</p>
      </div>
      <p className="text-[12px] text-muted-foreground font-mono-tnum">{p.phone ?? '—'}</p>
      <p className="text-[12px] text-muted-foreground">{formatDate(p.createdAt)}</p>
      <p className="text-[12px] font-mono-tnum text-foreground text-center">{p._count.reservations}</p>
    </div>
  );
}

function EmptyState(): React.JSX.Element {
  return (
    <div className="border border-dashed border-border rounded-lg p-12 text-center text-[13px] text-muted-foreground">
      Belum ada pasien yang terdaftar.
    </div>
  );
}

function PatientTable({ patients }: { patients: Patient[] }): React.JSX.Element {
  if (patients.length === 0) return <EmptyState />;
  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <TableHeader />
      {patients.map((p) => <PatientRow key={p.id} p={p} />)}
    </div>
  );
}

function PageHeader(): React.JSX.Element {
  return (
    <motion.div variants={fadeInUp} className="pb-6 border-b border-border">
      <div className="label-eyebrow text-[10px] mb-2">Admin · Pasien</div>
      <h1 className="font-display text-[28px] leading-tight text-foreground">
        Data <span className="font-display-italic text-primary">Pasien.</span>
      </h1>
    </motion.div>
  );
}

export default function AdminPatientsPage(): React.JSX.Element {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients().then(setPatients).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div className="max-w-5xl px-8 py-10 space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
      <PageHeader />
      <motion.div variants={fadeInUp}>
        <PatientTable patients={patients} />
      </motion.div>
    </motion.div>
  );
}
