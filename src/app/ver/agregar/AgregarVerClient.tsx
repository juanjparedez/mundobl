'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, Button, Input, InputNumber, Select, Tag, Form } from 'antd';
import {
  LinkOutlined,
  RobotOutlined,
  PlayCircleFilled,
  SearchOutlined,
  CheckCircleFilled,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
// Importamos del modulo "-shared" porque user-embed-preview.ts trae
// `prisma` (cache) que no compila en client bundle ("Module not found: tls"
// via pg). El shared solo tiene types + constants.
import type {
  EmbedPreview,
  AllowedCountryCode,
} from '@/lib/user-embed-preview-shared';
import { ALLOWED_COUNTRY_CODES } from '@/lib/user-embed-preview-shared';

interface CatalogSearchResult {
  id: number;
  title: string;
  originalTitle: string | null;
  imageUrl: string | null;
  year: number | null;
  type: string;
  country: { name: string; code: string | null } | null;
}

const TYPE_OPTIONS = [
  { value: 'serie', label: 'Serie' },
  { value: 'pelicula', label: 'Pelicula' },
  { value: 'corto', label: 'Corto' },
  { value: 'especial', label: 'Especial' },
] as const;

const COUNTRY_LABEL: Record<AllowedCountryCode, string> = {
  TH: 'Tailandia',
  KR: 'Corea del Sur',
  JP: 'Japon',
  CN: 'China',
  TW: 'Taiwan',
  PH: 'Filipinas',
  VN: 'Vietnam',
  ID: 'Indonesia',
  MY: 'Malasia',
  HK: 'Hong Kong',
};

interface FormValues {
  url: string;
  title: string;
  originalTitle?: string;
  year?: number | null;
  type: 'serie' | 'pelicula' | 'corto' | 'especial';
  countryCode?: AllowedCountryCode | null;
  synopsis?: string;
  actorNames?: string[];
  productionCompanyName?: string;
  originalLanguageName?: string;
  dubbingLanguageNames?: string[];
  tagNames?: string[];
  genreNames?: string[];
  episodeNumber: number;
  episodeTitle?: string;
  seasonNumber: number;
}

export function AgregarVerClient() {
  const router = useRouter();
  const message = useMessage();
  const [form] = Form.useForm<FormValues>();
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<EmbedPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Catalog linking state — el user puede asociar el aporte con una serie
  // CURATED ya existente del catalogo. Ambas conviven; el link genera
  // badges bidireccionales (esta serie tambien en /ver / esta serie tambien
  // en /catalogo).
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [linkSearchResults, setLinkSearchResults] = useState<
    CatalogSearchResult[]
  >([]);
  const [linkSearchLoading, setLinkSearchLoading] = useState(false);
  const [linkedSeries, setLinkedSeries] = useState<CatalogSearchResult | null>(
    null
  );

  async function handleSearchCatalog(query: string) {
    const q = query.trim();
    if (!q) {
      setLinkSearchResults([]);
      return;
    }
    setLinkSearchLoading(true);
    try {
      const res = await fetch(`/api/series/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        setLinkSearchResults([]);
        return;
      }
      const data = (await res.json()) as CatalogSearchResult[];
      setLinkSearchResults(data);
    } catch {
      setLinkSearchResults([]);
    } finally {
      setLinkSearchLoading(false);
    }
  }

  async function handleLoadPreview() {
    const trimmed = url.trim();
    if (!trimmed) {
      message.warning('Pegá primero la URL del video.');
      return;
    }
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/user/series/embed/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (res.status === 409 && data.existingSeriesId) {
        message.info('Esta serie ya esta cargada. Te llevo a su pagina.');
        router.push(`/ver/${data.existingSeriesId}`);
        return;
      }
      if (!res.ok) {
        message.error(data.error || 'No se pudo cargar la preview.');
        return;
      }
      const p = data as EmbedPreview;
      setPreview(p);
      form.setFieldsValue({
        url: trimmed,
        title: p.suggested.title,
        originalTitle: p.suggested.originalTitle ?? undefined,
        year: p.suggested.year ?? null,
        type: 'serie',
        countryCode: p.suggested.countryCode ?? null,
        synopsis: p.suggested.synopsis ?? undefined,
        actorNames: p.suggested.actorNames,
        productionCompanyName: p.suggested.productionCompanyName ?? undefined,
        originalLanguageName: p.suggested.originalLanguageName ?? undefined,
        dubbingLanguageNames: p.suggested.dubbingLanguageNames,
        tagNames: p.suggested.tagNames,
        genreNames: p.suggested.genreNames,
        episodeNumber: 1,
        episodeTitle: p.source.rawTitle ?? undefined,
        seasonNumber: 1,
      });
      if (p.warnings.length > 0) {
        message.warning(p.warnings[0]);
      } else {
        message.success(
          `Preview cargada (confianza: ${p.suggested.confidence}).`
        );
      }
      // Disparar busqueda inicial en el catalogo con el titulo sugerido
      // — el user ve match potenciales sin tener que tipear.
      setLinkedSeries(null);
      setLinkSearchQuery(p.suggested.title);
      void handleSearchCatalog(p.suggested.title);
    } catch (err) {
      console.error(err);
      message.error('Error al cargar la preview.');
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleSubmit(values: FormValues) {
    if (!preview) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/user/series/embed/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: values.url,
          series: {
            title: values.title,
            originalTitle: values.originalTitle ?? null,
            year: values.year ?? null,
            type: values.type,
            countryCode: values.countryCode ?? null,
            synopsis: values.synopsis ?? null,
            actorNames: values.actorNames ?? [],
            productionCompanyName: values.productionCompanyName ?? null,
            originalLanguageName: values.originalLanguageName ?? null,
            dubbingLanguageNames: values.dubbingLanguageNames ?? [],
            tagNames: values.tagNames ?? [],
            genreNames: values.genreNames ?? [],
            linkedSeriesId: linkedSeries?.id ?? null,
          },
          episode: {
            episodeNumber: values.episodeNumber,
            title: values.episodeTitle ?? null,
            seasonNumber: values.seasonNumber,
            channelName: preview.source.channelName,
            channelUrl: preview.source.channelUrl,
          },
        }),
      });
      const data = await res.json();
      if (res.status === 409 && data.existingSeriesId) {
        message.info(data.error || 'Ya existe.');
        router.push(`/ver/${data.existingSeriesId}`);
        return;
      }
      if (res.status === 429) {
        message.error(data.error || 'Demasiados aportes. Esperá un rato.');
        return;
      }
      if (!res.ok) {
        message.error(data.error || 'No se pudo guardar.');
        return;
      }
      message.success('Serie agregada a /ver.');
      router.push(`/ver/${data.seriesId}`);
    } catch (err) {
      console.error(err);
      message.error('Error al confirmar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ver-agregar-content">
      <header className="ver-agregar-hero">
        <h1 className="ver-agregar-hero__title">
          <PlayCircleFilled /> Agregar serie embebida
        </h1>
        <p className="ver-agregar-hero__subtitle">
          Pegá la URL de un canal oficial (YouTube, Vimeo, Bilibili,
          Dailymotion) y la IA autocompleta el resto. Aparece en /ver al
          instante.
        </p>
      </header>

      <Alert
        type="info"
        showIcon
        message="Solo plataformas con embed legal"
        description={
          <span>
            Aceptamos URLs de canales oficiales que permiten incrustación. Si la
            productora no se aprueba el embed, el contenido no podrá
            reproducirse acá. <Link href="/legal">Ver aviso completo</Link>.
          </span>
        }
      />

      <div className="ver-agregar-paste">
        <Input
          allowClear
          size="large"
          prefix={<LinkOutlined />}
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPressEnter={handleLoadPreview}
          disabled={loadingPreview}
        />
        <Button
          type="primary"
          size="large"
          icon={<RobotOutlined />}
          loading={loadingPreview}
          onClick={handleLoadPreview}
        >
          Cargar preview con IA
        </Button>
      </div>

      {preview && (
        <div className="ver-agregar-preview">
          <div className="ver-agregar-preview__source">
            {preview.source.thumbnailUrl && (
              <img
                src={preview.source.thumbnailUrl}
                alt={preview.source.rawTitle ?? 'thumbnail'}
                width={240}
                height={135}
                loading="lazy"
              />
            )}
            <div className="ver-agregar-preview__meta">
              <Tag color="blue">{preview.source.platform}</Tag>
              {preview.source.channelName && (
                <span>
                  Canal: <strong>{preview.source.channelName}</strong>
                </span>
              )}
              <Tag color={confidenceColor(preview.suggested.confidence)}>
                Confianza IA: {preview.suggested.confidence}
              </Tag>
            </div>
          </div>

          {preview.warnings.length > 0 && (
            <Alert
              className="ver-agregar-warnings"
              type="warning"
              showIcon
              message="Revisá los datos antes de confirmar"
              description={
                // Si es un solo warning, render plano (sin bullet con
                // indent que con 1 sola entry se ve desprolijo). Si son
                // varios, lista no-marker con padding cero — los warnings
                // ya son frases completas, el bullet no aporta info.
                preview.warnings.length === 1 ? (
                  <span>{preview.warnings[0]}</span>
                ) : (
                  <ul className="ver-agregar-warnings__list">
                    {preview.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                )
              }
            />
          )}

          {/* Asociacion con catalogo: el user puede vincular este aporte
           * con una serie CURATED ya existente. Ambas conviven; el link
           * permite badges bidireccionales en /ver y /catalogo. */}
          <section className="ver-agregar-link-catalog">
            <header className="ver-agregar-link-catalog__head">
              <LinkOutlined />
              <h3>¿Esta serie ya está en el catálogo?</h3>
            </header>
            <p className="ver-agregar-link-catalog__hint">
              Si la encontrás, asocialá: van a quedar vinculadas pero como
              entidades separadas (tu aporte en /ver, la curada en /catalogo).
              Si es una serie nueva o no la encontrás, dejá sin asociar.
            </p>

            {linkedSeries ? (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleFilled />}
                message={
                  <span>
                    Asociada con <strong>{linkedSeries.title}</strong>
                    {linkedSeries.year ? ` (${linkedSeries.year})` : ''}
                  </span>
                }
                description={
                  <span>
                    Cuando confirmes, esta entrada de /ver quedará linkeada a{' '}
                    <Link href={`/series/${linkedSeries.id}`} target="_blank">
                      {linkedSeries.title} en el catálogo
                    </Link>
                    .
                  </span>
                }
                action={
                  <Button
                    size="small"
                    icon={<CloseCircleOutlined />}
                    onClick={() => setLinkedSeries(null)}
                  >
                    Desvincular
                  </Button>
                }
              />
            ) : (
              <>
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="Buscar en el catálogo por título..."
                  value={linkSearchQuery}
                  onChange={(e) => {
                    setLinkSearchQuery(e.target.value);
                    void handleSearchCatalog(e.target.value);
                  }}
                  allowClear
                />
                {linkSearchLoading ? (
                  <p className="ver-agregar-link-catalog__loading">
                    Buscando...
                  </p>
                ) : linkSearchResults.length === 0 && linkSearchQuery.trim() ? (
                  <p className="ver-agregar-link-catalog__empty">
                    Sin coincidencias en el catálogo. Si la serie es nueva,
                    seguí sin asociar.
                  </p>
                ) : (
                  <ul className="ver-agregar-link-catalog__results">
                    {linkSearchResults.map((s) => (
                      <li
                        key={s.id}
                        className="ver-agregar-link-catalog__result"
                      >
                        {s.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.imageUrl}
                            alt=""
                            width={42}
                            height={60}
                            loading="lazy"
                          />
                        ) : (
                          <span className="ver-agregar-link-catalog__result-placeholder">
                            🎬
                          </span>
                        )}
                        <div className="ver-agregar-link-catalog__result-info">
                          <span className="ver-agregar-link-catalog__result-title">
                            {s.title}
                          </span>
                          <span className="ver-agregar-link-catalog__result-meta">
                            {s.year ?? '—'}
                            {s.country?.name ? ` · ${s.country.name}` : ''}
                            {' · '}
                            {s.type}
                          </span>
                        </div>
                        <Button
                          size="small"
                          type="primary"
                          icon={<LinkOutlined />}
                          onClick={() => setLinkedSeries(s)}
                        >
                          Asociar
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="ver-agregar-form"
          >
            <Form.Item name="url" hidden>
              <Input />
            </Form.Item>

            <div className="ver-agregar-form__grid">
              <Form.Item
                label="Titulo"
                name="title"
                rules={[{ required: true, max: 200 }]}
              >
                <Input />
              </Form.Item>
              <Form.Item label="Titulo original" name="originalTitle">
                <Input />
              </Form.Item>
              <Form.Item label="Año" name="year">
                <InputNumber min={1990} max={2030} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Tipo" name="type" initialValue="serie">
                <Select options={[...TYPE_OPTIONS]} />
              </Form.Item>
              <Form.Item label="Pais" name="countryCode">
                <Select
                  allowClear
                  options={ALLOWED_COUNTRY_CODES.map((c) => ({
                    value: c,
                    label: COUNTRY_LABEL[c],
                  }))}
                />
              </Form.Item>
              <Form.Item label="Productora" name="productionCompanyName">
                <Input />
              </Form.Item>
              <Form.Item label="Idioma original" name="originalLanguageName">
                <Input placeholder="Tailandes, Coreano..." />
              </Form.Item>
              <Form.Item label="Doblajes / Subs" name="dubbingLanguageNames">
                <Select
                  mode="tags"
                  tokenSeparators={[',']}
                  placeholder="Ej: Espanol, Ingles"
                />
              </Form.Item>
            </div>

            <Form.Item label="Sinopsis" name="synopsis">
              <Input.TextArea rows={4} maxLength={2000} showCount />
            </Form.Item>

            <Form.Item label="Cast principal" name="actorNames">
              <Select
                mode="tags"
                tokenSeparators={[',']}
                placeholder="Ej: Bright Vachirawit, Win Metawin"
              />
            </Form.Item>

            <div className="ver-agregar-form__grid">
              <Form.Item label="Tags" name="tagNames">
                <Select
                  mode="tags"
                  tokenSeparators={[',']}
                  placeholder="Ej: Universitarios, Slow burn"
                />
              </Form.Item>
              <Form.Item label="Generos" name="genreNames">
                <Select
                  mode="tags"
                  tokenSeparators={[',']}
                  placeholder="Ej: Romance, Drama"
                />
              </Form.Item>
            </div>

            <div className="ver-agregar-form__grid">
              <Form.Item
                label="Episodio #"
                name="episodeNumber"
                initialValue={1}
                rules={[{ required: true, type: 'number', min: 1 }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                label="Temporada #"
                name="seasonNumber"
                initialValue={1}
                rules={[{ required: true, type: 'number', min: 1 }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Titulo del episodio" name="episodeTitle">
                <Input />
              </Form.Item>
            </div>

            <div className="ver-agregar-form__actions">
              <Button onClick={() => setPreview(null)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Confirmar y publicar en /ver
              </Button>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
}

function confidenceColor(c: 'high' | 'medium' | 'low'): string {
  if (c === 'high') return 'green';
  if (c === 'medium') return 'orange';
  return 'red';
}
