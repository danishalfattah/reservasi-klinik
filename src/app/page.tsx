'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Stethoscope, CheckCircle } from 'lucide-react';
import { fadeInUp, staggerContainer, staggerItem, easeOutQuart } from '@/lib/motion';

function Nav(): React.JSX.Element {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="font-display text-[17px] leading-none tracking-tight text-foreground">
          Reservasi <span className="font-display-italic text-primary">Klinik</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-[13px] text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-sm transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="text-[13px] bg-primary text-primary-foreground px-4 py-1.5 rounded-sm hover:bg-(--moss-hover) transition-colors"
          >
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroEyebrow(): React.JSX.Element {
  return (
    <div className="label-eyebrow text-[10px] text-primary mb-5 flex items-center gap-2">
      <span className="w-4 h-px bg-primary inline-block" />
      Sistem Reservasi Klinik
    </div>
  );
}

function HeroCta(): React.JSX.Element {
  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-4">
      <Link
        href="/register"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-[14px] rounded-sm hover:bg-(--moss-hover) transition-colors group"
      >
        Buat Akun Pasien
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
      <Link
        href="/login"
        className="inline-flex items-center gap-2 px-6 py-3 border border-border text-[14px] text-foreground rounded-sm hover:bg-secondary transition-colors"
      >
        Masuk ke Akun
      </Link>
    </div>
  );
}

function HeroContent(): React.JSX.Element {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      <motion.div variants={fadeInUp}>
        <HeroEyebrow />
      </motion.div>
      <motion.h1
        variants={fadeInUp}
        className="font-display text-[54px] md:text-[72px] leading-[1.05] tracking-tight text-foreground max-w-2xl"
      >
        Perawatan yang{' '}
        <span className="font-display-italic text-primary">lebih mudah,</span>
        <br />lebih manusiawi.
      </motion.h1>
      <motion.p
        variants={fadeInUp}
        className="mt-6 text-[16px] leading-relaxed text-muted-foreground max-w-xl"
      >
        Pilih dokter, tentukan jadwal, dan konfirmasi reservasi — semuanya dalam
        satu alur yang tenang. Tanpa antrean fisik, tanpa ketidakpastian.
      </motion.p>
      <motion.div variants={fadeInUp}>
        <HeroCta />
      </motion.div>
    </motion.div>
  );
}

function Hero(): React.JSX.Element {
  return (
    <section className="pt-36 pb-28 px-6 max-w-5xl mx-auto">
      <HeroContent />
      <motion.div
        className="mt-20 h-px bg-border"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.9, delay: 0.6, ease: easeOutQuart }}
      />
    </section>
  );
}

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Jadwal Fleksibel',
    desc: 'Lihat ketersediaan dokter secara real-time dan pilih slot waktu yang paling sesuai dengan rutinitas Anda.',
  },
  {
    icon: Stethoscope,
    title: 'Dokter Terpercaya',
    desc: 'Semua dokter terverifikasi dengan profil lengkap — spesialisasi, tarif konsultasi, dan durasi sesi.',
  },
  {
    icon: CheckCircle,
    title: 'Konfirmasi Instan',
    desc: 'Reservasi dikonfirmasi seketika. Ubah atau batalkan kapan saja, selama masih dalam batas waktu yang wajar.',
  },
];

function FeatureCard({ icon: Icon, title, desc }: typeof FEATURES[number]): React.JSX.Element {
  return (
    <motion.div
      variants={staggerItem}
      className="group p-6 border border-border rounded-lg bg-card hover:border-(--line-2) transition-colors"
    >
      <div className="w-9 h-9 rounded-sm bg-(--moss-soft) flex items-center justify-center mb-5">
        <Icon className="w-[17px] h-[17px] text-(--moss-ink)" strokeWidth={1.5} />
      </div>
      <h3 className="text-[15px] font-medium text-foreground mb-2">{title}</h3>
      <p className="text-[13px] leading-relaxed text-muted-foreground">{desc}</p>
    </motion.div>
  );
}

function Features(): React.JSX.Element {
  return (
    <section className="px-6 pb-28 max-w-5xl mx-auto">
      <motion.div
        className="mb-10"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        <div className="label-eyebrow text-[10px] mb-3">Keunggulan Platform</div>
        <h2 className="font-display text-[32px] leading-tight text-foreground max-w-sm">
          Dirancang untuk pengalaman pasien yang lebih baik.
        </h2>
      </motion.div>

      <motion.div
        className="grid md:grid-cols-3 gap-4"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        {FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
      </motion.div>
    </section>
  );
}

const STEPS = [
  { num: '01', title: 'Pilih Dokter', desc: 'Telusuri daftar dokter dan temukan spesialis yang tepat.' },
  { num: '02', title: 'Pilih Jadwal', desc: 'Tentukan hari dan jam yang paling nyaman untuk Anda.' },
  { num: '03', title: 'Konfirmasi', desc: 'Selesaikan pembayaran dan reservasi langsung terkonfirmasi.' },
];

function StepList(): React.JSX.Element {
  return (
    <motion.div
      className="grid md:grid-cols-3 gap-8"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {STEPS.map((s) => (
        <motion.div key={s.num} variants={staggerItem}>
          <div className="font-mono-tnum text-[11px] text-primary mb-3 tracking-widest">{s.num}</div>
          <h3 className="text-[15px] font-medium text-foreground mb-1.5">{s.title}</h3>
          <p className="text-[13px] leading-relaxed text-muted-foreground">{s.desc}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}

function HowHeader(): React.JSX.Element {
  return (
    <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
      <div className="label-eyebrow text-[10px] mb-3">Cara Kerja</div>
      <h2 className="font-display text-[32px] leading-tight text-foreground">Tiga langkah. Selesai.</h2>
    </motion.div>
  );
}

function HowCta(): React.JSX.Element {
  return (
    <motion.div className="mt-10 pt-8 border-t border-border" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
      <Link href="/register" className="inline-flex items-center gap-2 text-[13px] text-primary hover:text-(--moss-hover) transition-colors group">
        Mulai sekarang — gratis
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </motion.div>
  );
}

function HowItWorks(): React.JSX.Element {
  return (
    <section className="px-6 pb-32 max-w-5xl mx-auto">
      <div className="border border-border rounded-lg p-8 md:p-12 bg-card">
        <HowHeader />
        <StepList />
        <HowCta />
      </div>
    </section>
  );
}

function Footer(): React.JSX.Element {
  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="font-display text-[15px] leading-none tracking-tight text-foreground">
          Reservasi <span className="font-display-italic text-primary">Klinik</span>
        </div>
        <p className="text-[12px] text-muted-foreground label-eyebrow">
          © {new Date().getFullYear()} Reservasi Klinik
        </p>
      </div>
    </footer>
  );
}

export default function HomePage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Footer />
    </div>
  );
}
