'use client';

import {
  UserOutlined,
  BgColorsOutlined,
  BellOutlined,
  LockOutlined,
  ApiOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import './SettingsRow.css';

interface Card {
  key: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
  tone: 'default' | 'danger';
}

interface Props {
  onCardClick?: (key: string) => void;
}

/** "Configuración y preferencias" del style-guide: 6 cards horizontales
 *  con icono + titulo + descripcion. Click hace scroll-to o abre el panel
 *  correspondiente. La ultima ("Zona de peligro") se muestra con tono rojo. */
export function OverviewSettingsRow({ onCardClick }: Props) {
  const cards: Card[] = [
    {
      key: 'public-name',
      icon: <UserOutlined />,
      title: 'Nombre público',
      desc: 'Tu nombre visible en la comunidad',
      href: '#mb-profile-settings',
      tone: 'default',
    },
    {
      key: 'appearance',
      icon: <BgColorsOutlined />,
      title: 'Apariencia y accesibilidad',
      desc: 'Tema, acento, tamaño de texto y más',
      href: '#mb-profile-settings',
      tone: 'default',
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      title: 'Notificaciones',
      desc: 'Email, push y preferencias',
      href: '/notificaciones',
      tone: 'default',
    },
    {
      key: 'privacy',
      icon: <LockOutlined />,
      title: 'Privacidad y datos',
      desc: 'Exportar datos y controles',
      href: '#mb-profile-settings',
      tone: 'default',
    },
    {
      key: 'sessions',
      icon: <ApiOutlined />,
      title: 'Sesiones y dispositivos',
      desc: 'Gestionar tus sesiones activas',
      href: '#mb-profile-settings',
      tone: 'default',
    },
    {
      key: 'danger',
      icon: <WarningOutlined />,
      title: 'Zona de peligro',
      desc: 'Eliminar cuenta y más',
      href: '#mb-profile-settings',
      tone: 'danger',
    },
  ];

  return (
    <section className="overview-settings">
      <header className="overview-settings__head">
        <h3 className="overview-settings__title">
          Configuración y preferencias
        </h3>
      </header>
      <ul className="overview-settings__grid">
        {cards.map((c) => (
          <li key={c.key}>
            <a
              href={c.href}
              className={`overview-settings__card overview-settings__card--${c.tone}`}
              onClick={(e) => {
                if (onCardClick) {
                  e.preventDefault();
                  onCardClick(c.key);
                }
              }}
            >
              <span className="overview-settings__icon" aria-hidden>
                {c.icon}
              </span>
              <span className="overview-settings__body">
                <span className="overview-settings__name">{c.title}</span>
                <span className="overview-settings__desc">{c.desc}</span>
              </span>
              <span className="overview-settings__arrow" aria-hidden>
                ›
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
