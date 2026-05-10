'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Switch, TimePicker, Tooltip, Tag } from 'antd';
import {
  BellOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  MobileOutlined,
  DesktopOutlined,
  PoweroffOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useSession } from 'next-auth/react';
import { useMessage } from '@/hooks/useMessage';
import {
  enablePush,
  disablePush,
  getPushPermission,
  isPushSubscribed,
  sendTestPush,
  type PushPermission,
} from '@/lib/web-push-prefs';
import './NotificationsSettings.css';

interface NotificationPrefs {
  pushEnabled: boolean;
  notifySeasonAdded: boolean;
  notifyContentAdded: boolean;
  notifyReviewPublished: boolean;
  notifyCommentReply: boolean;
  quietStart: string | null;
  quietEnd: string | null;
}

interface DeviceSubscription {
  id: number;
  endpoint: string;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
}

const DEFAULT_PREFS: NotificationPrefs = {
  pushEnabled: true,
  notifySeasonAdded: true,
  notifyContentAdded: true,
  notifyReviewPublished: true,
  notifyCommentReply: true,
  quietStart: null,
  quietEnd: null,
};

function shortDevice(ua: string | null): string {
  if (!ua) return 'Dispositivo desconocido';
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Android/i.test(ua)) return 'Android';
    return 'Mobile';
  }
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Escritorio';
}

function relativeShort(value: string): string {
  const d = new Date(value);
  const ms = Date.now() - d.getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return 'recien';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.round(h / 24);
  return `hace ${days} d`;
}

