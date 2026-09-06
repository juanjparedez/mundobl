'use client';

import { useState } from 'react';
import {
  ColorPicker,
  Drawer,
  Segmented,
  Select,
  Button,
  Switch,
  Popconfirm,
} from 'antd';
import {
  DownOutlined,
  UpOutlined,
  CheckCircleFilled,
  SettingOutlined,
} from '@ant-design/icons';
import type { Color } from 'antd/es/color-picker';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/providers/ThemeProvider';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useSpoilerFree } from '@/lib/providers/SpoilerFreeProvider';
import { useMessage } from '@/hooks/useMessage';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@/i18n/config';
import { ACCENT_PRESETS } from '@/lib/theme.config';
import { resetServiceWorker } from '@/lib/reset-recovery';
import { NotificationsSettings } from '../NotificationsSettings/NotificationsSettings';
import { VIEW_PRESETS, type ViewPresetKey } from '@/types/presets.types';
import type {
  AccentPresetKey,
  ToneKey,
  FontKey,
  ScaleKey,
  DensityKey,
  MotionKey,
  SkinKey,
} from '@/types/theme.types';
import './SettingsPanel.css';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

interface SkinOption {
  key: SkinKey;
  name: string;
  tag: string;
  desc: string;
  colors: [string, string, string];
  isDark: boolean;
}

const SKIN_OPTIONS: SkinOption[] = [
  {
    key: 'premium',
    name: 'Dark Obsidian',
    tag: '👑 Premium',
    desc: 'Negro elegante con acento dorado',
    colors: ['#0c0a14', '#171423', '#f6b51e'],
    isDark: true,
  },
  {
    key: 'sakura',
    name: 'Sakura & Pastel',
    tag: '🌸 Romance',
    desc: 'Marfil suave y rosa flor de cerezo',
    colors: ['#faf6f8', '#ffffff', '#d85b98'],
    isDark: false,
  },
  {
    key: 'midnight',
    name: 'Midnight AMOLED',
    tag: '🖤 Pure OLED',
    desc: 'Negro 100% puro y cian tenue',
    colors: ['#000000', '#0a0a10', '#00e5ff'],
    isDark: true,
  },
  {
    key: 'journal',
    name: 'Retro Journal',
    tag: '📖 Editorial',
    desc: 'Papel cálido, terracota y notas',
    colors: ['#f5f0e6', '#fdfaf3', '#b45309'],
    isDark: false,
  },
  {
    key: 'neon',
    name: 'Neon Bangkok',
    tag: '🏙️ Cyber Glow',
    desc: 'Azul nocturno profundo y fucsia',
    colors: ['#070714', '#131330', '#e026b4'],
    isDark: true,
  },
  {
    key: 'default',
    name: 'MundoBL Base',
    tag: '✨ Estándar',
    desc: 'Paleta balanceada configurable',
    colors: ['#121218', '#201c29', '#c57bb7'],
    isDark: true,
  },
];

