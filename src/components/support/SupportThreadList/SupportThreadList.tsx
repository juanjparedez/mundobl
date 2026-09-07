import Link from 'next/link';
import { Tag } from 'antd';
import { EmptyState } from '@/components/design-system';
import './SupportThreadList.css';

export interface SupportThreadRow {
  id: number;
  subject: string;
  status: string;
  updatedAt: string;
  authorName: string | null;
  messageCount: number;
  lastMessage: string | null;
}

interface Props {
  threads: SupportThreadRow[];
  /** Ruta base de la vista de hilo — difiere entre colaborador y curaduria. */
  basePath: string;
  /** Mostrar de quien es cada consulta (solo tiene sentido en curaduria). */
  showAuthor?: boolean;
  emptyTitle: string;
  emptyDescription: string;
}

const STATUS_LABEL: Record<string, { color: string; label: string }> = {
  OPEN: { color: 'gold', label: 'Esperando respuesta' },
  ANSWERED: { color: 'green', label: 'Respondida' },
  CLOSED: { color: 'default', label: 'Cerrada' },
};

export function SupportThreadList({
  threads,
  basePath,
  showAuthor = false,
  emptyTitle,
  emptyDescription,
}: Props) {
  if (threads.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="support-list">
      {threads.map((thread) => {
        const tone = STATUS_LABEL[thread.status] ?? STATUS_LABEL.OPEN;
        return (
          <li key={thread.id} className="support-list__item">
            <Link
              href={`${basePath}/${thread.id}`}
              className="support-list__link"
            >
              <div className="support-list__head">
                <span className="support-list__subject">{thread.subject}</span>
                <Tag color={tone.color}>{tone.label}</Tag>
              </div>
              {thread.lastMessage && (
                <p className="support-list__excerpt">{thread.lastMessage}</p>
              )}
              <div className="support-list__meta">
                {showAuthor && (
                  <span>{thread.authorName ?? 'Colaborador'}</span>
                )}
                <span>
                  {thread.messageCount}{' '}
                  {thread.messageCount === 1 ? 'mensaje' : 'mensajes'}
                </span>
                <span>
                  {new Date(thread.updatedAt).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
