'use client';

import { useState } from 'react';
import { Button, Modal, Input, App } from 'antd';
import {
  ShareAltOutlined,
  CopyOutlined,
  CheckOutlined,
  WhatsAppOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { withUtm } from '@/lib/share-utm';
import { trackEvent } from '@/lib/analytics';
import './ShareButton.css';

export type ShareButtonChannel = 'native' | 'copy' | 'whatsapp' | 'telegram';

interface ShareButtonProps {
  title: string;
  labels: { share: string; copied: string; copy: string; copyError: string };
  text?: string;
  url?: string;
  path?: string;
  variant?: 'compact' | 'default' | 'icon-only';
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
  ghost?: boolean;
  className?: string;
  buttonText?: string;
  /** Se llama cuando el share se completo (no al abrir el modal). */
  onShared?: (channel: ShareButtonChannel) => void;
}

export function ShareButton({
  title,
  labels,
  text,
  url,
  path,
  variant: _variant = 'default',
  size = 'middle',
  type = 'default',
  ghost = false,
  className = '',
  buttonText,
  onShared,
}: ShareButtonProps) {
  const { message } = App.useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    const target = url || path;
    if (target) {
      if (target.startsWith('http')) return target;
      return `${typeof window !== 'undefined' ? window.location.origin : 'https://mundobl.com.ar'}${target.startsWith('/') ? '' : '/'}${target}`;
    }
    return typeof window !== 'undefined'
      ? window.location.href
      : 'https://mundobl.com.ar';
  };

  const getShareText = () => text || title;

  const handleShareClick = async () => {
    const shareUrl = getShareUrl();
    const shareText = getShareText();

    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: withUtm(shareUrl, 'native'),
        });
        trackEvent('share', { channel: 'native' });
        onShared?.('native');
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    setModalOpen(true);
  };

  const handleCopy = async () => {
    const shareUrl = withUtm(getShareUrl(), 'copy');
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.className = 'share-copy-fallback';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      trackEvent('share', { channel: 'copy' });
      onShared?.('copy');
      message.success(labels.copied);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      message.error(labels.copyError);
    }
  };

  const shareUrl = getShareUrl();
  const shareText = getShareText();
  // Lo que se muestra en el input es exactamente lo que copia el boton.
  const copyUrl = withUtm(shareUrl, 'copy');

  // Cada canal lleva su propio utm_source para poder separarlos en Vercel
  // Analytics. Sin esto todo cae en "directo" y no se puede saber que canal
  // trae gente — ver src/lib/share-utm.ts.
  const socialLinks = [
    {
      name: 'WhatsApp',
      channel: 'whatsapp' as const,
      icon: <WhatsAppOutlined className="share-modal__icon" />,
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${withUtm(shareUrl, 'whatsapp')}`)}`,
    },
    {
      name: 'Telegram',
      channel: 'telegram' as const,
      icon: <SendOutlined className="share-modal__icon" />,
      url: `https://t.me/share/url?url=${encodeURIComponent(withUtm(shareUrl, 'telegram'))}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  return (
    <>
      <Button
        icon={<ShareAltOutlined />}
        onClick={handleShareClick}
        size={size}
        type={type}
        ghost={ghost}
        className={`share-button ${className}`}
        aria-label={`${labels.share} ${title}`}
      >
        {buttonText || labels.share}
      </Button>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title={
          <div className="share-modal__header">
            <ShareAltOutlined className="share-modal__icon" />
            <span>{labels.share}</span>
          </div>
        }
        centered
        width={420}
        className="share-modal"
      >
        <div className="share-modal__content">
          <p className="share-modal__title">{title}</p>

          <div className="share-modal__grid">
            {socialLinks.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="share-modal__item"
                onClick={() => {
                  trackEvent('share', { channel: item.channel });
                  onShared?.(item.channel);
                }}
              >
                {item.icon}
                <span>{item.name}</span>
              </a>
            ))}
          </div>

          <div className="share-modal__copy-box">
            <Input
              value={copyUrl}
              readOnly
              className="share-modal__input"
              addonAfter={
                <Button
                  type="text"
                  icon={
                    copied ? (
                      <CheckOutlined className="share-modal__success" />
                    ) : (
                      <CopyOutlined />
                    )
                  }
                  onClick={handleCopy}
                  className="share-modal__copy-btn"
                >
                  {copied ? labels.copied : labels.copy}
                </Button>
              }
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