export function NotificationsSettings() {
  const message = useMessage();
  const { status } = useSession();
  const [permission, setPermission] = useState<PushPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [savingKey, setSavingKey] = useState<keyof NotificationPrefs | null>(
    null
  );
  const [devices, setDevices] = useState<DeviceSubscription[]>([]);

  const refreshSubscriptionState = useCallback(async () => {
    setPermission(getPushPermission());
    setSubscribed(await isPushSubscribed());
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/push/subscribe');
      if (!res.ok) return;
      const data: { subscriptions: DeviceSubscription[] } = await res.json();
      setDevices(data.subscriptions);
    } catch {
      /* silent */
    }
  }, []);

  const refreshPrefs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/prefs');
      if (!res.ok) return;
      const data: NotificationPrefs = await res.json();
      setPrefs({
        ...DEFAULT_PREFS,
        ...data,
      });
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    void refreshSubscriptionState();
    void refreshPrefs();
    void refreshDevices();
  }, [status, refreshSubscriptionState, refreshPrefs, refreshDevices]);

  const handleToggleSubscription = async (next: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      if (!next) {
        await disablePush();
        await refreshSubscriptionState();
        await refreshDevices();
        message.success('Notificaciones desactivadas en este dispositivo');
        return;
      }
      const res = await enablePush();
      await refreshSubscriptionState();
      await refreshDevices();
      if (res.ok) {
        message.success('Notificaciones activadas en este dispositivo');
        // Tras suscribirnos, asegurar que la pref global sea on.
        if (!prefs.pushEnabled) {
          await savePref('pushEnabled', true);
        }
      } else if (res.permission === 'denied') {
        message.warning(
          'Tu navegador rechazo el permiso. Habilitalo desde la configuracion del sitio.'
        );
      } else if (res.reason === 'no-vapid-key') {
        message.error(
          'Falta configurar las VAPID keys del servidor. Avisale al admin.'
        );
      } else if (res.permission === 'unsupported') {
        message.error('Tu navegador no soporta notificaciones push.');
      } else {
        message.error('No pudimos activar las notificaciones.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await sendTestPush();
      if (res.ok && res.delivered > 0) {
        message.success(
          `Notificacion de prueba enviada a ${res.delivered} dispositivo${res.delivered === 1 ? '' : 's'}`
        );
      } else if (res.ok && res.delivered === 0) {
        message.warning(
          'No hay dispositivos registrados — activa primero las notificaciones'
        );
      } else {
        message.error('No pudimos enviar la prueba');
      }
    } finally {
      setTesting(false);
    }
  };

  const savePref = async (
    key: keyof NotificationPrefs,
    value: boolean | string | null
  ) => {
    setSavingKey(key);
    setPrefs((p) => ({ ...p, [key]: value }));
    try {
      const res = await fetch('/api/notifications/prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error('save-failed');
    } catch {
      message.error('No pudimos guardar la preferencia');
      // Revert
      void refreshPrefs();
    } finally {
      setSavingKey(null);
    }
  };

  const handleQuietHoursChange = async (
    range: [Dayjs | null, Dayjs | null] | null
  ) => {
    if (!range || (!range[0] && !range[1])) {
      await Promise.all([
        savePref('quietStart', null),
        savePref('quietEnd', null),
      ]);
      return;
    }
    const start = range[0]?.format('HH:mm') ?? null;
    const end = range[1]?.format('HH:mm') ?? null;
    await Promise.all([
      savePref('quietStart', start),
      savePref('quietEnd', end),
    ]);
  };

  if (status !== 'authenticated') {
    return (
      <div className="ns-block ns-block--unauth">
        Inicia sesion para configurar tus notificaciones.
      </div>
    );
  }

  const permissionLabel =
    permission === 'unsupported'
      ? 'Tu navegador no soporta notificaciones push'
      : permission === 'denied'
        ? 'Permiso bloqueado por el navegador. Tocá el candado/escudo en la barra de direcciones → "Notificaciones" → "Permitir", luego recargá la página.'
        : permission === 'granted'
          ? subscribed
            ? 'Activas en este dispositivo'
            : 'Permiso otorgado pero sin suscripcion. Tocá "Activar" para registrar este dispositivo.'
          : 'Recibi avisos cuando una serie suscrita tiene novedades — incluso con la pestaña cerrada';

  const permTone =
    permission === 'denied' || permission === 'unsupported'
      ? 'danger'
      : subscribed
        ? 'success'
        : 'default';

  return (
    <div className="notifications-settings">
      {/* Toggle principal de subscripcion en este dispositivo */}
      <div className="ns-block">
        <div className="ns-row">
          <div className="ns-row__lead">
            <BellOutlined className="ns-row__icon" />
            <div>
              <div className="ns-row__label">
                Notificaciones en este dispositivo
              </div>
              <div className={`ns-row__hint ns-row__hint--${permTone}`}>
                {permissionLabel}
              </div>
            </div>
          </div>
          <Switch
            checked={subscribed}
            disabled={
              busy || permission === 'unsupported' || permission === 'denied'
            }
            loading={busy}
            onChange={handleToggleSubscription}
            aria-label="Toggle de notificaciones push"
          />
        </div>

        {subscribed && (
          <Button
            icon={<ExperimentOutlined />}
            onClick={handleTest}
            loading={testing}
            block
            className="ns-test-btn"
          >
            Enviar notificacion de prueba
          </Button>
        )}

        {devices.length > 0 && (
          <div className="ns-devices">
            <div className="ns-devices__title">
              Dispositivos registrados ({devices.length})
            </div>
            <ul className="ns-devices__list">
              {devices.map((d) => (
                <li key={d.id} className="ns-devices__item">
                  <span className="ns-devices__icon">
                    {/Mobile|Android|iPhone|iPad/i.test(d.userAgent ?? '') ? (
                      <MobileOutlined />
                    ) : (
                      <DesktopOutlined />
                    )}
                  </span>
                  <div className="ns-devices__info">
                    <span className="ns-devices__name">
                      {shortDevice(d.userAgent)}
                    </span>
                    <span className="ns-devices__when">
                      ultima actividad: {relativeShort(d.lastUsedAt)}
                    </span>
                  </div>
                  <Tooltip title="Desconectar este dispositivo">
                    <Button
                      type="text"
                      size="small"
                      icon={<PoweroffOutlined />}
                      onClick={async () => {
                        await fetch(
                          `/api/push/subscribe?endpoint=${encodeURIComponent(d.endpoint)}`,
                          { method: 'DELETE' }
                        );
                        message.success('Dispositivo desconectado');
                        void refreshDevices();
                        void refreshSubscriptionState();
                      }}
                    />
                  </Tooltip>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Granular: que eventos quiero recibir */}
      <div className="ns-block">
        <div className="ns-block__title">
          Que avisos recibir
          <span className="ns-block__hint">
            Aplica tanto a la campana como al push del navegador
          </span>
        </div>
        <PrefRow
          label="Nuevas temporadas"
          desc="Cuando una serie suscrita estrena temporada"
          checked={prefs.notifySeasonAdded}
          loading={savingKey === 'notifySeasonAdded'}
          onChange={(v) => savePref('notifySeasonAdded', v)}
        />
        <PrefRow
          label="Nuevo contenido"
          desc="Trailers, behind-the-scenes, links agregados"
          checked={prefs.notifyContentAdded}
          loading={savingKey === 'notifyContentAdded'}
          onChange={(v) => savePref('notifyContentAdded', v)}
        />
        <PrefRow
          label="Resenas publicadas"
          desc="Cuando alguien publica una resena de una serie suscrita"
          checked={prefs.notifyReviewPublished}
          loading={savingKey === 'notifyReviewPublished'}
          onChange={(v) => savePref('notifyReviewPublished', v)}
        />
        <PrefRow
          label="Respuestas a comentarios"
          desc="Cuando alguien responde en un hilo en el que participaste"
          checked={prefs.notifyCommentReply}
          loading={savingKey === 'notifyCommentReply'}
          onChange={(v) => savePref('notifyCommentReply', v)}
        />
      </div>

      {/* Quiet hours */}
      <div className="ns-block">
        <div className="ns-block__title">
          <ClockCircleOutlined /> Horario silencioso
          <span className="ns-block__hint">
            En este rango horario las notificaciones igual quedan en la campana,
            pero no suena el push del navegador. Hora UTC.
          </span>
        </div>
        <TimePicker.RangePicker
          format="HH:mm"
          minuteStep={15}
          value={[
            prefs.quietStart ? dayjs(prefs.quietStart, 'HH:mm') : null,
            prefs.quietEnd ? dayjs(prefs.quietEnd, 'HH:mm') : null,
          ]}
          onChange={(range) =>
            handleQuietHoursChange(range as [Dayjs | null, Dayjs | null] | null)
          }
          allowClear
        />
        {prefs.quietStart && prefs.quietEnd && (
          <Tag className="ns-quiet-active" color="purple">
            Activo: {prefs.quietStart} → {prefs.quietEnd} UTC
          </Tag>
        )}
      </div>
    </div>
  );
}

interface PrefRowProps {
  label: string;
  desc: string;
  checked: boolean;
  loading: boolean;
  onChange: (v: boolean) => void;
}

function PrefRow({ label, desc, checked, loading, onChange }: PrefRowProps) {
  return (
    <div className="ns-row">
      <div className="ns-row__lead">
        <div>
          <div className="ns-row__label">{label}</div>
          <div className="ns-row__hint">{desc}</div>
        </div>
      </div>
      <Switch checked={checked} loading={loading} onChange={onChange} />
    </div>
  );
}
