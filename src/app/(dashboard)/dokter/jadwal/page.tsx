'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/motion';
import { ScheduleGrid } from '@/components/features/ScheduleGrid';
import { ScheduleFormDialog } from '@/components/features/ScheduleFormDialog';
import { useSchedules } from '@/hooks/useSchedules';
import type { Schedule } from '@/app/(dashboard)/admin/doctors/[id]/schedules/page';

interface MeResponse { success: boolean; data?: { doctorProfile?: { id: string } } }

async function fetchDoctorId(): Promise<string> {
  const res = await fetch('/api/users/me');
  const json = (await res.json()) as MeResponse;
  return json.data?.doctorProfile?.id ?? '';
}

function PageHeader({ onAdd }: { onAdd: () => void }): React.JSX.Element {
  return (
    <motion.div variants={fadeInUp} className="flex items-end justify-between pb-6 border-b border-border">
      <div>
        <div className="label-eyebrow text-[10px] mb-2">Dokter · Jadwal</div>
        <h1 className="font-display text-[28px] leading-tight text-foreground">
          Jadwal Praktik <span className="font-display-italic text-primary">Saya.</span>
        </h1>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-[13px] rounded-sm hover:bg-(--moss-hover) transition-colors"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
        Tambah Jadwal
      </button>
    </motion.div>
  );
}

function ScheduleLoading(): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function ScheduleError({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="px-8 py-10 max-w-2xl">
      <p className="text-[13px] text-(--terracotta-ink) bg-(--terracotta-soft) px-4 py-3 rounded-sm">{message}</p>
    </div>
  );
}

function ScheduleContent({ doctorId }: { doctorId: string }): React.JSX.Element {
  const { schedules, loading, reload } = useSchedules(doctorId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);

  const openAdd = useCallback(() => { setEditing(null); setDialogOpen(true); }, []);
  const openEdit = useCallback((s: Schedule) => { setEditing(s); setDialogOpen(true); }, []);
  const onSaved = useCallback(() => { setDialogOpen(false); reload(); }, [reload]);

  if (loading) return <ScheduleLoading />;

  return (
    <motion.div className="max-w-5xl px-8 py-10 space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
      <PageHeader onAdd={openAdd} />
      <motion.div variants={fadeInUp}>
        <ScheduleGrid schedules={schedules} onEdit={openEdit} onDeleted={reload} />
      </motion.div>
      <ScheduleFormDialog open={dialogOpen} onOpenChange={setDialogOpen} doctorId={doctorId} schedule={editing} onSaved={onSaved} />
    </motion.div>
  );
}

export default function DokterJadwalPage(): React.JSX.Element {
  const [doctorId, setDoctorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDoctorId()
      .then((id) => { if (id) setDoctorId(id); else setError('Data dokter tidak ditemukan'); })
      .catch(() => setError('Gagal memuat profil dokter'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ScheduleLoading />;
  if (error) return <ScheduleError message={error} />;
  return <ScheduleContent doctorId={doctorId} />;
}
