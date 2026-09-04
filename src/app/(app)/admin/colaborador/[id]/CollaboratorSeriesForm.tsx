'use client';

import { useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Upload,
  Tag,
  Table,
  Typography,
} from 'antd';
import {
  UploadOutlined,
  SaveOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { SeriesInfoBlocksManager } from '@/components/admin/SeriesInfoBlocksManager/SeriesInfoBlocksManager';
import { useMessage } from '@/hooks/useMessage';
import './collaborator-form.css';

const TYPE_OPTIONS = [
  { value: 'serie', label: 'Serie' },
  { value: 'pelicula', label: 'Pelicula' },
  { value: 'corto', label: 'Corto' },
  { value: 'especial', label: 'Especial' },
];

const COUNTRY_OPTIONS = [
  { value: 'TH', label: 'Tailandia' },
  { value: 'KR', label: 'Corea del Sur' },
  { value: 'JP', label: 'Japon' },
  { value: 'CN', label: 'China' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'PH', label: 'Filipinas' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'MY', label: 'Malasia' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'ES', label: 'España' },
];

const VISIBILITY_LABELS: Record<string, string> = {
  VISIBLE: 'Publicada en /ver',
  HIDDEN: 'Oculta por un admin — contactá a MundoBL si no sabés por que',
  PENDING_REVIEW: 'En revision',
  REJECTED: 'Rechazada',
};

interface SeriesFormData {
  id: number;
  title: string;
  originalTitle: string | null;
  year: number | null;
  type: string;
  synopsis: string | null;
  imageUrl: string | null;
  countryCode: string | null;
  productionCompanyName: string | null;
  actorNames: string[];
  tagNames: string[];
  genreNames: string[];
  visibility: string;
}

interface SeasonSummary {
  seasonNumber: number;
  episodes: {
    id: number;
    episodeNumber: number;
    title: string | null;
    hasEmbed: boolean;
  }[];
}

interface Props {
  series: SeriesFormData;
  seasons: SeasonSummary[];
}

export function CollaboratorSeriesForm({ series, seasons }: Props) {
  const message = useMessage();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(series.imageUrl);

  const totalEpisodes = seasons.reduce((acc, s) => acc + s.episodes.length, 0);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al subir la imagen');
      }
      const data = await res.json();
      setImageUrl(data.url);
      message.success('Imagen subida');
    } catch (e) {
      message.error(
        e instanceof Error ? e.message : 'Error al subir la imagen'
      );
    } finally {
      setUploading(false);
    }
    return false;
  }

  async function handleSave(values: {
    title: string;
    originalTitle?: string;
    year?: number;
    type: string;
    synopsis?: string;
    countryCode?: string;
    productionCompanyName?: string;
    actorNames?: string[];
    tagNames?: string[];
    genreNames?: string[];
  }) {
    setSaving(true);
    try {
      const res = await fetch(`/api/colaborador/series/${series.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          originalTitle: values.originalTitle || null,
          year: values.year ?? null,
          type: values.type,
          synopsis: values.synopsis || null,
          imageUrl,
          countryCode: values.countryCode || null,
          productionCompanyName: values.productionCompanyName || null,
          actorNames: values.actorNames || [],
          tagNames: values.tagNames || [],
          genreNames: values.genreNames || [],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      message.success('Ficha guardada');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHero
        title={series.title}
        subtitle={VISIBILITY_LABELS[series.visibility] ?? series.visibility}
      />

      <div className="colaborador-form">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            title: series.title,
            originalTitle: series.originalTitle ?? undefined,
            year: series.year ?? undefined,
            type: series.type,
            synopsis: series.synopsis ?? undefined,
            countryCode: series.countryCode ?? undefined,
            productionCompanyName: series.productionCompanyName ?? undefined,
            actorNames: series.actorNames,
            tagNames: series.tagNames,
            genreNames: series.genreNames,
          }}
          onFinish={handleSave}
        >
          <h2 className="colaborador-form__section-title">Datos de la ficha</h2>

          <Form.Item
            name="title"
            label="Titulo"
            rules={[{ required: true, message: 'El titulo es requerido' }]}
          >
            <Input size="large" />
          </Form.Item>

          <div className="collaborator-form__row">
            <Form.Item name="originalTitle" label="Titulo original">
              <Input />
            </Form.Item>
            <Form.Item name="year" label="Año">
              <InputNumber style={{ width: '100%' }} min={1990} max={2100} />
            </Form.Item>
            <Form.Item name="type" label="Tipo">
              <Select options={TYPE_OPTIONS} />
            </Form.Item>
          </div>

          <Form.Item name="synopsis" label="Sinopsis">
            <Input.TextArea rows={4} maxLength={2000} showCount />
          </Form.Item>

          <Form.Item label="Poster">
            {imageUrl && (
              <div
                className="collaborator-form__poster"
                style={{ backgroundImage: `url(${imageUrl})` }}
              />
            )}
            <div>
              <Upload showUploadList={false} beforeUpload={handleUpload}>
                <Button icon={<UploadOutlined />} loading={uploading}>
                  {imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
                </Button>
              </Upload>
            </div>
          </Form.Item>

          <div className="collaborator-form__row">
            <Form.Item name="countryCode" label="Pais">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={COUNTRY_OPTIONS}
              />
            </Form.Item>
            <Form.Item name="productionCompanyName" label="Productora">
              <Input placeholder="Ej: XUXY" />
            </Form.Item>
          </div>

          <Form.Item
            name="actorNames"
            label="Actores"
            help="Escribi un nombre y presiona Enter para agregarlo."
          >
            <Select
              mode="tags"
              tokenSeparators={[',']}
              placeholder="Ej: Bible Wichapas"
            />
          </Form.Item>
          <Form.Item name="tagNames" label="Tropes / tags">
            <Select
              mode="tags"
              tokenSeparators={[',']}
              placeholder="Ej: Enemy to lovers"
            />
          </Form.Item>
          <Form.Item name="genreNames" label="Generos">
            <Select mode="tags" tokenSeparators={[',']} placeholder="Ej: BL" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={saving}
            >
              Guardar ficha
            </Button>
          </Form.Item>
        </Form>

        <div className="colaborador-episodes-summary">
          <Typography.Text>
            {seasons.length} temporada(s) · {totalEpisodes} episodio(s)
            embebidos
          </Typography.Text>
          <Link href="/admin/colaborador/importar">
            <Button icon={<CloudUploadOutlined />}>
              Importar mas episodios
            </Button>
          </Link>
        </div>

        {seasons.length > 0 && (
          <Table
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            dataSource={seasons.flatMap((s) =>
              s.episodes.map((e) => ({ ...e, seasonNumber: s.seasonNumber }))
            )}
            columns={[
              { title: 'Temp.', dataIndex: 'seasonNumber', width: 70 },
              { title: 'EP', dataIndex: 'episodeNumber', width: 70 },
              { title: 'Titulo', dataIndex: 'title' },
              {
                title: 'Embed',
                dataIndex: 'hasEmbed',
                width: 100,
                render: (v: boolean) => (
                  <Tag color={v ? 'green' : 'default'}>
                    {v ? 'OK' : 'Sin video'}
                  </Tag>
                ),
              },
            ]}
          />
        )}
      </div>

      <div className="colaborador-form">
        <h2 className="colaborador-form__section-title">
          Bloques de informacion adicional
        </h2>
        <SeriesInfoBlocksManager seriesId={series.id} />
      </div>
    </>
  );
}
