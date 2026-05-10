'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AuthLayout } from '@/components/features/AuthLayout';
import { FloatingInput } from '@/components/features/FloatingInput';

const ROLE_REDIRECT: Record<string, string> = { PASIEN: '/pasien', ADMIN: '/admin', DOKTER: '/dokter' };

async function doLogin(email: string, password: string): Promise<string> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = (await res.json()) as { success: boolean; data?: { user: { role: string } }; error?: { message: string } };
  if (!json.success || !json.data) throw new Error(json.error?.message ?? 'Login gagal');
  return ROLE_REDIRECT[json.data.user.role] ?? '/';
}

function useLoginForm(push: (path: string) => void): {
  email: string; password: string; loading: boolean;
  setEmail: (v: string) => void; setPassword: (v: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
} {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);
    try {
      const destination = await doLogin(email, password);
      toast.success('Berhasil masuk');
      push(destination);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return { email, password, loading, setEmail, setPassword, handleSubmit };
}

function LoginForm({ onSubmit, loading, email, password, setEmail, setPassword }: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  loading: boolean; email: string; password: string;
  setEmail: (v: string) => void; setPassword: (v: string) => void;
}): React.JSX.Element {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <FloatingInput id="email" label="Email" type="email" required value={email} onChange={setEmail} />
      <FloatingInput id="password" label="Password" type="password" required value={password} onChange={setPassword} />
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground text-[13px] rounded-sm hover:bg-(--moss-hover) disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Masuk'}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const { email, password, loading, setEmail, setPassword, handleSubmit } = useLoginForm(router.push);

  return (
    <AuthLayout>
      <div className="mb-8">
        <div className="label-eyebrow text-[10px] mb-3">Masuk ke akun</div>
        <h1 className="font-display text-[30px] leading-tight text-foreground">
          Selamat datang <span className="font-display-italic text-primary">kembali.</span>
        </h1>
      </div>
      <LoginForm
        onSubmit={handleSubmit}
        loading={loading}
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
      />
      <p className="mt-6 text-[13px] text-muted-foreground">
        Belum punya akun?{' '}
        <Link href="/register" className="text-primary hover:text-(--moss-hover) transition-colors">
          Daftar sekarang
        </Link>
      </p>
    </AuthLayout>
  );
}
