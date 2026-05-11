'use client';

import {
  UserOutlined,
  BgColorsOutlined,
  BellOutlined,
  LockOutlined,
  ApiOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
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
  const { t } = useLocale();
  const cards: Card[] = [
    {
      key: 'public-name',
      icon: <UserOutlined />,
      title: t('profile.settingsCardPublicNameTitle'),
      desc: t('profile.settingsCardPublicNameDesc'),
      href: '#mb-profile-settings',
      tone: 'default',
    },
    {
      key: 'appearance',
      icon: <BgColorsOutlined />,
      title: t('profile.settingsCardAppearanceTitle'),
      desc: t('profile.settingsCardAppearanceDesc'),
      href: '#mb-profile-settings',
      tone: 'default',
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      title: t('profile.settingsCardNotificationsTitle'),
      desc: t('profile.settingsCardNotificationsDesc'),
      href: '/notificaciones',
      tone: 'default',
    },
    {
      key: 'privacy',
      icon: <LockOutlined />,
      title: t('profile.settingsCardPrivacyTitle'),
      desc: t('profile.settingsCardPrivacyDesc'),
      href: '#mb-profile-settings',
      tone: 'default',
    },
    {
      key: 'sessions',
      icon: <ApiOutlined />,
      title: t('profile.settingsCardSessionsTitle'),
      desc: t('profile.settingsCardSessionsDesc'),
      href: '#mb-profile-settings',
      tone: 'default',
    },
    {
      key: 'danger',
      icon: <WarningOutlined />,
      title: t('profile.settingsCardDangerTitle'),
      desc: t('profile.settingsCardDangerDesc'),
      href: '#mb-profile-settings',
      tone: 'danger',
    },
  ];

  // Header lo provee el Widget wrapper (SettingsRowWidget).
  return (
    <section className="overview-settings">
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
