'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Schedule } from '@/app/(dashboard)/admin/doctors/[id]/schedules/page';

async function fetchSchedules(doctorId: string): Promise<Schedule[]> {
  const res = await fetch(`/api/admin/doctors/${doctorId}/schedules`);
  const json = (await res.json()) as { success: boolean; data?: Schedule[] };
  return json.success && json.data ? json.data : [];
}

function loadSchedules(
  doctorId: string,
  setSchedules: (s: Schedule[]) => void,
  setLoading: (v: boolean) => void
): void {
  setLoading(true);
  fetchSchedules(doctorId)
    .then((data) => { setSchedules(data); })
    .finally(() => { setLoading(false); });
}

export function useSchedules(doctorId: string): { schedules: Schedule[]; loading: boolean; reload: () => void } {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => { loadSchedules(doctorId, setSchedules, setLoading); }, [doctorId]);

  useEffect(() => { loadSchedules(doctorId, setSchedules, setLoading); }, [doctorId]);

  return { schedules, loading, reload };
}
