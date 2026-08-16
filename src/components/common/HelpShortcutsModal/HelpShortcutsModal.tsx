'use client';

import { useState, useEffect } from 'react';
import { Modal, Tabs, Tag } from 'antd';
import {
  QuestionCircleOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  PlayCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import './HelpShortcutsModal.css';

export function HelpShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (e.key === '?' && !isTyping && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mb:open-help', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mb:open-help', handleCustomOpen);
    };
  }, []);

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      title={
        <span className="help-modal__header-title">
          <QuestionCircleOutlined /> Ayuda y Atajos de Teclado
        </span>
      }
      width={640}
      className="help-modal"
      centered
    >
      <Tabs
        defaultActiveKey="shortcuts"
        items={[
          {
            key: 'shortcuts',
            label: (
              <span>
                <ThunderboltOutlined /> Atajos Rápidos
              </span>
            ),
            children: (
              <div className="help-modal__section">
                <div className="help-modal__shortcut-row">
                  <span className="help-modal__shortcut-desc">
                    <SearchOutlined /> Abrir buscador global de series y personas
                  </span>
                  <span className="help-modal__keys">
                    <kbd>Ctrl</kbd> + <kbd>K</kbd> ó <kbd>/</kbd>
                  </span>
                </div>

                <div className="help-modal__shortcut-row">
                  <span className="help-modal__shortcut-desc">
                    <QuestionCircleOutlined /> Abrir esta guía de ayuda
                  </span>
                  <span className="help-modal__keys">
                    <kbd>?</kbd>
                  </span>
                </div>

                <div className="help-modal__shortcut-row">
                  <span className="help-modal__shortcut-desc">
                    <PlayCircleOutlined /> Navegar al siguiente / anterior capítulo en /ver
                  </span>
                  <span className="help-modal__keys">
                    <kbd>←</kbd> <kbd>→</kbd>
                  </span>
                </div>

                <div className="help-modal__shortcut-row">
                  <span className="help-modal__shortcut-desc">Cerrar modales o búsquedas</span>
                  <span className="help-modal__keys">
                    <kbd>Esc</kbd>
                  </span>
                </div>
              </div>
            ),
          },
          {
            key: 'player',
            label: (
              <span>
                <PlayCircleOutlined /> Reproductor & Subtítulos
              </span>
            ),
            children: (
              <div className="help-modal__section help-modal__text-content">
                <p>
                  <strong>¿Cómo funcionan los videos en MundoBL?</strong>
                </p>
                <p>
                  MundoBL reproduce las transmisiones oficiales alojadas en canales autorizados (YouTube, Vimeo, Bilibili).
                </p>
                <ul>
                  <li>
                    <strong>Subtítulos en español:</strong> Se solicitan automáticamente. Si el canal oficial dispone de CC en español, aparecerán activados. Podés ajustar idioma y tamaño desde el botón <strong>[CC]</strong> del reproductor.
                  </li>
                  <li>
                    <strong>Partes y Capítulos:</strong> Muchas productoras tailandesas dividen los episodios en 4 partes (ej: <code>[1/4]</code> a <code>[4/4]</code>). Podés saltar entre partes directamente desde el selector inferior.
                  </li>
                </ul>
              </div>
            ),
          },
          {
            key: 'platforms',
            label: (
              <span>
                <SafetyCertificateOutlined /> Comparador & Legal
              </span>
            ),
            children: (
              <div className="help-modal__section help-modal__text-content">
                <p>
                  <strong>El servicio de arbitraje de MundoBL:</strong>
                </p>
                <p>
                  Te ayudamos a saber dónde ver legalmente cada serie, qué plataformas ofrecen versión Uncut sin censura y qué planes existen (Gratis con publicidad, VIP mensual o compra digital).
                </p>
                <p>
                  Podés consultar la tabla completa en{' '}
                  <a href="/plataformas" onClick={() => setOpen(false)}>
                    /plataformas
                  </a>
                  .
                </p>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
}
