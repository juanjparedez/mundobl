'use client';

import { useState } from 'react';
import { Button, Popconfirm, Tag } from 'antd';
import {
  SettingOutlined,
  ClearOutlined,
  ReloadOutlined,
  LogoutOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { signOut } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import { resetServiceWorker, clearAllCaches } from '@/lib/reset-recovery';
import { SettingsPanel } from '@/components/layout/SettingsPanel/SettingsPanel';
import './ProfileSettings.css';

export function ProfileSettings() {
  const { t } = useLocale();
  const message = useMessage();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const handleClearCache = async () => {
    setBusy('cache');
    await clearAllCaches();
    message.success(t('settings.clearCachesSuccess'));
    setBusy(null);
  };

  const handleResetSw = async () => {
    setBusy('sw');
    await resetServiceWorker();
  };

  const handleSignOutAll = async () => {
    setBusy('signout');
    await signOut({ callbackUrl: '/' });
  };

  return (
    <>
      <section className="profile-section profile-settings-section">
        <div className="profile-section__header">
          <SettingOutlined className="profile-section__header-icon" />
          {t('profile.sectionSettings')}
        </div>

        <div className="profile-settings-grid">
          <article className="profile-settings-card">
            <header className="profile-settings-card__header">
              <h3 className="profile-settings-card__title">
                {t('profile.settingsAppearanceTitle')}
              </h3>
              <p className="profile-settings-card__hint">
                {t('profile.settingsAppearanceHint')}
              </p>
            </header>
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => setSettingsOpen(true)}
            >
              {t('profile.settingsAppearanceOpen')}
            </Button>
          </article>

          <article className="profile-settings-card">
            <header className="profile-settings-card__header">
              <h3 className="profile-settings-card__title">
                {t('profile.settingsSessionTitle')}
              </h3>
              <p className="profile-settings-card__hint">
                {t('profile.settingsSessionHint')}
              </p>
            </header>
            <div className="profile-settings-card__actions">
              <Button
                icon={<ClearOutlined />}
                loading={busy === 'cache'}
                onClick={handleClearCache}
              >
                {t('settings.clearCachesButton')}
              </Button>
              <Popconfirm
                title={t('settings.resetSwConfirm')}
                onConfirm={handleResetSw}
                okText="OK"
                cancelText={t('settings.closeButton')}
              >
                <Button icon={<ReloadOutlined />} loading={busy === 'sw'}>
                  {t('settings.resetSwButton')}
                </Button>
              </Popconfirm>
              <Popconfirm
                title={t('settings.closeAllSessionsConfirm')}
                onConfirm={handleSignOutAll}
                okText="OK"
                cancelText={t('settings.closeButton')}
              >
                <Button
                  danger
                  icon={<LogoutOutlined />}
                  loading={busy === 'signout'}
                >
                  {t('settings.closeAllSessionsButton')}
                </Button>
              </Popconfirm>
            </div>
          </article>

          <article className="profile-settings-card profile-settings-card--danger">
            <header className="profile-settings-card__header">
              <h3 className="profile-settings-card__title">
                {t('profile.settingsDangerTitle')}{' '}
                <Tag color="default">{t('profile.settingsComingSoon')}</Tag>
              </h3>
              <p className="profile-settings-card__hint">
                {t('profile.settingsDangerHint')}
              </p>
            </header>
            <div className="profile-settings-card__actions">
              <Button icon={<DownloadOutlined />} disabled>
                {t('profile.settingsExportData')}
              </Button>
              <Button danger icon={<DeleteOutlined />} disabled>
                {t('settings.deleteAccountButton')}
              </Button>
            </div>
          </article>
        </div>
      </section>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
