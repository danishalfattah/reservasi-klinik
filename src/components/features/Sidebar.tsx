'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CalendarDays, LayoutDashboard, Stethoscope, Users, User, LogOut, Plus } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ICON = 'w-[15px] h-[15px]';

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className={ICON} strokeWidth={1.5} /> },
  { href: '/admin/doctors', label: 'Data Dokter', icon: <Stethoscope className={ICON} strokeWidth={1.5} /> },
  { href: '/admin/patients', label: 'Data Pasien', icon: <Users className={ICON} strokeWidth={1.5} /> },
];

const PASIEN_NAV: NavItem[] = [
  { href: '/pasien', label: 'Dashboard', icon: <LayoutDashboard className={ICON} strokeWidth={1.5} /> },
  { href: '/pasien/booking', label: 'Buat Reservasi', icon: <Plus className={ICON} strokeWidth={1.5} /> },
  { href: '/pasien/reservations', label: 'Reservasi Saya', icon: <CalendarDays className={ICON} strokeWidth={1.5} /> },
  { href: '/profile', label: 'Profil', icon: <User className={ICON} strokeWidth={1.5} /> },
];

const DOKTER_NAV: NavItem[] = [
  { href: '/dokter', label: 'Dashboard', icon: <LayoutDashboard className={ICON} strokeWidth={1.5} /> },
  { href: '/dokter/jadwal', label: 'Jadwal Praktik', icon: <CalendarDays className={ICON} strokeWidth={1.5} /> },
  { href: '/dokter/reservasi', label: 'Reservasi Pasien', icon: <Users className={ICON} strokeWidth={1.5} /> },
  { href: '/profile', label: 'Profil', icon: <User className={ICON} strokeWidth={1.5} /> },
];

function getNavItems(role: string): NavItem[] {
  if (role === 'ADMIN') return ADMIN_NAV;
  if (role === 'DOKTER') return DOKTER_NAV;
  return PASIEN_NAV;
}

function getRoleLabel(role: string): string {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'DOKTER') return 'Praktisi';
  return 'Pasien';
}

interface MeResponse { success: boolean; data?: { role: string } }

function NavLink({ item, active }: { item: NavItem; active: boolean }): React.JSX.Element {
  return (
    <Link
      href={item.href}
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-sm text-[13px] transition-all duration-200 ${
        active
          ? 'text-foreground font-medium'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      }`}
    >
      {active && (
        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-sm" />
      )}
      <span className={active ? 'text-accent-foreground' : 'text-(--ink-4) group-hover:text-(--ink-2)'}>
        {item.icon}
      </span>
      {item.label}
    </Link>
  );
}

async function handleLogout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
}

function SidebarBranding({ role }: { role: string }): React.JSX.Element {
  return (
    <div className="px-6 pt-7 pb-6 border-b border-border">
      <div className="font-display text-[18px] leading-none tracking-tight text-foreground">
        Reservasi <span className="font-display-italic text-primary">Klinik</span>
      </div>
      <div className="mt-2 label-eyebrow text-[10px]">{role} · Workspace</div>
    </div>
  );
}

export function Sidebar(): React.JSX.Element {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    fetch('/api/users/me').then((r) => r.json())
      .then((d: MeResponse) => { if (d.success && d.data) setUserRole(d.data.role); });
  }, []);

  const navItems = getNavItems(userRole);
  const role = getRoleLabel(userRole);

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-background border-r border-border min-h-screen">
      <SidebarBranding role={role} />

      <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5">
        <div className="label-eyebrow px-3 pb-2 text-[10px]">Navigasi</div>
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href} />
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="group flex items-center gap-3 px-3 py-2 w-full rounded-sm text-[13px] text-muted-foreground hover:bg-(--terracotta-soft) hover:text-(--terracotta-ink) transition-colors"
        >
          <LogOut className={ICON} strokeWidth={1.5} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
