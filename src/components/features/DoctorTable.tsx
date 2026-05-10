'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Loader2, CalendarDays } from 'lucide-react';
import type { Doctor } from '@/app/(dashboard)/admin/doctors/page';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

async function deleteDoctor(id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/doctors/${id}`, { method: 'DELETE' });
  const json = (await res.json()) as { success: boolean };
  return json.success;
}

function DeleteButton({ doctorId, onDeleted }: { doctorId: string; onDeleted: () => void }): React.JSX.Element {
  const [loading, setLoading] = useState(false);

  async function handleDelete(): Promise<void> {
    if (!confirm('Hapus dokter ini? Tindakan tidak dapat dibatalkan.')) return;
    setLoading(true);
    await deleteDoctor(doctorId);
    onDeleted();
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="p-1.5 rounded-sm text-muted-foreground hover:text-(--terracotta-ink) hover:bg-(--terracotta-soft) transition-colors disabled:opacity-50">
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />}
    </button>
  );
}

function DoctorRow({ d, onEdit, onDeleted }: { d: Doctor; onEdit: (d: Doctor) => void; onDeleted: () => void }): React.JSX.Element {
  return (
    <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-(--paper-2) transition-colors">
      <div>
        <p className="text-[13px] font-medium text-foreground">{d.user.name}</p>
        <p className="text-[11px] text-muted-foreground">{d.user.email}</p>
      </div>
      <p className="text-[12px] text-muted-foreground">{d.spesialis}</p>
      <p className="text-[12px] font-mono-tnum text-foreground">{formatRupiah(d.tarif)}</p>
      <p className="text-[12px] text-muted-foreground">{d.durasiMenit} mnt</p>
      <div className="flex items-center gap-1">
        <Link href={`/admin/doctors/${d.id}/schedules`} className="p-1.5 rounded-sm text-muted-foreground hover:text-primary hover:bg-accent transition-colors" title="Kelola Jadwal">
          <CalendarDays className="w-3.5 h-3.5" strokeWidth={1.5} />
        </Link>
        <button onClick={() => onEdit(d)} className="p-1.5 rounded-sm text-muted-foreground hover:text-primary hover:bg-accent transition-colors">
          <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
        <DeleteButton doctorId={d.id} onDeleted={onDeleted} />
      </div>
    </div>
  );
}

function TableHeader(): React.JSX.Element {
  return (
    <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border bg-(--paper-2)">
      {['Nama', 'Spesialisasi', 'Tarif', 'Durasi', 'Aksi'].map((h) => (
        <span key={h} className="label-eyebrow text-[10px]">{h}</span>
      ))}
    </div>
  );
}

export function DoctorTable({ doctors, onEdit, onDeleted }: {
  doctors: Doctor[]; onEdit: (d: Doctor) => void; onDeleted: () => void;
}): React.JSX.Element {
  if (doctors.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-12 text-center text-[13px] text-muted-foreground">
        Belum ada data dokter. Klik &quot;Tambah Dokter&quot; untuk memulai.
      </div>
    );
  }
  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <TableHeader />
      {doctors.map((d) => <DoctorRow key={d.id} d={d} onEdit={onEdit} onDeleted={onDeleted} />)}
    </div>
  );
}
