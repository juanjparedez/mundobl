'use client';

import { useState } from 'react';
import { Button, Input, Modal, Popconfirm, Radio, Tag } from 'antd';
import {
  SettingOutlined,
  ClearOutlined,
  ReloadOutlined,
  LogoutOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import { resetServiceWorker, clearAllCaches } from '@/lib/reset-recovery';
import { SettingsPanel } from '@/components/layout/SettingsPanel/SettingsPanel';
import './ProfileSettings.css';

type CommentsPolicy = 'keep' | 'anonymize' | 'delete';

export function ProfileSettings() {
  const { data: session } = useSession();
  const { t } = useLocale();
  const message = useMessage();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePolicy, setDeletePolicy] = useState<CommentsPolicy>('anonymize');
  const [confirmEmail, setConfirmEmail] = useState('');
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

  const handleExportData = async () => {
    setBusy('export');
    try {
      const response = await fetch('/api/user/account/export', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(t('profile.settingsExportError'));
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
      const filename =
        match?.[1] ||
        `mundobl-data-${new Date().toISOString().slice(0, 10)}.json`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success(t('profile.settingsExportSuccess'));
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : t('profile.settingsExportError')
      );
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteAccount = async () => {
    const userEmail = session?.user?.email ?? '';
    if (!userEmail) {
      message.error(t('profile.settingsDeleteMissingEmail'));
      return;
    }

    setBusy('delete');
    try {
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmEmail,
          commentsPolicy: deletePolicy,
        }),
      });

      if (!response.ok) {
        const payload =
          ((await response.json().catch(() => ({}))) as { error?: string }) ||
          {};
        throw new Error(payload.error || t('profile.settingsDeleteError'));
      }

      message.success(t('profile.settingsDeleteSuccess'));
      setDeleteOpen(false);
      setConfirmEmail('');
      setDeletePolicy('anonymize');
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : t('profile.settingsDeleteError')
      );
    } finally {
      setBusy(null);
    }
  };

  const currentUserEmail = session?.user?.email ?? '';
  const canSubmitDelete =
    currentUserEmail.length > 0 &&
    confirmEmail.trim().toLowerCase() === currentUserEmail.toLowerCase();

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
                <Tag color="warning">{t('profile.settingsIrreversible')}</Tag>
              </h3>
              <p className="profile-settings-card__hint">
                {t('profile.settingsDangerHint')}
              </p>
            </header>
            <div className="profile-settings-card__actions">
              <Button
                icon={<DownloadOutlined />}
                loading={busy === 'export'}
                onClick={() => {
                  void handleExportData();
                }}
              >
                {t('profile.settingsExportData')}
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => setDeleteOpen(true)}
              >
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

      <Modal
        open={deleteOpen}
        title={t('profile.settingsDeleteTitle')}
        okText={t('profile.settingsDeleteConfirmButton')}
        cancelText={t('profile.settingsDeleteCancelButton')}
        okButtonProps={{
          danger: true,
          loading: busy === 'delete',
          disabled: !canSubmitDelete,
        }}
        onOk={() => {
          void handleDeleteAccount();
        }}
        onCancel={() => {
          setDeleteOpen(false);
          setConfirmEmail('');
          setDeletePolicy('anonymize');
        }}
      >
        <p className="profile-settings-delete__intro">
          {t('profile.settingsDeleteIntro')}
        </p>

        <Radio.Group
          className="profile-settings-delete__policy"
          value={deletePolicy}
          onChange={(event) =>
            setDeletePolicy(event.target.value as CommentsPolicy)
          }
        >
          <Radio value="keep">{t('profile.settingsDeletePolicyKeep')}</Radio>
          <Radio value="anonymize">
            {t('profile.settingsDeletePolicyAnonymize')}
          </Radio>
          <Radio value="delete">
            {t('profile.settingsDeletePolicyDelete')}
          </Radio>
        </Radio.Group>

        <p className="profile-settings-delete__email-label">
          {t('profile.settingsDeleteEmailLabel')}
        </p>

        <Input
          value={confirmEmail}
          onChange={(event) => setConfirmEmail(event.target.value)}
          placeholder={t('profile.settingsDeleteEmailPlaceholder')}
        />

        {currentUserEmail && (
          <p className="profile-settings-delete__email-hint">
            {t('profile.settingsDeleteEmailHint')}{' '}
            <strong>{currentUserEmail}</strong>
          </p>
        )}
      </Modal>
    </>
  );
}
