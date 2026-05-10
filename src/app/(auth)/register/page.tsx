'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AuthLayout } from '@/components/features/AuthLayout';
import { FloatingInput } from '@/components/features/FloatingInput';

async function doRegister(name: string, email: string, phone: string, password: string): Promise<void> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone: phone || undefined, role: 'PASIEN' }),
  });
  const json = (await res.json()) as { success: boolean; error?: { message: string } };
  if (!json.success) throw new Error(json.error?.message ?? 'Registrasi gagal');
}

function useRegisterForm(push: (path: string) => void): {
  name: string; email: string; phone: string; password: string; loading: boolean;
  setName: (v: string) => void; setEmail: (v: string) => void;
  setPhone: (v: string) => void; setPassword: (v: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
} {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);
    try {
      await doRegister(name, email, phone, password);
      toast.success('Akun berhasil dibuat');
      push('/pasien');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return { name, email, phone, password, loading, setName, setEmail, setPhone, setPassword, handleSubmit };
}

function RegisterForm({ onSubmit, loading, name, email, phone, password, setName, setEmail, setPhone, setPassword }: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  loading: boolean; name: string; email: string; phone: string; password: string;
  setName: (v: string) => void; setEmail: (v: string) => void;
  setPhone: (v: string) => void; setPassword: (v: string) => void;
}): React.JSX.Element {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <FloatingInput id="name" label="Nama Lengkap" required value={name} onChange={setName} />
      <FloatingInput id="reg-email" label="Email" type="email" required value={email} onChange={setEmail} />
      <FloatingInput id="phone" label="No. HP (opsional)" type="tel" value={phone} onChange={setPhone} />
      <FloatingInput id="password" label="Password" type="password" required value={password} onChange={setPassword} />
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground text-[13px] rounded-sm hover:bg-(--moss-hover) disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat Akun Pasien'}
        </button>
      </div>
    </form>
  );
}

function RegisterHeading(): React.JSX.Element {
  return (
    <div className="mb-8">
      <div className="label-eyebrow text-[10px] mb-3">Daftar akun baru</div>
      <h1 className="font-display text-[30px] leading-tight text-foreground">
        Mulai perjalanan <span className="font-display-italic text-primary">sehat Anda.</span>
      </h1>
    </div>
  );
}

export default function RegisterPage(): React.JSX.Element {
  const router = useRouter();
  const form = useRegisterForm(router.push);

  return (
    <AuthLayout>
      <RegisterHeading />
      <RegisterForm
        onSubmit={form.handleSubmit}
        loading={form.loading}
        name={form.name}
        email={form.email}
        phone={form.phone}
        password={form.password}
        setName={form.setName}
        setEmail={form.setEmail}
        setPhone={form.setPhone}
        setPassword={form.setPassword}
      />
      <p className="mt-6 text-[13px] text-muted-foreground">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-primary hover:text-(--moss-hover) transition-colors">
          Masuk di sini
        </Link>
      </p>
    </AuthLayout>
  );
}
