'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { FloatingInput } from '@/components/features/FloatingInput';
import type { Doctor } from '@/app/(dashboard)/admin/doctors/page';

interface FormState {
  name: string; email: string; password: string;
  spesialis: string; tarif: string; durasiMenit: string;
}

function emptyState(): FormState {
  return { name: '', email: '', password: '', spesialis: '', tarif: '', durasiMenit: '' };
}

function fromDoctor(d: Doctor): FormState {
  return { name: d.user.name, email: d.user.email, password: '', spesialis: d.spesialis, tarif: String(d.tarif), durasiMenit: String(d.durasiMenit) };
}

function initState(doctor: Doctor | null): FormState {
  return doctor ? fromDoctor(doctor) : emptyState();
}

async function createDoctor(state: FormState): Promise<string | null> {
  const res = await fetch('/api/admin/doctors', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: state.name, email: state.email, password: state.password, spesialis: state.spesialis, tarif: Number(state.tarif), durasiMenit: Number(state.durasiMenit) }),
  });
  const json = (await res.json()) as { success: boolean; error?: { message: string } };
  return json.success ? null : (json.error?.message ?? 'Gagal menyimpan');
}

async function updateDoctor(id: string, state: FormState): Promise<string | null> {
  const res = await fetch(`/api/admin/doctors/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: state.name, spesialis: state.spesialis, tarif: Number(state.tarif), durasiMenit: Number(state.durasiMenit) }),
  });
  const json = (await res.json()) as { success: boolean; error?: { message: string } };
  return json.success ? null : (json.error?.message ?? 'Gagal menyimpan');
}

function submitForm(doctor: Doctor | null, state: FormState): Promise<string | null> {
  return doctor ? updateDoctor(doctor.id, state) : createDoctor(state);
}

function FormFields({ state, set, isEdit }: { state: FormState; set: (k: keyof FormState, v: string) => void; isEdit: boolean }): React.JSX.Element {
  return (
    <div className="space-y-3">
      <FloatingInput id="df-name" label="Nama Lengkap" required value={state.name} onChange={(v) => set('name', v)} />
      {!isEdit && <FloatingInput id="df-email" label="Email" type="email" required value={state.email} onChange={(v) => set('email', v)} />}
      {!isEdit && <FloatingInput id="df-password" label="Password" type="password" required value={state.password} onChange={(v) => set('password', v)} />}
      <FloatingInput id="df-spesialis" label="Spesialisasi" required value={state.spesialis} onChange={(v) => set('spesialis', v)} />
      <FloatingInput id="df-tarif" label="Tarif Konsultasi (Rp)" type="number" required value={state.tarif} onChange={(v) => set('tarif', v)} />
      <FloatingInput id="df-durasi" label="Durasi per Pasien (menit)" type="number" required value={state.durasiMenit} onChange={(v) => set('durasiMenit', v)} />
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

function DoctorForm({ doctor, onSaved, onCancel }: { doctor: Doctor | null; onSaved: () => void; onCancel: () => void }): React.JSX.Element {
  const isEdit = doctor !== null;
  const [state, setState] = useState<FormState>(() => initState(doctor));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(key: keyof FormState, value: string): void {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const err = await submitForm(doctor, state);
      if (err) { setError(err); return; }
      onSaved();
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormFields state={state} set={set} isEdit={isEdit} />
      {error && <p className="text-[12px] text-(--terracotta-ink) bg-(--terracotta-soft) px-3 py-2 rounded-sm">{error}</p>}
      <FormButtons saving={saving} onCancel={onCancel} />
    </form>
  );
}

export function DoctorFormDialog({ open, onOpenChange, doctor, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void; doctor: Doctor | null; onSaved: () => void;
}): React.JSX.Element {
  if (!open) return <></>;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-md bg-background border border-border rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="label-eyebrow text-[10px] mb-1">{doctor ? 'Edit' : 'Tambah'} Dokter</div>
            <h2 className="font-display text-[20px] leading-tight text-foreground">{doctor ? doctor.user.name : 'Dokter baru'}</h2>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
        <DoctorForm key={doctor?.id ?? 'new'} doctor={doctor} onSaved={onSaved} onCancel={() => onOpenChange(false)} />
      </div>
    </div>
  );
}
