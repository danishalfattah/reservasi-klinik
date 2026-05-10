'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { FloatingInput } from '@/components/features/FloatingInput';
import type { Schedule } from '@/app/(dashboard)/admin/doctors/[id]/schedules/page';

const HARI_OPTIONS = [
  { value: 1, label: 'Senin' }, { value: 2, label: 'Selasa' }, { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' }, { value: 5, label: 'Jumat' }, { value: 6, label: 'Sabtu' },
];

interface FormState { hari: string; jamMulai: string; jamSelesai: string }

function initState(s: Schedule | null): FormState {
  return s
    ? { hari: String(s.hari), jamMulai: s.jamMulai, jamSelesai: s.jamSelesai }
    : { hari: '1', jamMulai: '', jamSelesai: '' };
}

async function submitSchedule(doctorId: string, schedule: Schedule | null, state: FormState): Promise<string | null> {
  const body = { hari: Number(state.hari), jamMulai: state.jamMulai, jamSelesai: state.jamSelesai };
  const url = schedule ? `/api/admin/schedules/${schedule.id}` : `/api/admin/doctors/${doctorId}/schedules`;
  const method = schedule ? 'PATCH' : 'POST';
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = (await res.json()) as { success: boolean; error?: { message: string } };
  return json.success ? null : (json.error?.message ?? 'Gagal menyimpan');
}

function HariSelect({ value, onChange }: { value: string; onChange: (v: string) => void }): React.JSX.Element {
  return (
    <div className="space-y-1.5">
      <label className="label-eyebrow text-[10px]">Hari</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-10 px-3 bg-background border border-border rounded-sm text-[13px] text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all">
        {HARI_OPTIONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
      </select>
    </div>
  );
}

function ScheduleFields({ state, set }: { state: FormState; set: (k: keyof FormState, v: string) => void }): React.JSX.Element {
  return (
    <div className="space-y-3">
      <HariSelect value={state.hari} onChange={(v) => set('hari', v)} />
      <FloatingInput id="sf-mulai" label="Jam Mulai (HH:MM)" required value={state.jamMulai} onChange={(v) => set('jamMulai', v)} />
      <FloatingInput id="sf-selesai" label="Jam Selesai (HH:MM)" required value={state.jamSelesai} onChange={(v) => set('jamSelesai', v)} />
      <p className="text-[11px] text-muted-foreground">Operasional: Sen–Jum 08:00–17:00, Sabtu 08:00–12:00</p>
    </div>
  );
}

function FormButtons({ saving, onCancel }: { saving: boolean; onCancel: () => void }): React.JSX.Element {
  return (
    <div className="flex gap-2 pt-1">
      <button type="button" onClick={onCancel} className="flex-1 h-9 border border-border text-[13px] text-foreground rounded-sm hover:bg-secondary transition-colors">Batal</button>
      <button type="submit" disabled={saving} className="flex-1 h-9 bg-primary text-primary-foreground text-[13px] rounded-sm hover:bg-(--moss-hover) disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Simpan'}
      </button>
    </div>
  );
}

function ScheduleForm({ doctorId, schedule, onSaved, onCancel }: {
  doctorId: string; schedule: Schedule | null; onSaved: () => void; onCancel: () => void;
}): React.JSX.Element {
  const [state, setState] = useState<FormState>(() => initState(schedule));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(key: keyof FormState, value: string): void { setState((prev) => ({ ...prev, [key]: value })); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const err = await submitSchedule(doctorId, schedule, state);
      if (err) { setError(err); return; }
      onSaved();
    } catch { setError('Terjadi kesalahan. Silakan coba lagi.'); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <ScheduleFields state={state} set={set} />
      {error && <p className="text-[12px] text-(--terracotta-ink) bg-(--terracotta-soft) px-3 py-2 rounded-sm">{error}</p>}
      <FormButtons saving={saving} onCancel={onCancel} />
    </form>
  );
}

function DialogHeader({ schedule, onClose }: { schedule: Schedule | null; onClose: () => void }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <div className="label-eyebrow text-[10px] mb-1">{schedule ? 'Edit' : 'Tambah'} Jadwal</div>
        <h2 className="font-display text-[20px] leading-tight text-foreground">{schedule ? `${schedule.jamMulai}–${schedule.jamSelesai}` : 'Jadwal baru'}</h2>
      </div>
      <button onClick={onClose} className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
        <X className="w-4 h-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function ScheduleFormDialog({ open, onOpenChange, doctorId, schedule, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void; doctorId: string; schedule: Schedule | null; onSaved: () => void;
}): React.JSX.Element {
  if (!open) return <></>;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-sm bg-background border border-border rounded-lg shadow-lg p-6">
        <DialogHeader schedule={schedule} onClose={() => onOpenChange(false)} />
        <ScheduleForm key={schedule?.id ?? 'new'} doctorId={doctorId} schedule={schedule} onSaved={onSaved} onCancel={() => onOpenChange(false)} />
      </div>
    </div>
  );
}
