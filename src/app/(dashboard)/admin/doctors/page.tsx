'use client';

import { useState, useCallback } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/motion';
import { DoctorTable } from '@/components/features/DoctorTable';
import { DoctorFormDialog } from '@/components/features/DoctorFormDialog';
import { useDoctors } from '@/hooks/useDoctors';

export interface Doctor {
  id: string;
  spesialis: string;
  tarif: number;
  durasiMenit: number;
  user: { id: string; name: string; email: string };
}

function PageHeader({ onAdd }: { onAdd: () => void }): React.JSX.Element {
  return (
    <motion.div variants={fadeInUp} className="flex items-end justify-between pb-6 border-b border-border">
      <div>
        <div className="label-eyebrow text-[10px] mb-2">Admin · Dokter</div>
        <h1 className="font-display text-[28px] leading-tight text-foreground">
          Manajemen <span className="font-display-italic text-primary">Dokter.</span>
        </h1>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-[13px] rounded-sm hover:bg-(--moss-hover) transition-colors"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
        Tambah Dokter
      </button>
    </motion.div>
  );
}

export default function AdminDoctorsPage(): React.JSX.Element {
  const { doctors, loading, reload } = useDoctors();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);

  const openAdd = useCallback(() => { setEditing(null); setDialogOpen(true); }, []);
  const openEdit = useCallback((d: Doctor) => { setEditing(d); setDialogOpen(true); }, []);
  const onSaved = useCallback(() => { setDialogOpen(false); reload(); }, [reload]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div className="max-w-5xl px-8 py-10 space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
      <PageHeader onAdd={openAdd} />
      <motion.div variants={fadeInUp}>
        <DoctorTable doctors={doctors} onEdit={openEdit} onDeleted={reload} />
      </motion.div>
      <DoctorFormDialog open={dialogOpen} onOpenChange={setDialogOpen} doctor={editing} onSaved={onSaved} />
    </motion.div>
  );
}
