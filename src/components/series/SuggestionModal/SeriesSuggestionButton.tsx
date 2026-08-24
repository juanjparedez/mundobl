'use client';

import { useState } from 'react';
import { Button, Modal, Select, Input, Tooltip } from 'antd';
import { BulbOutlined, SendOutlined } from '@ant-design/icons';
import { useSession, signIn } from 'next-auth/react';
import { useMessage } from '@/hooks/useMessage';
import './SuggestionModal.css';

const { TextArea } = Input;
const { Option } = Select;

interface SeriesSuggestionButtonProps {
  seriesId: number;
  seriesTitle: string;
}

export function SeriesSuggestionButton({
  seriesId,
  seriesTitle,
}: SeriesSuggestionButtonProps) {
  const { data: session } = useSession();
  const message = useMessage();

  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('DATO_FALTANTE');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      message.warning('Por favor escribe el detalle de tu sugerencia.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/series/${seriesId}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar sugerencia');
      }

      message.success(
        '¡Gracias por tu aporte! Los administradores revisarán los datos para enriquecer la ficha.'
      );
      setContent('');
      setType('DATO_FALTANTE');
      setIsOpen(false);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Error al enviar la sugerencia'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Tooltip title="Sugerir dato o corrección para esta serie">
        <button
          type="button"
          className="series-quick-actions__item series-suggestion-btn"
          aria-label="Sugerir dato o corrección"
          onClick={() => setIsOpen(true)}
        >
          <BulbOutlined />
        </button>
      </Tooltip>

      <Modal
        title={
          <span>
            💡 Sugerir información para <strong>{seriesTitle}</strong>
          </span>
        }
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        footer={null}
        maskClosable={false}
        destroyOnHidden
      >
        <p className="suggestion-modal__desc">
          ¿Notaste algún dato faltante o corrección necesaria? Tu aporte ayuda a
          mantener el catálogo actualizado para toda la comunidad.
        </p>

        {!session?.user ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
              Inicia sesión para enviar una sugerencia a los administradores.
            </p>
            <Button type="primary" onClick={() => signIn('google')}>
              Iniciar sesión
            </Button>
          </div>
        ) : (
          <div className="suggestion-modal__form">
            <div className="suggestion-modal__field">
              <label className="suggestion-modal__label">Tipo de aporte:</label>
              <Select value={type} onChange={setType} style={{ width: '100%' }}>
                <Option value="DATO_FALTANTE">
                  📌 Dato faltante (año, país, sinopsis)
                </Option>
                <Option value="CORRECCION_REPARTO">
                  🎭 Corrección de actores / personajes
                </Option>
                <Option value="DIAS_EMISION">
                  📅 Días de emisión o calendario
                </Option>
                <Option value="LINK_OFICIAL">
                  🔗 Link oficial de emisión (YouTube, WeTV, etc.)
                </Option>
                <Option value="OTRO">💬 Otra corrección o información</Option>
              </Select>
            </div>

            <div className="suggestion-modal__field">
              <label className="suggestion-modal__label">
                Detalle de la sugerencia:
              </label>
              <TextArea
                rows={4}
                placeholder="Escribe aquí los datos correctos, links o detalles que quieras aportar..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={1000}
                showCount
                className="suggestion-modal__textarea"
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 8,
              }}
            >
              <Button onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmit}
                loading={isSubmitting}
              >
                Enviar sugerencia
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
