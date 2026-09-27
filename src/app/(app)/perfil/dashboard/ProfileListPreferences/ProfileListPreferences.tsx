'use client';

import {
  useCallback,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { Select } from 'antd';
import { ListCountContext } from '@/components/design-system/AutoFitList/ListCountContext';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './ProfileListPreferences.css';

const COUNTS = [3, 5, 10];
const subscribe = (notify: () => void) => {
  window.addEventListener('storage', notify);
  return () => window.removeEventListener('storage', notify);
};

export function ProfileListPreferences({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const { t } = useLocale();
  const [override, setOverride] = useState<number | null>(null);
  const storageKey = `mb-profile-list-count:${userId}`;
  const readCount = useCallback(() => {
    try {
      const stored = Number(localStorage.getItem(storageKey));
      return COUNTS.includes(stored) ? stored : 5;
    } catch {
      return 5;
    }
  }, [storageKey]);
  const storedCount = useSyncExternalStore(subscribe, readCount, () => 5);
  const count = override ?? storedCount;

  return (
    <ListCountContext.Provider value={count}>
      <div className="mb-profile-list-preferences">
        <label htmlFor="profile-list-count">
          {t('profileDashboard.listCount')}
        </label>
        <Select
          id="profile-list-count"
          value={count}
          options={COUNTS.map((value) => ({ value, label: String(value) }))}
          onChange={(value) => {
            setOverride(value);
            try {
              localStorage.setItem(storageKey, String(value));
            } catch {
              /* Usable even when browser storage is unavailable. */
            }
          }}
        />
        <span>{t('profileDashboard.listCountHint')}</span>
      </div>
      {children}
    </ListCountContext.Provider>
  );
}
