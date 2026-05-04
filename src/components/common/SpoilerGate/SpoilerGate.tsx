'use client';

import { ReactNode } from 'react';
import { Button } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useSpoilerFree } from '@/lib/providers/SpoilerFreeProvider';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './SpoilerGate.css';

interface SpoilerGateProps {
  // Si false, renderiza children sin gate. Sirve para condicionar
  // (ej: episodio ya visto → no aplicar gate).
  hide: boolean;
  // Identificador unico para que el "Mostrar igual" persista por item.
  cacheKey: string;
  // Mensaje opcional sobre por qué está oculto (ej: "Episodio no visto").
  reason?: string;
  children: ReactNode;
}

export function SpoilerGate({
  hide,
  cacheKey,
  reason,
  children,
}: SpoilerGateProps) {
  const { enabled, isRevealed, reveal } = useSpoilerFree();
  const { t } = useLocale();

  // Si el modo no está activo, o no hay que ocultar, o ya se reveló: pasar.
  if (!enabled || !hide || isRevealed(cacheKey)) {
    return <>{children}</>;
  }

  return (
    <div
      className="spoiler-gate"
      role="region"
      aria-label={t('spoilerGate.label')}
    >
      <div className="spoiler-gate__overlay">
        <EyeInvisibleOutlined className="spoiler-gate__icon" />
        <p className="spoiler-gate__reason">
          {reason ?? t('spoilerGate.defaultReason')}
        </p>
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => reveal(cacheKey)}
        >
          {t('spoilerGate.reveal')}
        </Button>
      </div>
      <div className="spoiler-gate__content" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