const PRESET_KEYS: ViewPresetKey[] = [
  'cinema',
  'tracker',
  'encyclopedia',
  'blind',
];

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const router = useRouter();
  const {
    theme,
    setTheme,
    preset,
    setPreset,
    accent,
    setAccent,
    customAccent,
    setCustomAccent,
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
    skin,
    setSkin,
    resetPreferences,
  } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const { enabled: spoilerFree, setEnabled: setSpoilerFree } = useSpoilerFree();
  const message = useMessage();
  const [clearing, setClearing] = useState(false);
  const [resettingSw, setResettingSw] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [defaultCommentPrivate, setDefaultCommentPrivate] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('comment-default-private') === 'true';
  });

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
      styles={{ wrapper: { width: 440 } }}
      destroyOnHidden
      className="settings-panel"
    >
      {/* ── 1. Presets de Visualización (Modo de Consumo) ── */}
      <section className="settings-panel__section">
        <h3 className="settings-panel__section-title">
          Modo de Experiencia (Presets)
        </h3>
        <p className="settings-panel__hint">
          Elegí cómo querés consumir el catálogo con un solo clic:
        </p>
        <div className="settings-panel__presets-grid">
          {PRESET_KEYS.map((key) => {
            const config = VIEW_PRESETS[key];
            const isActive = preset === key;
            return (
              <button
                key={key}
                type="button"
                className={`settings-panel__preset-card ${
                  isActive ? 'settings-panel__preset-card--active' : ''
                }`}
                onClick={() => setPreset(key)}
              >
                <div className="settings-panel__preset-header">
                  <span>{config.emoji}</span>
                  <span>{config.nameFallback.split(' ')[0]}</span>
                  {isActive && (
                    <CheckCircleFilled
                      style={{
                        marginLeft: 'auto',
                        color: 'var(--primary-color)',
                      }}
                    />
                  )}
                </div>
                <div className="settings-panel__preset-desc">
                  {config.taglineFallback}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 2. Skins Atmosféricas Reales ── */}
      <section className="settings-panel__section">
        <h3 className="settings-panel__section-title">
          Atmósfera Visual (Skins)
        </h3>
        <p className="settings-panel__hint">
          Temas completos con carácter, paleta y vibras únicas:
        </p>
        <div className="settings-panel__skins-grid">
          {SKIN_OPTIONS.map((opt) => {
            const isActive = skin === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                className={`settings-panel__skin-card ${
                  isActive ? 'settings-panel__skin-card--active' : ''
                }`}
                onClick={() => setSkin(opt.key)}
              >
                <div className="settings-panel__skin-header">
                  <span className="settings-panel__skin-title">{opt.name}</span>
                  <div className="settings-panel__skin-swatches">
                    {opt.colors.map((c, i) => (
                      <span
                        key={i}
                        className="settings-panel__skin-swatch"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="settings-panel__skin-desc">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 3. Ajustes Avanzados de Afinación (Colapsable) ── */}
      <section className="settings-panel__section">
        <button
          type="button"
          className="settings-panel__advanced-toggle"
          onClick={() => setAdvancedOpen(!advancedOpen)}
        >
          <span>
            <SettingOutlined style={{ marginRight: 6 }} /> Ajustes Avanzados de
            Afinación
          </span>
          {advancedOpen ? <UpOutlined /> : <DownOutlined />}
        </button>

        {advancedOpen && (
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Modo Claro / Oscuro manual */}
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

            {/* Color de acento */}
            <div className="settings-panel__field">
              <label className="settings-panel__label">
                {t('settings.accentLabel')}
              </label>
              <div className="settings-panel__accent-row">
                <div
                  className="settings-panel__accents"
                  role="radiogroup"
                  aria-label={t('settings.accentLabel')}
                >
                  {(Object.keys(ACCENT_PRESETS) as AccentPresetKey[]).map(
                    (key) => {
                      const p = ACCENT_PRESETS[key];
                      const isActive = !customAccent && accent === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="radio"
                          aria-checked={isActive}
                          aria-label={p.name}
                          onClick={() => setAccent(key)}
                          className={`settings-panel__accent${
                            isActive ? ' settings-panel__accent--active' : ''
                          }`}
                          style={{ background: p.swatch }}
                        />
                      );
                    }
                  )}
                </div>
                <ColorPicker
                  value={customAccent ?? ACCENT_PRESETS[accent].swatch}
                  onChange={(c: Color) => setCustomAccent(c.toHexString())}
                  size="small"
                  showText={false}
                  format="hex"
                  className={`settings-panel__color-picker${
                    customAccent ? ' settings-panel__color-picker--active' : ''
                  }`}
                />
              </div>
            </div>

            {/* Tono de contraste */}
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

            {/* Tipografía */}
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

            {/* Escala tipográfica */}
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

            {/* Densidad */}
            <div className="settings-panel__field">
              <label className="settings-panel__label">
                {t('settings.sectionDensity')}
              </label>
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

            {/* Accesibilidad (Motion & Data Saver) */}
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
          </div>
        )}
      </section>

      {/* ── 4. Idioma ── */}
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

      {/* ── 5. Notificaciones ── */}
      <section className="settings-panel__section">
        <h3 className="settings-panel__section-title">
          {t('settings.sectionNotifications')}
        </h3>

        <div className="settings-panel__field">
          <Button
            block
            onClick={() => {
              onClose();
              router.push('/notificaciones');
            }}
            className="settings-panel__action"
          >
            {t('settings.openNotificationsCenterButton')}
          </Button>
          <p className="settings-panel__hint">
            {t('settings.openNotificationsCenterHint')}
          </p>
        </div>

        <NotificationsSettings />
      </section>

      {/* ── 6. Preferencias Comunitarias & Spoilers ── */}
      <section className="settings-panel__section">
        <h3 className="settings-panel__section-title">
          {t('settings.sectionPreferences')}
        </h3>

        <div className="settings-panel__field settings-panel__field--inline">
          <div>
            <label className="settings-panel__label">
              {t('settings.defaultCommentPrivateLabel')}
            </label>
            <p className="settings-panel__hint">
              {t('settings.defaultCommentPrivateHint')}
            </p>
          </div>
          <Switch
            checked={defaultCommentPrivate}
            onChange={(v) => {
              setDefaultCommentPrivate(v);
              if (typeof window !== 'undefined') {
                window.localStorage.setItem(
                  'comment-default-private',
                  String(v)
                );
              }
            }}
          />
        </div>

        <div className="settings-panel__field settings-panel__field--inline">
          <div>
            <label className="settings-panel__label">
              {t('settings.spoilerFreeLabel')}
            </label>
            <p className="settings-panel__hint">
              {t('settings.spoilerFreeHint')}
            </p>
          </div>
          <Switch
            checked={spoilerFree}
            onChange={setSpoilerFree}
            aria-label={t('settings.spoilerFreeLabel')}
          />
        </div>
      </section>

      {/* ── 7. Datos y Privacidad ── */}
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

      {/* ── 8. Reset ── */}
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
