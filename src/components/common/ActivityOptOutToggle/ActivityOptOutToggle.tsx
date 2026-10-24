'use client';

import { useSyncExternalStore } from 'react';
import { Switch } from 'antd';
import { useLocale } from '@/lib/providers/LocaleProvider';
import {
  browserPrivacySignal,
  setActivityOptOut,
  storedActivityOptOut,
} from '@/lib/activity-beacon';
import './ActivityOptOutToggle.css';

type OptOutState = 'counted' | 'optedOut' | 'browserSignal';

function readState(): OptOutState {
  if (browserPrivacySignal()) return 'browserSignal';
  return storedActivityOptOut() ? 'optedOut' : 'counted';
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

/** Para dejar de sumar a los contadores anonimos desde este navegador. */
export function ActivityOptOutToggle() {
  const { t } = useLocale();
  const state = useSyncExternalStore(subscribe, readState, () => null);

  if (state === null) return null;

  return (
    <div className="activity-opt-out">
      <Switch
        checked={state === 'counted'}
        disabled={state === 'browserSignal'}
        onChange={(counted) => {
          setActivityOptOut(!counted);
          window.dispatchEvent(new StorageEvent('storage'));
        }}
        aria-describedby="activity-opt-out-hint"
      />
      <div>
        <p className="activity-opt-out__label">
          {t('activityPrivacy.toggleLabel')}
        </p>
        <p id="activity-opt-out-hint" className="activity-opt-out__hint">
          {state === 'browserSignal'
            ? t('activityPrivacy.browserSignal')
            : state === 'counted'
              ? t('activityPrivacy.countedHint')
              : t('activityPrivacy.notCountedHint')}
        </p>
      </div>
    </div>
  );
}
