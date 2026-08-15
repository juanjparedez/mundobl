'use client';

import { useState } from 'react';
import { Button, Modal, Input, message } from 'antd';
import {
  ShareAltOutlined,
  CopyOutlined,
  CheckOutlined,
  WhatsAppOutlined,
  TwitterOutlined,
  FacebookOutlined,
  SendOutlined,
} from '@ant-design/icons';
import './ShareButton.css';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  path?: string;
  variant?: 'compact' | 'default' | 'icon-only';
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
  ghost?: boolean;
  className?: string;
  buttonText?: string;
}

export function ShareButton({
  title,
  text,
  url,
  path,
  variant: _variant = 'default',
  size = 'middle',
  type = 'default',
  ghost = false,
  className = '',
  buttonText,
}: ShareButtonProps) {
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

  const getShareText = () => {
    return (
      text ||
      `Mirá "${title}" en MundoBL: el catálogo de series y películas BL/GL`
    );
  };

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
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    setModalOpen(true);
  };

  const handleCopy = async () => {
    const shareUrl = getShareUrl();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      message.success('¡Enlace copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      message.error('No se pudo copiar el enlace.');
    }
  };

  const shareUrl = getShareUrl();
  const shareText = getShareText();

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: <WhatsAppOutlined style={{ fontSize: 20, color: '#25D366' }} />,
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
      bg: 'rgba(37, 211, 102, 0.12)',
    },
    {
      name: 'Telegram',
      icon: <SendOutlined style={{ fontSize: 20, color: '#229ED9' }} />,
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      bg: 'rgba(34, 158, 217, 0.12)',
    },
    {
      name: 'Twitter / X',
      icon: <TwitterOutlined style={{ fontSize: 20, color: '#1DA1F2' }} />,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      bg: 'rgba(29, 161, 242, 0.12)',
    },
    {
      name: 'Facebook',
      icon: <FacebookOutlined style={{ fontSize: 20, color: '#1877F2' }} />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      bg: 'rgba(24, 119, 242, 0.12)',
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
        aria-label={`Compartir ${title}`}
      >
        {buttonText || 'Compartir'}
      </Button>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title={
          <div className="share-modal__header">
            <ShareAltOutlined style={{ color: 'var(--primary-color)' }} />
            <span>Compartir serie</span>
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
                style={{ background: item.bg }}
              >
                {item.icon}
                <span>{item.name}</span>
              </a>
            ))}
          </div>

          <div className="share-modal__copy-box">
            <Input
              value={shareUrl}
              readOnly
              className="share-modal__input"
              addonAfter={
                <Button
                  type="text"
                  icon={
                    copied ? (
                      <CheckOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <CopyOutlined />
                    )
                  }
                  onClick={handleCopy}
                  className="share-modal__copy-btn"
                >
                  {copied ? '¡Copiado!' : 'Copiar'}
                </Button>
              }
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
