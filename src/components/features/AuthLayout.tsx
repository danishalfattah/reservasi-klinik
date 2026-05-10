'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/motion';

function AuthPanel(): React.JSX.Element {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-(--paper-2) border-r border-border px-12 py-14 w-105 shrink-0">
      <Link href="/" className="font-display text-[18px] leading-none tracking-tight text-foreground">
        Reservasi <span className="font-display-italic text-primary">Klinik</span>
      </Link>

      <div>
        <div className="label-eyebrow text-[10px] mb-5">Mengapa pasien memilih kami</div>
        <blockquote className="font-display text-[28px] leading-snug text-foreground max-w-xs">
          Reservasi yang tenang, terpercaya,{' '}
          <span className="font-display-italic text-primary">manusiawi.</span>
        </blockquote>
        <div className="mt-8 flex flex-col gap-4">
          {['Pilih dokter spesialis dengan mudah', 'Jadwal transparan, tanpa kejutan', 'Konfirmasi instan setelah pembayaran'].map((t) => (
            <div key={t} className="flex items-start gap-3">
              <span className="mt-1 w-1 h-1 rounded-full bg-primary shrink-0" />
              <span className="text-[13px] text-muted-foreground leading-snug">{t}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="label-eyebrow text-[10px]">© {new Date().getFullYear()} Reservasi Klinik</p>
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <main className="flex min-h-screen bg-background">
      <AuthPanel />
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="w-full max-w-95"
        >
          {children}
        </motion.div>
      </div>
    </main>
  );
}
