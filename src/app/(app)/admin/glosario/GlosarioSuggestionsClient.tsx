'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { AdminNav } from '../AdminNav';
import { PageTitleClient } from '@/components/common/PageTitle/PageTitleClient';
import '../admin.css';
import { DataTable } from '@/components/design-system';

export interface GlossarySuggestionItem {
  id: number;
  term: string;
  transliteration: string | null;
  country: string;
  category: string;
  meaning: string;
  context: string;
  examples: string | null;
  commonMistake: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  notes: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    nickname: string | null;
    image: string | null;
  } | null;
}

export interface GlossaryTagOption {
  id: number;
  name: string;
  category: string | null;
}

interface Props {
  initialSuggestions: GlossarySuggestionItem[];
  tags: GlossaryTagOption[];
}

// Lo que el moderador esta por resolver. Aprobar y rechazar pasan por el
// mismo modal porque en los dos casos hay algo que escribir: tags en uno,
// el motivo en el otro — y ese motivo le llega al autor como notificacion.
interface ReviewDraft {
  item: GlossarySuggestionItem;
  action: 'APPROVED' | 'REJECTED';
}

export function GlosarioSuggestionsClient({ initialSuggestions, tags }: Props) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [review, setReview] = useState<ReviewDraft | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [adminNotes, setAdminNotes] = useState('');

  const tagOptions = tags.map((tag) => ({
    value: tag.id,
    label: tag.category ? `${tag.name} · ${tag.category}` : tag.name,
  }));

  const openReview = (
    item: GlossarySuggestionItem,
    action: 'APPROVED' | 'REJECTED'
  ) => {
    setReview({ item, action });
    setSelectedTagIds([]);
    setAdminNotes(item.adminNotes ?? '');
  };

  const closeReview = () => {
    setReview(null);
    setSelectedTagIds([]);
    setAdminNotes('');
  };

  const confirmReview = async () => {
    if (!review) return;
    const { item, action } = review;
    setUpdatingId(item.id);
    try {
      const response = await fetch(
        `/api/admin/glossary-suggestions/${item.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: action,
            adminNotes,
            // Los tags solo tienen sentido si el termino se publica.
            ...(action === 'APPROVED' ? { tagIds: selectedTagIds } : {}),
          }),
        }
      );
      if (!response.ok) throw new Error('No se pudo actualizar la sugerencia.');
      setSuggestions((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: action,
                adminNotes: adminNotes.trim() || null,
              }
            : entry
        )
      );
      message.success(
        action === 'APPROVED'
          ? 'Término aprobado y publicado. Se le avisó a quien lo propuso.'
          : 'Sugerencia rechazada. Se le avisó a quien la propuso.'
      );
      closeReview();
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : 'Error al actualizar.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered =
    statusFilter === 'ALL'
      ? suggestions
      : suggestions.filter((suggestion) => suggestion.status === statusFilter);

  return (
    <>
      <AdminNav />
      <main className="admin-content">
        <PageTitleClient level={1}>Sugerencias del glosario</PageTitleClient>
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <Typography.Text strong>Estado</Typography.Text>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: 'Todas' },
                { value: 'PENDING', label: 'Pendientes' },
                { value: 'APPROVED', label: 'Aprobadas' },
                { value: 'REJECTED', label: 'Rechazadas' },
              ]}
            />
          </Space>
          <DataTable
            rowKey="id"
            dataSource={filtered}
            scrollX={900}
            expandable={{
              rowExpandable: (item) =>
                Boolean(
                  item.examples ||
                  item.commonMistake ||
                  item.sourceName ||
                  item.sourceUrl ||
                  item.notes
                ),
              expandedRowRender: (item) => (
                <Space direction="vertical" size="small">
                  {item.examples && (
                    <div>
                      <strong>Ejemplos:</strong> {item.examples}
                    </div>
                  )}
                  {item.commonMistake && (
                    <div>
                      <strong>Error común de traducción:</strong>{' '}
                      {item.commonMistake}
                    </div>
                  )}
                  {(item.sourceName || item.sourceUrl) && (
                    <div>
                      <strong>Fuente:</strong>{' '}
                      {item.sourceUrl ? (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.sourceName || item.sourceUrl}
                        </a>
                      ) : (
                        item.sourceName
                      )}
                    </div>
                  )}
                  {item.notes && (
                    <div>
                      <strong>Nota de quien sugirió:</strong> {item.notes}
                    </div>
                  )}
                </Space>
              ),
            }}
            columns={[
              {
                title: 'Término',
                key: 'term',
                render: (_: unknown, item: GlossarySuggestionItem) => (
                  <div>
                    <strong>{item.term}</strong>
                    {item.transliteration && <div>{item.transliteration}</div>}
                    <Tag>{item.country}</Tag> <Tag>{item.category}</Tag>
                  </div>
                ),
              },
              { title: 'Significado', dataIndex: 'meaning', key: 'meaning' },
              { title: 'Contexto', dataIndex: 'context', key: 'context' },
              {
                title: 'Estado',
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => (
                  <Tag
                    color={
                      status === 'APPROVED'
                        ? 'green'
                        : status === 'REJECTED'
                          ? 'red'
                          : 'gold'
                    }
                  >
                    {status}
                  </Tag>
                ),
              },
              {
                title: 'Acciones',
                key: 'actions',
                render: (_: unknown, item: GlossarySuggestionItem) =>
                  item.status === 'PENDING' && (
                    <Space>
                      <Button
                        loading={updatingId === item.id}
                        icon={<CheckOutlined />}
                        onClick={() => openReview(item, 'APPROVED')}
                      >
                        Aprobar
                      </Button>
                      <Button
                        danger
                        loading={updatingId === item.id}
                        icon={<CloseOutlined />}
                        onClick={() => openReview(item, 'REJECTED')}
                      >
                        Rechazar
                      </Button>
                    </Space>
                  ),
              },
            ]}
          />
        </Card>
      </main>

      <Modal
        open={review !== null}
        title={
          review?.action === 'APPROVED'
            ? `Aprobar "${review.item.term}"`
            : review
              ? `Rechazar "${review.item.term}"`
              : ''
        }
        okText={
          review?.action === 'APPROVED' ? 'Aprobar y publicar' : 'Rechazar'
        }
        okButtonProps={{ danger: review?.action === 'REJECTED' }}
        cancelText="Cancelar"
        confirmLoading={updatingId === review?.item.id}
        onOk={confirmReview}
        onCancel={closeReview}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {review?.action === 'APPROVED' && (
            <div>
              <Typography.Text strong>Etiquetas del término</Typography.Text>
              <Select
                mode="multiple"
                allowClear
                style={{ width: '100%', marginTop: 8 }}
                placeholder="Sin etiquetas"
                value={selectedTagIds}
                onChange={setSelectedTagIds}
                options={tagOptions}
                optionFilterProp="label"
              />
              <Typography.Text type="secondary">
                Son las mismas etiquetas del catálogo: filtran el término en
                /glosario.
              </Typography.Text>
            </div>
          )}
          <div>
            <Typography.Text strong>
              {review?.action === 'APPROVED'
                ? 'Nota interna (opcional)'
                : 'Motivo del rechazo'}
            </Typography.Text>
            <Input.TextArea
              rows={3}
              style={{ marginTop: 8 }}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={
                review?.action === 'APPROVED'
                  ? 'Queda guardada en la sugerencia.'
                  : 'Se lo mandamos a quien propuso el término.'
              }
            />
            {review?.action === 'REJECTED' && (
              <Typography.Text type="secondary">
                Si lo dejás vacío se envía un mensaje genérico invitando a
                proponerlo de nuevo.
              </Typography.Text>
            )}
          </div>
        </Space>
      </Modal>
    </>
  );
}
