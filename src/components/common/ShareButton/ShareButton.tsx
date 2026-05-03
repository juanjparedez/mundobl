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
import './ShareButton.css';

interface ShareButtonProps {
  title: string;
  text?: string;
  path: string;
}

const subscribeNoop = () => () => undefined;
const getNativeShare = () =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function';
const getServerNativeShare = () => false;

export function ShareButton({ title, text, path }: ShareButtonProps) {
  const message = useMessage();
  const hasNativeShare = useSyncExternalStore(
    subscribeNoop,
    getNativeShare,
    getServerNativeShare
  );

  const buildUrl = () =>
    typeof window === 'undefined'
      ? `https://mundobl.win${path}`
      : new URL(path, window.location.origin).toString();

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: text ?? title, url: buildUrl() });
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return;
      console.error(error);
      message.error('No se pudo compartir');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildUrl());
      message.success('Link copiado');
    } catch {
      message.error('No se pudo copiar el link');
    }
  };

  const baseItems: MenuProps['items'] = [
    {
      key: 'copy',
      icon: <LinkOutlined />,
      label: 'Copiar link',
      onClick: copyLink,
    },
    {
      key: 'whatsapp',
      icon: <WhatsAppOutlined />,
      label: 'WhatsApp',
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
      label: 'X / Twitter',
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
          label: 'Compartir...',
          onClick: nativeShare,
        },
        { type: 'divider' as const },
        ...baseItems,
      ]
    : baseItems;

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <Button icon={<ShareAltOutlined />} className="share-button">
        Compartir
      </Button>
    </Dropdown>
  );
}
