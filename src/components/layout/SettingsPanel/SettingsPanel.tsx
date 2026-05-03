'use client';

import { useEffect, useState } from 'react';
import { Drawer, Segmented, Select, Button, Switch, Popconfirm } from 'antd';
import { signOut } from 'next-auth/react';
import { useTheme } from '@/lib/providers/ThemeProvider';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@/i18n/config';
import { ACCENT_PRESETS } from '@/lib/theme.config';
import { resetServiceWorker } from '@/lib/reset-recovery';
import {
  enablePush,
  disablePush,
  getPushPermission,
  isPushEnabled,
  type PushPermission,
} from '@/lib/web-push-prefs';
import type {
  AccentPresetKey,
  ToneKey,
  FontKey,
  ScaleKey,
  DensityKey,
  MotionKey,
} from '@/types/theme.types';
import './SettingsPanel.css';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const {
    theme,
    setTheme,
    accent,
    setAccent,
    tone,
    setTone,
    font,
    setFont,
    scale,
    setScale,
    density,
    setDensity,
    motion,
    setMotion,
    saver,
    setSaver,
    resetPreferences,
  } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const message = useMessage();
  const [clearing, setClearing] = useState(false);
  const [resettingSw, setResettingSw] = useState(false);
  const [pushPermission, setPushPermission] =
    useState<PushPermission>('default');
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPushPermission(getPushPermission());
    setPushEnabled(isPushEnabled());
  }, [open]);

  const handleTogglePush = async (next: boolean) => {
    if (!next) {
      disablePush();
      setPushEnabled(false);
      return;
    }
    const res = await enablePush();
    setPushPermission(res.permission);
    setPushEnabled(res.ok);
    if (res.permission === 'denied') {
      message.warning(t('settings.pushDeniedHint'));
    }
  };

  const handleClearCaches = async () => {
    setClearing(true);
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.update()));
      }
      message.success(t('settings.clearCachesSuccess'));
    } finally {
      setClearing(false);
    }
  };

  const handleResetServiceWorker = async () => {
    setResettingSw(true);
    await resetServiceWorker();
  };

  const handleSignOutEverywhere = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <Drawer
      title={t('settings.title')}
      placement="right"
      open={open}
      onClose={onClose}
      width={420}
      destroyOnHidden
      className="settings-panel"
    >
      {/* Apariencia ─────────────────────────────────── */}
      <section className="settings-panel__section">
        <h3 className="settings-panel__section-title">
          {t('settings.sectionAppearance')}
        </h3>

        <div className="settings-panel__field">
          <label className="settings-panel__label">
            {t('settings.themeLabel')}
          </label>
          <Segmented
            value={theme}
            onChange={(v) => setTheme(v as 'light' | 'dark')}
            options={[
              { value: 'light', label: t('settings.themeLight') },
              { value: 'dark', label: t('settings.themeDark') },
            ]}
            block
          />
        </div>

        <div className="settings-panel__field">
          <label className="settings-panel__label">
            {t('settings.accentLabel')}
          </label>
          <div
            className="settings-panel__accents"
            role="radiogroup"
            aria-label={t('settings.accentLabel')}
          >
            {(Object.keys(ACCENT_PRESETS) as AccentPresetKey[]).map((key) => {
              const preset = ACCENT_PRESETS[key];
              const isActive = accent === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  aria-label={preset.name}
                  onClick={() => setAccent(key)}
                  className={`settings-panel__accent${isActive ? ' settings-panel__accent--active' : ''}`}
                  style={{ background: preset.swatch }}
                />
              );
            })}
          </div>
        </div>

        <div className="settings-panel__field">
          <label className="settings-panel__label">
            {t('settings.toneLabel')}
          </label>
          <Segmented
            value={tone}
            onChange={(v) => setTone(v as ToneKey)}
            options={[
              { value: 'default', label: t('settings.toneDefault') },
              { value: 'warm', label: t('settings.toneWarm') },
              { value: 'cool', label: t('settings.toneCool') },
              { value: 'contrast', label: t('settings.toneContrast') },
            ]}
            block
          />
        </div>
      </section>

      {/* Tipografía ──────────────────────────────────── */}
      <section className="settings-panel__section">
        <h3 className="settings-panel__section-title">
          {t('settings.sectionTypography')}
        </h3>

        <div className="settings-panel__field">
          <label className="settings-panel__label">
            {t('settings.fontLabel')}
          </label>
          <Select
            value={font}
            onChange={(v) => setFont(v as FontKey)}
            className="settings-panel__select"
            options={[
              { value: 'system', label: t('settings.fontSystem') },
              { value: 'serif', label: t('settings.fontSerif') },
              { value: 'mono', label: t('settings.fontMono') },
              { value: 'dyslexic', label: t('settings.fontDyslexic') },
            ]}
          />
        </div>

        <div className="settings-panel__field">
          <label className="settings-panel__label">
            {t('settings.scaleLabel')}
          </label>
          <Segmented
            value={scale}
            onChange={(v) => setScale(v as ScaleKey)}
            options={[
              { value: 'sm', label: 'A' },
              { value: 'md', label: 'A' },
              { value: 'lg', label: 'A' },
              { value: 'xl', label: 'A' },
            ]}
            block
            className="settings-panel__scale"
          />
        </div>
      </section>

      {/* Densidad ────────────────────────────────────── */}
      <section className="settings-panel__section">
        <h3 className="settings-panel__section-title">
          {t('settings.sectionDensity')}
        </h3>
        <div className="settings-panel__field">
          <Segmented
            value={density}
            onChange={(v) => setDensity(v as DensityKey)}
            options={[
              { value: 'compact', label: t('settings.densityCompact') },
              {
                value: 'comfortable',
                label: t('settings.densityComfortable'),
              },
              { value: 'spacious', label: t('settings.densitySpacious') },
            ]}
            block
          />
        </div>
      </section>

      {/* Idioma ─────────────────────────────────────── */}
      <section className="settings-panel__section">
        <h3 className="settings-panel__section-title">
          {t('settings.sectionLanguage')}
        </h3>
        <div className="settings-panel__field">
          <Select
            value={locale}
            onChange={setLocale}
            className="settings-panel__select"
            options={SUPPORTED_LOCALES.map((code) => ({
              value: code,
              label: LOCALE_LABELS[code],
            }))}
            aria-label={t('common.language')}
          />
        </div>
      </section>

      {/* Accesibilidad ──────────────────────────────── */}
      <section className="settings-panel__section">
        <h3 className="settings-panel__section-title">
          {t('settings.sectionAccessibility')}
        </h3>

        <div className="settings-panel__field">
          <label className="settings-panel__label">
            {t('settings.motionLabel')}
          </label>
          <Segmented
            value={motion}
            onChange={(v) => setMotion(v as MotionKey)}
            options={[
              { value: 'auto', label: t('settings.motionAuto') },
              { value: 'reduce', label: t('settings.motionReduce') },
            ]}
            block
          />
        </div>

        <div className="settings-panel__field settings-panel__field--inline">
          <div>
            <label className="settings-panel__label">
              {t('settings.saverLabel')}
            </label>
            <p className="settings-panel__hint">
              {t('settings.saverDescription')}
            </p>
          </div>
          <Switch
            checked={saver === 'on'}
            onChange={(v) => setSaver(v ? 'on' : 'off')}
            aria-label={t('settings.saverLabel')}
          />
        </div>
      </section>

      {/* Notificaciones ─────────────────────────────── */}
      <section className="settings-panel__section">
        <h3 className="settings-panel__section-title">
          {t('settings.sectionNotifications')}
        </h3>

        <div className="settings-panel__field settings-panel__field--inline">
          <div>
            <label className="settings-panel__label">
              {t('settings.pushLabel')}
            </label>
            <p className="settings-panel__hint">
              {pushPermission === 'unsupported'
                ? t('settings.pushUnsupported')
                : pushPermission === 'denied'
                  ? t('settings.pushDeniedHint')
                  : t('settings.pushDescription')}
            </p>
          </div>
          <Switch
            checked={pushEnabled}
            disabled={
              pushPermission === 'unsupported' || pushPermission === 'denied'
            }
            onChange={handleTogglePush}
            aria-label={t('settings.pushLabel')}
          />
        </div>
      </section>

      {/* Datos y privacidad ─────────────────────────── */}
      <section className="settings-panel__section">
        <h3 className="settings-panel__section-title">
          {t('settings.sectionDataPrivacy')}
        </h3>

        <div className="settings-panel__field">
          <Button
            block
            loading={clearing}
            onClick={handleClearCaches}
            className="settings-panel__action"
          >
            {t('settings.clearCachesButton')}
          </Button>
          <p className="settings-panel__hint">
            {t('settings.clearCachesDescription')}
          </p>
        </div>

        <div className="settings-panel__field">
          <Popconfirm
            title={t('settings.resetSwConfirm')}
            onConfirm={handleResetServiceWorker}
            okText="OK"
            cancelText={t('settings.closeButton')}
          >
            <Button
              block
              loading={resettingSw}
              className="settings-panel__action"
            >
              {t('settings.resetSwButton')}
            </Button>
          </Popconfirm>
          <p className="settings-panel__hint">
            {t('settings.resetSwDescription')}
          </p>
        </div>

        <div className="settings-panel__field">
          <Popconfirm
            title={t('settings.closeAllSessionsConfirm')}
            onConfirm={handleSignOutEverywhere}
            okText="OK"
            cancelText={t('settings.closeButton')}
          >
            <Button block danger className="settings-panel__action">
              {t('settings.closeAllSessionsButton')}
            </Button>
          </Popconfirm>
          <p className="settings-panel__hint">
            {t('settings.closeOtherSessionsDescription')}
          </p>
        </div>

        <div className="settings-panel__field">
          <Button block disabled className="settings-panel__action">
            {t('settings.deleteAccountButton')}
          </Button>
          <p className="settings-panel__hint">
            {t('settings.deleteAccountDescription')}
          </p>
        </div>
      </section>

      {/* Reset ──────────────────────────────────────── */}
      <section className="settings-panel__section settings-panel__section--reset">
        <Popconfirm
          title={t('settings.resetConfirm')}
          onConfirm={resetPreferences}
          okText="OK"
          cancelText={t('settings.closeButton')}
        >
          <Button block type="text" className="settings-panel__reset">
            {t('settings.resetButton')}
          </Button>
        </Popconfirm>
      </section>
    </Drawer>
  );
}
