'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { FloatingInput } from '@/components/features/FloatingInput';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  doctorProfile?: { spesialis: string; tarif: number; durasiMenit: number } | null;
}

interface FormState {
  name: string;
  phone: string;
  spesialis: string;
  tarif: string;
  durasiMenit: string;
}

const ROLE_LABEL: Record<string, string> = { PASIEN: 'Pasien', ADMIN: 'Administrator', DOKTER: 'Dokter' };

async function fetchProfile(): Promise<Profile | null> {
  const res = await fetch('/api/users/me');
  const json = (await res.json()) as { success: boolean; data?: Profile };
  return json.success && json.data ? json.data : null;
}

async function patchProfile(role: string, state: FormState): Promise<void> {
  const body: Record<string, unknown> = {
    name: state.name,
    phone: state.phone || undefined,
    ...(role === 'DOKTER' && {
      spesialis: state.spesialis,
      tarif: Number(state.tarif),
      durasiMenit: Number(state.durasiMenit),
    }),
  };
  const res = await fetch('/api/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { success: boolean; error?: { message: string } };
  if (!json.success) throw new Error(json.error?.message ?? 'Gagal menyimpan');
}

function initFormState(p: Profile): FormState {
  const doc = p.doctorProfile ?? { spesialis: '', tarif: '', durasiMenit: '' };
  return {
    name: p.name,
    phone: p.phone ?? '',
    spesialis: doc.spesialis,
    tarif: String(doc.tarif),
    durasiMenit: String(doc.durasiMenit),
  };
}

function EmailField({ email }: { email: string }): React.JSX.Element {
  return (
    <div className="relative">
      <input
        disabled
        value={email}
        className="w-full px-3 pt-5 pb-1.5 bg-(--paper-2) border border-border rounded-sm text-[14px] text-muted-foreground cursor-not-allowed"
      />
      <label className="absolute left-3 top-1.5 text-[10px] text-muted-foreground">
        Email (tidak dapat diubah)
      </label>
    </div>
  );
}

function DokterFields({ state, update }: { state: FormState; update: (k: keyof FormState, v: string) => void }): React.JSX.Element {
  return (
    <div className="space-y-3 pt-5 border-t border-border">
      <div className="label-eyebrow text-[10px]">Data Dokter</div>
      <FloatingInput id="spesialis" label="Spesialisasi" value={state.spesialis} onChange={(v) => update('spesialis', v)} />
      <FloatingInput id="tarif" label="Tarif Konsultasi (Rp)" type="number" value={state.tarif} onChange={(v) => update('tarif', v)} />
      <FloatingInput id="durasi" label="Durasi per Pasien (menit)" type="number" value={state.durasiMenit} onChange={(v) => update('durasiMenit', v)} />
    </div>
  );
}

function useProfileForm(profile: Profile): {
  state: FormState;
  saving: boolean;
  update: (k: keyof FormState, v: string) => void;
  handleSave: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
} {
  const [state, setState] = useState<FormState>(() => initFormState(profile));
  const [saving, setSaving] = useState(false);

  function update(key: keyof FormState, value: string): void {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSaving(true);
    try {
      await patchProfile(profile.role, state);
      toast.success('Profil berhasil disimpan');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }

  return { state, saving, update, handleSave };
}

function ProfileForm({ profile }: { profile: Profile }): React.JSX.Element {
  const { state, saving, update, handleSave } = useProfileForm(profile);

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <FloatingInput id="profile-name" label="Nama Lengkap" required value={state.name} onChange={(v) => update('name', v)} />
      <EmailField email={profile.email} />
      <FloatingInput id="profile-phone" label="No. HP (opsional)" type="tel" value={state.phone} onChange={(v) => update('phone', v)} />
      {profile.role === 'DOKTER' && <DokterFields state={state} update={update} />}
      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 h-9 px-5 bg-primary text-primary-foreground text-[13px] rounded-sm hover:bg-(--moss-hover) disabled:opacity-60 transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5" />Simpan Perubahan</>}
        </button>
      </div>
    </form>
  );
}

function LoadingState(): React.JSX.Element {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function ProfileHeader({ profile }: { profile: Profile }): React.JSX.Element {
  return (
    <div className="pb-6 mb-6 border-b border-border">
      <div className="label-eyebrow text-[10px] mb-3">Akun saya</div>
      <h1 className="font-display text-[28px] leading-tight text-foreground">{profile.name}</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">{ROLE_LABEL[profile.role] ?? profile.role} · {profile.email}</p>
    </div>
  );
}

export default function ProfilePage(): React.JSX.Element {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile().then(setProfile).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <motion.div
      className="max-w-lg px-8 py-10"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {profile && (
        <>
          <motion.div variants={fadeInUp}><ProfileHeader profile={profile} /></motion.div>
          <motion.div variants={staggerItem}><ProfileForm profile={profile} /></motion.div>
        </>
      )}
    </motion.div>
  );
}
