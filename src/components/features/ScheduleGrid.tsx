'use client';

import { useState } from 'react';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import type { Schedule } from '@/app/(dashboard)/admin/doctors/[id]/schedules/page';

const HARI_LABEL: Record<number, string> = {
  1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu',
};

const ACTIVE_DAYS = [1, 2, 3, 4, 5, 6];

async function deleteSchedule(id: string): Promise<void> {
  await fetch(`/api/admin/schedules/${id}`, { method: 'DELETE' });
}

function DeleteButton({ id, onDeleted }: { id: string; onDeleted: () => void }): React.JSX.Element {
  const [loading, setLoading] = useState(false);

  async function handleDelete(): Promise<void> {
    if (!confirm('Hapus jadwal ini?')) return;
    setLoading(true);
    await deleteSchedule(id);
    onDeleted();
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="p-1 rounded-sm text-muted-foreground hover:text-(--terracotta-ink) hover:bg-(--terracotta-soft) transition-colors disabled:opacity-50">
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" strokeWidth={1.5} />}
    </button>
  );
}

function SlotActions({ s, onEdit, onDeleted }: { s: Schedule; onEdit: (s: Schedule) => void; onDeleted: () => void }): React.JSX.Element {
  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => onEdit(s)} className="p-1 rounded-sm text-muted-foreground hover:text-primary hover:bg-accent transition-colors">
        <Pencil className="w-3 h-3" strokeWidth={1.5} />
      </button>
      <DeleteButton id={s.id} onDeleted={onDeleted} />
    </div>
  );
}

function ScheduleSlot({ s, onEdit, onDeleted }: { s: Schedule; onEdit: (s: Schedule) => void; onDeleted: () => void }): React.JSX.Element {
  return (
    <div className="group flex items-center justify-between bg-accent border border-(--moss-line) rounded-sm px-2.5 py-1.5">
      <span className="text-[11px] font-medium text-accent-foreground font-mono-tnum">{s.jamMulai}–{s.jamSelesai}</span>
      <SlotActions s={s} onEdit={onEdit} onDeleted={onDeleted} />
    </div>
  );
}

function EmptyDay(): React.JSX.Element {
  return <p className="text-[11px] text-muted-foreground text-center py-4">Kosong</p>;
}

function DayColumn({ hari, slots, onEdit, onDeleted }: { hari: number; slots: Schedule[]; onEdit: (s: Schedule) => void; onDeleted: () => void }): React.JSX.Element {
  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="px-3 py-2.5 border-b border-border bg-(--paper-2)">
        <span className="label-eyebrow text-[10px]">{HARI_LABEL[hari]}</span>
      </div>
      <div className="p-2.5 flex flex-col gap-1.5">
        {slots.length === 0 ? <EmptyDay /> : slots.map((s) => <ScheduleSlot key={s.id} s={s} onEdit={onEdit} onDeleted={onDeleted} />)}
      </div>
    </div>
  );
}

export function ScheduleGrid({ schedules, onEdit, onDeleted }: {
  schedules: Schedule[]; onEdit: (s: Schedule) => void; onDeleted: () => void;
}): React.JSX.Element {
  const byDay = ACTIVE_DAYS.reduce<Record<number, Schedule[]>>((acc, h) => {
    acc[h] = schedules.filter((s) => s.hari === h);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {ACTIVE_DAYS.map((h) => (
        <DayColumn key={h} hari={h} slots={byDay[h] ?? []} onEdit={onEdit} onDeleted={onDeleted} />
      ))}
    </div>
  );
}
