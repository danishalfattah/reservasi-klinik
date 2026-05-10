'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Doctor } from '@/app/(dashboard)/admin/doctors/page';

async function fetchDoctors(): Promise<Doctor[]> {
  const res = await fetch('/api/admin/doctors');
  const json = (await res.json()) as { success: boolean; data?: Doctor[] };
  return json.success && json.data ? json.data : [];
}

function loadDoctors(
  setDoctors: (d: Doctor[]) => void,
  setLoading: (v: boolean) => void
): void {
  setLoading(true);
  fetchDoctors()
    .then((data) => { setDoctors(data); })
    .finally(() => { setLoading(false); });
}

export function useDoctors(): { doctors: Doctor[]; loading: boolean; reload: () => void } {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => { loadDoctors(setDoctors, setLoading); }, []);

  useEffect(() => { loadDoctors(setDoctors, setLoading); }, []);

  return { doctors, loading, reload };
}
