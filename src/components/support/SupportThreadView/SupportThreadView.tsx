'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Tag, message as antMessage } from 'antd';
import { PanelCard, SectionHeader } from '@/components/design-system';
import './SupportThreadView.css';

export interface SupportMessageItem {
  id: number;
  body: string;
  createdAt: string;
  fromStaff: boolean;
  authorName: string | null;
}

export interface SupportThreadDetail {
  id: number;
  subject: string;
  status: string;
  createdAt: string;
  authorName: string | null;
  messages: SupportMessageItem[];
}

interface Props {
  thread: SupportThreadDetail;
  /** true cuando lo mira curaduria; cambia atribucion y textos. */
  viewerIsStaff: boolean;
}

function statusTone(status: string): {
  color: string;
  label: string;
} {
  switch (status) {
    case 'ANSWERED':
      return { color: 'green', label: 'Respondida' };
    case 'CLOSED':
      return { color: 'default', label: 'Cerrada' };
    default:
      return { color: 'gold', label: 'Esperando respuesta' };
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SupportThreadView({ thread, viewerIsStaff }: Props) {
  const router = useRouter();
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  const tone = statusTone(thread.status);
  const isClosed = thread.status === 'CLOSED';

  const send = async () => {
    const body = reply.trim();
    if (!body) return;
    setSending(true);
    try {
      const response = await fetch(`/api/soporte/${thread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: body }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? 'No se pudo enviar el mensaje.');
      }
      setReply('');
      antMessage.success(isClosed ? 'Consulta reabierta.' : 'Mensaje enviado.');
      router.refresh();
    } catch (error: unknown) {
      antMessage.error(
        error instanceof Error ? error.message : 'Error al enviar.'
      );
    } finally {
      setSending(false);
    }
  };

  const setStatus = async (status: 'OPEN' | 'CLOSED') => {
    setClosing(true);
    try {
      const response = await fetch(`/api/soporte/${thread.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('No se pudo actualizar la consulta.');
      antMessage.success(
        status === 'CLOSED' ? 'Consulta cerrada.' : 'Consulta reabierta.'
      );
      router.refresh();
    } catch (error: unknown) {
      antMessage.error(
        error instanceof Error ? error.message : 'Error al actualizar.'
      );
    } finally {
      setClosing(false);
    }
  };

  return (
    <PanelCard
      header={
        <SectionHeader
          as="h1"
          size="lg"
          title={thread.subject}
          subtitle={
            viewerIsStaff
              ? `${thread.authorName ?? 'Colaborador'} · abierta el ${formatDate(thread.createdAt)}`
              : `Abierta el ${formatDate(thread.createdAt)}`
          }
          actions={
            <div className="support-thread__actions">
              <Tag color={tone.color}>{tone.label}</Tag>
              <Button
                size="small"
                loading={closing}
                onClick={() => setStatus(isClosed ? 'OPEN' : 'CLOSED')}
              >
                {isClosed ? 'Reabrir' : 'Cerrar'}
              </Button>
            </div>
          }
        />
      }
    >
      <ol className="support-thread__messages">
        {thread.messages.map((item) => {
          // "Mío" es relativo a quien mira: para curaduria los suyos son los
          // fromStaff, para el colaborador son los otros.
          const isMine = item.fromStaff === viewerIsStaff;
          return (
            <li
              key={item.id}
              className={`support-message${isMine ? ' support-message--mine' : ''}`}
            >
              <div className="support-message__meta">
                <span className="support-message__author">
                  {item.fromStaff
                    ? (item.authorName ?? 'Curaduría')
                    : (item.authorName ?? 'Colaborador')}
                </span>
                {item.fromStaff && <Tag color="blue">Curaduría</Tag>}
                <span className="support-message__date">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              <p className="support-message__body">{item.body}</p>
            </li>
          );
        })}
      </ol>

      <div className="support-thread__reply">
        <Input.TextArea
          rows={4}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          maxLength={4000}
          showCount
          placeholder={
            isClosed
              ? 'Si respondés, la consulta se reabre.'
              : viewerIsStaff
                ? 'Tu respuesta le llega como notificación.'
                : 'Contanos con el mayor detalle posible.'
          }
        />
        <Button
          type="primary"
          loading={sending}
          disabled={!reply.trim()}
          onClick={send}
        >
          Enviar
        </Button>
      </div>
    </PanelCard>
  );
}
