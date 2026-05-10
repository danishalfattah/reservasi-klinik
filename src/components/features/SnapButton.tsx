'use client';

import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks: {
        onSuccess?: () => void;
        onPending?: () => void;
        onError?: () => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

interface SnapButtonProps {
  snapToken: string;
  reservationId: string;
  orderId: string;
  disabled?: boolean;
}

const snapScriptUrl =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';

function clientKey(): string {
  return process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '';
}

function isDisabled(args: { disabled: boolean; ready: boolean; paying: boolean; snapToken: string }): boolean {
  return args.disabled || !args.ready || args.paying || args.snapToken.length === 0;
}

async function verifyPayment(orderId: string): Promise<void> {
  await fetch('/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
}

function useSnap(snapToken: string, reservationId: string, orderId: string): { ready: boolean; paying: boolean; openSnap: () => void; markReady: () => void } {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);

  function backToDetail(): void { router.replace(`/pasien/reservations/${reservationId}`); }

  async function handleSuccess(): Promise<void> {
    await verifyPayment(orderId);
    backToDetail();
  }

  function openSnap(): void {
    if (!window.snap) return;
    setPaying(true);
    window.snap.pay(snapToken, {
      onSuccess: () => { void handleSuccess(); },
      onPending: backToDetail,
      onError: backToDetail,
      onClose: () => setPaying(false),
    });
  }

  return { ready, paying, openSnap, markReady: () => setReady(true) };
}

export function SnapButton({ snapToken, reservationId, orderId, disabled = false }: SnapButtonProps): React.JSX.Element {
  const { ready, paying, openSnap, markReady } = useSnap(snapToken, reservationId, orderId);
  const loading = paying || !ready;

  return (
    <>
      <Script src={snapScriptUrl} data-client-key={clientKey()} strategy="afterInteractive" onReady={markReady} onLoad={markReady} />
      <button
        type="button"
        onClick={openSnap}
        disabled={isDisabled({ disabled, ready, paying, snapToken })}
        className="w-full flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground text-[13px] rounded-sm hover:bg-(--moss-hover) disabled:opacity-60 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" strokeWidth={1.5} />}
        {ready ? 'Bayar Sekarang' : 'Menyiapkan Pembayaran...'}
      </button>
    </>
  );
}
