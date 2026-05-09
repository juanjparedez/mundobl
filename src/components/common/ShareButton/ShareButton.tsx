'use client';

import { useSyncExternalStore } from 'react';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  ShareAltOutlined,
  LinkOutlined,
  TwitterOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './ShareButton.css';

interface ShareButtonProps {
  title: string;
  text?: string;
  path: string;
  // Variante visual: 'compact' = solo icono, 'full' = boton con texto.
  // Default 'compact' para evitar que pese mucho en headers densos.
  variant?: 'compact' | 'full';
}

const subscribeNoop = () => () => undefined;
const getNativeShare = () =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function';
const getServerNativeShare = () => false;

export function ShareButton({
  title,
  text,
  path,
  variant = 'compact',
}: ShareButtonProps) {
  const { t } = useLocale();
  const message = useMessage();
  const hasNativeShare = useSyncExternalStore(
    subscribeNoop,
    getNativeShare,
    getServerNativeShare
  );

  const buildUrl = () =>
    typeof window === 'undefined'
      ? `https://mundobl.com.ar${path}`
      : new URL(path, window.location.origin).toString();

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: text ?? title, url: buildUrl() });
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return;
      console.error(error);
      message.error(t('shareButton.shareError'));
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildUrl());
      message.success(t('shareButton.linkCopied'));
    } catch {
      message.error(t('shareButton.copyLinkError'));
    }
  };

  const baseItems: MenuProps['items'] = [
    {
      key: 'copy',
      icon: <LinkOutlined />,
      label: t('shareButton.copyLink'),
      onClick: copyLink,
    },
    {
      key: 'whatsapp',
      icon: <WhatsAppOutlined />,
      label: t('shareButton.whatsapp'),
      onClick: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${title} — ${buildUrl()}`)}`,
          '_blank',
          'noopener,noreferrer'
        );
      },
    },
    {
      key: 'twitter',
      icon: <TwitterOutlined />,
      label: t('shareButton.twitter'),
      onClick: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(buildUrl())}`,
          '_blank',
          'noopener,noreferrer'
        );
      },
    },
  ];

  const items: MenuProps['items'] = hasNativeShare
    ? [
        {
          key: 'native',
          icon: <ShareAltOutlined />,
          label: t('shareButton.shareOption'),
          onClick: nativeShare,
        },
        { type: 'divider' as const },
        ...baseItems,
      ]
    : baseItems;

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      {variant === 'compact' ? (
        <Button
          icon={<ShareAltOutlined />}
          shape="circle"
          className="share-button share-button--compact"
          aria-label={t('shareButton.share')}
          title={t('shareButton.share')}
        />
      ) : (
        <Button
          icon={<ShareAltOutlined />}
          className="share-button share-button--full"
        >
          {t('shareButton.share')}
        </Button>
      )}
    </Dropdown>
  );
}
