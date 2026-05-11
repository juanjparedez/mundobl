'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Modal, Popconfirm, Radio, Tag } from 'antd';
import {
  SettingOutlined,
  ClearOutlined,
  ReloadOutlined,
  LogoutOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UserOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import { resetServiceWorker, clearAllCaches } from '@/lib/reset-recovery';
import { SettingsPanel } from '@/components/layout/SettingsPanel/SettingsPanel';
import { formatPublicName } from '@/lib/user-display';
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
  const [nickname, setNickname] = useState<string>('');
  const [nicknameInitial, setNicknameInitial] = useState<string>('');

  useEffect(() => {
    let aborted = false;
    fetch('/api/user/profile?topN=0')
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json().catch(() => null)) as {
          user?: { nickname?: string | null };
        } | null;
        if (aborted || !data) return;
        const nick = data.user?.nickname ?? '';
        setNickname(nick);
        setNicknameInitial(nick);
      })
      .catch(() => {});
    return () => {
      aborted = true;
    };
  }, []);

  const handleSaveNickname = async () => {
    setBusy('nickname');
    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() || null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t('profileSettings.saveError'));
      }
      const data = (await res.json()) as { nickname: string | null };
      setNicknameInitial(data.nickname ?? '');
      message.success(t('profileSettings.nicknameUpdated'));
    } catch (e) {
      message.error(
        e instanceof Error ? e.message : t('profileSettings.saveError')
      );
    } finally {
      setBusy(null);
    }
  };

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
                <UserOutlined /> {t('profileSettings.publicNameTitle')}
              </h3>
              <p className="profile-settings-card__hint">
                {t('profileSettings.publicNameHint', {
                  exampleName: formatPublicName({
                    name: session?.user?.name,
                    nickname: null,
                  }),
                })}
              </p>
            </header>
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Input
                placeholder={t('profileSettings.nicknamePlaceholder')}
                value={nickname}
                maxLength={40}
                onChange={(e) => setNickname(e.target.value)}
                onPressEnter={handleSaveNickname}
                style={{ flex: 1, minWidth: 200 }}
              />
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={busy === 'nickname'}
                disabled={nickname.trim() === nicknameInitial.trim()}
                onClick={handleSaveNickname}
              >
                {t('profileSettings.saveButton')}
              </Button>
            </div>
          </article>

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
                okText={t('profileSettings.deleteConfirmOk')}
                cancelText={t('settings.closeButton')}
              >
                <Button icon={<ReloadOutlined />} loading={busy === 'sw'}>
                  {t('settings.resetSwButton')}
                </Button>
              </Popconfirm>
              <Popconfirm
                title={t('settings.closeAllSessionsConfirm')}
                onConfirm={handleSignOutAll}
                okText={t('profileSettings.deleteConfirmOk')}
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

          <article className="profile-settings-card">
            <header className="profile-settings-card__header">
              <h3 className="profile-settings-card__title">
                {t('profile.settingsPrivacyTitle')}
              </h3>
              <p className="profile-settings-card__hint">
                {t('profile.settingsPrivacyHint')}
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
                danger
                icon={<DeleteOutlined />}
                onClick={() => setDeleteOpen(true)}
              >
                {t('profileSettings.deleteAccountButton')}
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
          {t('profileSettings.deleteIntro')}
        </p>

        <Radio.Group
          className="profile-settings-delete__policy"
          value={deletePolicy}
          onChange={(event) =>
            setDeletePolicy(event.target.value as CommentsPolicy)
          }
        >
          <Radio value="keep">{t('profileSettings.deletePolicyKeep')}</Radio>
          <Radio value="anonymize">
            {t('profileSettings.deletePolicyAnonymize')}
          </Radio>
          <Radio value="delete">
            {t('profileSettings.deletePolicyDelete')}
          </Radio>
        </Radio.Group>

        <p className="profile-settings-delete__email-label">
          {t('profileSettings.deleteEmailLabel')}
        </p>

        <Input
          value={confirmEmail}
          onChange={(event) => setConfirmEmail(event.target.value)}
          placeholder={t('profileSettings.deleteEmailPlaceholder')}
        />

        {currentUserEmail && (
          <p className="profile-settings-delete__email-hint">
            {t('profileSettings.deleteEmailHint')}{' '}
            <strong>{currentUserEmail}</strong>
          </p>
        )}
      </Modal>
    </>
  );
}
