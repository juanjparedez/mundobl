'use client';

import {
  createContext,
  useCallback,
  useContext,
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

interface ListCountControl {
  count: number;
  setCount: (value: number) => void;
}

const ListCountControlContext = createContext<ListCountControl | null>(null);

/** Selector "cuantos items por lista". Tiene que vivir dentro de un
 *  ProfileListPreferences (el perfil lo muestra en la pestaña Ajustes). */
export function ProfileListCountControl() {
  const { t } = useLocale();
  const control = useContext(ListCountControlContext);
  if (!control) return null;
  return (
    <div className="mb-profile-list-preferences">
      <label htmlFor="profile-list-count">
        {t('profileDashboard.listCount')}
      </label>
      <Select
        id="profile-list-count"
        value={control.count}
        options={COUNTS.map((value) => ({ value, label: String(value) }))}
        onChange={control.setCount}
      />
      <span>{t('profileDashboard.listCountHint')}</span>
    </div>
  );
}

export function ProfileListPreferences({
  userId,
  children,
  showControl = true,
}: {
  userId: string;
  children: ReactNode;
  /** false: no dibuja el selector aca (se ubica con ProfileListCountControl). */
  showControl?: boolean;
}) {
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

  const setCount = (value: number) => {
    setOverride(value);
    try {
      localStorage.setItem(storageKey, String(value));
    } catch {
      /* Usable even when browser storage is unavailable. */
    }
  };

  return (
    <ListCountContext.Provider value={count}>
      <ListCountControlContext.Provider value={{ count, setCount }}>
        {showControl && <ProfileListCountControl />}
        {children}
      </ListCountControlContext.Provider>
    </ListCountContext.Provider>
  );
}
