import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { listWeeks } from '@/packages/services';

type WeekContextValue = {
  weeks: number[];
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  loadingWeeks: boolean;
};

const WeekContext = createContext<WeekContextValue | null>(null);

export function WeekProvider({ children }: { children: React.ReactNode }) {
  const [weeks, setWeeks] = useState<number[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [loadingWeeks, setLoadingWeeks] = useState(true);

  useEffect(() => {
    listWeeks()
      .then((rows) => {
        const unique = Array.from(new Set(rows)).sort((a, b) => a - b);
        setWeeks(unique);
        if (unique.length > 0) {
          setSelectedWeek((prev) => (unique.includes(prev) ? prev : unique[0]));
        }
      })
      .finally(() => setLoadingWeeks(false));
  }, []);

  const value = useMemo(
    () => ({ weeks, selectedWeek, setSelectedWeek, loadingWeeks }),
    [weeks, selectedWeek, loadingWeeks]
  );

  return <WeekContext.Provider value={value}>{children}</WeekContext.Provider>;
}

export function useSelectedWeek() {
  const ctx = useContext(WeekContext);
  if (!ctx) {
    throw new Error('useSelectedWeek must be used within WeekProvider');
  }
  return ctx;
}
