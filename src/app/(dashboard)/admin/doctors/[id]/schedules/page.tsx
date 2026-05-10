'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/motion';
import { ScheduleGrid } from '@/components/features/ScheduleGrid';
import { ScheduleFormDialog } from '@/components/features/ScheduleFormDialog';
import { useSchedules } from '@/hooks/useSchedules';

export interface Schedule {
  id: string;
  doctorId: string;
  hari: number;
  jamMulai: string;
  jamSelesai: string;
}

function PageHeader({ onAdd }: { onAdd: () => void }): React.JSX.Element {
  return (
    <motion.div variants={fadeInUp} className="flex items-end justify-between pb-6 border-b border-border">
      <div>
        <Link href="/admin/doctors" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />Kembali ke Dokter
        </Link>
        <div className="label-eyebrow text-[10px] mb-2">Admin · Dokter · Jadwal</div>
        <h1 className="font-display text-[28px] leading-tight text-foreground">
          Jadwal Praktik <span className="font-display-italic text-primary">Dokter.</span>
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

function SchedulesLoading(): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function SchedulesPage({ params }: { params: Promise<{ id: string }> }): React.JSX.Element {
  const { id: doctorId } = use(params);
  const { schedules, loading, reload } = useSchedules(doctorId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);

  const openAdd = useCallback(() => { setEditing(null); setDialogOpen(true); }, []);
  const openEdit = useCallback((s: Schedule) => { setEditing(s); setDialogOpen(true); }, []);
  const onSaved = useCallback(() => { setDialogOpen(false); reload(); }, [reload]);

  if (loading) return <SchedulesLoading />;

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
