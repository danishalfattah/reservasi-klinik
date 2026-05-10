import { type ReactNode } from 'react';
import { Sidebar } from '@/components/features/Sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
