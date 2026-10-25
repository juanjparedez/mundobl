'use client';

import Link from 'next/link';
import { Button, Progress } from 'antd';
import { CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { Chip } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { computeProfileCompleteness } from '@/lib/profile-completeness';
import type { ProfileData } from '../../../types';
import './ProfileCompletenessWidget.css';

export interface ProfileCompletenessWidgetProps {
  user: ProfileData['user'];
  stats: ProfileData['stats'];
  /** Pestaña Ajustes del perfil. */
  settingsHref: string;
}

const TONE = { low: 'error', mid: 'warning', high: 'success' } as const;

/** Widget de completitud del perfil (#112 fase 3). Reusa la métrica pura
 *  profile-completeness.ts. Sin i18n nuevo: reusa completeness.* y
 *  profileDashboard.editProfile (ya en los 10 locales). El CTA lleva a la
 *  pestaña Ajustes (mismo destino que "Editar perfil"). */
export function ProfileCompletenessWidget({
  user,
  stats,
  settingsHref,
}: ProfileCompletenessWidgetProps) {
  const { t } = useLocale();
  const { score, tier } = computeProfileCompleteness({ user, stats });

  return (
    <Widget title={t('completeness.title')} icon={<CheckCircleOutlined />}>
      <div className="mb-profile-completeness">
        <div className="mb-profile-completeness__head">
          <span className="mb-profile-completeness__score">{score}%</span>
          <Chip tone={TONE[tier]} size="sm">
            {t(`completeness.tier.${tier}`)}
          </Chip>
        </div>
        <Progress
          percent={score}
          showInfo={false}
          size={['100%', 8]}
          status={
            tier === 'low'
              ? 'exception'
              : tier === 'high'
                ? 'success'
                : 'normal'
          }
        />
        {score < 100 && (
          <Link href={settingsHref} className="mb-profile-completeness__cta">
            <Button size="small" icon={<EditOutlined />}>
              {t('profileDashboard.editProfile')}
            </Button>
          </Link>
        )}
      </div>
    </Widget>
  );
}
