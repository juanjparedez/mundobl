'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Space,
  AutoComplete,
  Upload,
  Alert,
  Checkbox,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  MinusCircleOutlined,
  SaveOutlined,
  CloseOutlined,
  EditOutlined,
  UploadOutlined,
  StarOutlined,
  StarFilled,
  ExclamationCircleOutlined,
} from '@ant-design/icons/lib/icons';
import Link from 'next/link';
import { shouldShowSeasons, getContentTypeConfig } from '@/types/content';
import './SeriesForm.css';
import { useMessage, useModal } from '@/hooks/useMessage';
import {
  SeriesContentManager,
  type PendingContentItem,
} from './SeriesContentManager/SeriesContentManager';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';

const { Option } = Select;
const { TextArea } = Input;

interface SeriesFormInitialData {
  id?: number;
  title?: string;
  type?: string;
  [key: string]: unknown;
}

interface UniverseOption {
  id: number;
  name: string;
}

interface SeriesFormProps {
  initialData?: SeriesFormInitialData;
  mode: 'create' | 'edit';
}

// Picker dimensions and card aspect ratio
const PICKER_W = 280;
const PICKER_H = 210;
const CARD_ASPECT = 160 / 140; // height/width of catalog card

function parsePosition(pos: string): { x: number; y: number } {
  const keywords: Record<string, { x: number; y: number }> = {
    'top left': { x: 0, y: 0 },
    'top center': { x: 50, y: 0 },
    'top right': { x: 100, y: 0 },
    'center left': { x: 0, y: 50 },
    center: { x: 50, y: 50 },
    'center right': { x: 100, y: 50 },
    'bottom left': { x: 0, y: 100 },
    'bottom center': { x: 50, y: 100 },
    'bottom right': { x: 100, y: 100 },
  };
  if (keywords[pos]) return keywords[pos];
  const parts = pos.split(/\s+/);
  return {
    x: parseInt(parts[0]) || 50,
    y: parseInt(parts[1]) || 50,
  };
}

function ImagePositionSelector({
  value,
  onChange,
  imageUrl,
}: {
  value?: string;
  onChange?: (value: string) => void;
  imageUrl?: string;
}) {
  const current = value || '50% 50%';
  const { x, y } = parsePosition(current);
  const pickerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Viewport size: proportional to card aspect within picker
  const vpW = PICKER_W * 0.35;
  const vpH = vpW * CARD_ASPECT;

  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      const rect = pickerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const relX = clientX - rect.left;
      const relY = clientY - rect.top;
      const newX = clamp(Math.round((relX / rect.width) * 100), 0, 100);
      const newY = clamp(Math.round((relY / rect.height) * 100), 0, 100);
      onChange?.(`${newX}% ${newY}%`);
    },
    [onChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      updatePosition(e.clientX, e.clientY);
    },
    [updatePosition]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      updatePosition(e.clientX, e.clientY);
    };
    const handleMouseUp = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [updatePosition]);

  // Viewport position (clamped so it stays within picker bounds)
  const vpLeft = clamp((x / 100) * PICKER_W - vpW / 2, 0, PICKER_W - vpW);
  const vpTop = clamp((y / 100) * PICKER_H - vpH / 2, 0, PICKER_H - vpH);

  return (
    <div className="image-position-selector">
      <div className="image-position-picker-row">
        <div
          ref={pickerRef}
          className="image-position-picker"
          onMouseDown={handleMouseDown}
          style={{
            width: PICKER_W,
            height: PICKER_H,
            backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div
            className="image-position-viewport"
            style={{
              left: vpLeft,
              top: vpTop,
              width: vpW,
              height: vpH,
            }}
          />
        </div>

        <div className="image-position-preview-wrapper">
          <span className="image-position-preview-label">Preview card</span>
          <div
            className="image-position-preview-card"
            style={{
              backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: current,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function SeriesForm({ initialData, mode }: SeriesFormProps) {
  const message = useMessage();
  const modal = useModal();
  const { t } = useLocale();
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('serie');

  // Datos para autocompletado
  const [countries, setCountries] = useState<
    Array<{ name: string; code: string | null }>
  >([]);
  const [actors, setActors] = useState<string[]>([]);
  const [directors, setDirectors] = useState<string[]>([]);
  const [universes, setUniverses] = useState<UniverseOption[]>([]);
  const [newUniverseModalOpen, setNewUniverseModalOpen] = useState(false);
  const [newUniverseName, setNewUniverseName] = useState('');
  const [newUniverseDescription, setNewUniverseDescription] = useState('');
  const [creatingUniverse, setCreatingUniverse] = useState(false);
  const [productionCompanies, setProductionCompanies] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [basedOnOptions, setBasedOnOptions] = useState<string[]>([]);
  const [pendingContent, setPendingContent] = useState<PendingContentItem[]>(
    []
  );
  const [relatedSeriesOptions, setRelatedSeriesOptions] = useState<
    Array<{ id: number; title: string; year: number | null; type: string }>
  >([]);
  const [searchingRelated, setSearchingRelated] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [uploading, setUploading] = useState(false);
  const imageUrl = Form.useWatch('imageUrl', form);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && initialData?.id) {
      fetch(`/api/series/${initialData.id}/favorite`)
        .then((res) => (res.ok ? res.json() : { isFavorite: false }))
        .then((data) => setIsFavorite(data.isFavorite))
        .catch(() => {});
    }
  }, [mode, initialData?.id]);

  const loadFormData = useCallback(async () => {
    try {
      // Cargar países
      const countriesRes = await fetch('/api/countries');
      const countriesData = await countriesRes.json();
      setCountries(
        countriesData.map((c: { name: string; code: string | null }) => ({
          name: c.name,
          code: c.code,
        }))
      );

      // Cargar actores
      const actorsRes = await fetch('/api/actors');
      const actorsData = await actorsRes.json();
      setActors(actorsData.map((a: { name: string }) => a.name));

      // Cargar directores
      const directorsRes = await fetch('/api/directors');
      const directorsData = await directorsRes.json();
      setDirectors(directorsData.map((d: { name: string }) => d.name));

      // Cargar universos
      const universesRes = await fetch('/api/universes');
      const universesData = await universesRes.json();
      setUniverses(universesData);

      // Cargar productoras (solo nombres para autocomplete)
      const prodRes = await fetch('/api/production-companies');
      const prodData = await prodRes.json();
      setProductionCompanies(prodData.map((pc: { name: string }) => pc.name));

      // Cargar idiomas (solo nombres para autocomplete)
      const langRes = await fetch('/api/languages');
      const langData = await langRes.json();
      setLanguages(langData.map((l: { name: string }) => l.name));

      // Cargar géneros
      const genresRes = await fetch('/api/genres');
      const genresData = await genresRes.json();
      setGenres(genresData.map((g: { name: string }) => g.name));

      // Cargar tags
      const tagsRes = await fetch('/api/tags');
      const tagsData = await tagsRes.json();
      setTags(tagsData.map((t: { name: string }) => t.name));

      // Cargar opciones de "basado en"
      const basedOnRes = await fetch('/api/series/based-on');
      const basedOnData = await basedOnRes.json();
      setBasedOnOptions(basedOnData);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  }, []);

  useEffect(() => {
    loadFormData();
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        basedOn: initialData.basedOn ? [initialData.basedOn] : [],
      });
      setSelectedType(initialData.type || 'serie');

      // Load initial related series options for edit mode
      if (
        initialData.relatedSeriesIds &&
        (initialData.relatedSeriesIds as number[]).length > 0
      ) {
        const ids = initialData.relatedSeriesIds as number[];
        Promise.all(
          ids.map((id) => fetch(`/api/series/${id}`).then((r) => r.json()))
        ).then((results) => {
          setRelatedSeriesOptions(
            results.map(
              (s: {
                id: number;
                title: string;
                year: number | null;
                type: string;
              }) => ({
                id: s.id,
                title: s.title,
                year: s.year,
                type: s.type,
              })
            )
          );
        });
      }
    }
    // Mark initial load as complete after a tick so form.isFieldsTouched() settles
    const timer = setTimeout(() => {
      initialDataLoaded.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, [initialData, loadFormData, form]);

  const handleSearchRelatedSeries = useCallback(
    (query: string) => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (!query.trim()) return;

      searchTimeout.current = setTimeout(async () => {
        setSearchingRelated(true);
        try {
          const excludeId = initialData?.id || '';
          const res = await fetch(
            `/api/series/search?q=${encodeURIComponent(query)}&excludeId=${excludeId}`
          );
          const data = await res.json();
          setRelatedSeriesOptions((prev) => {
            const existingIds = new Set(prev.map((o) => o.id));
            const newOpts = data.filter(
              (s: { id: number }) => !existingIds.has(s.id)
            );
            return [...prev, ...newOpts];
          });
        } finally {
          setSearchingRelated(false);
        }
      }, 300);
    },
    [initialData?.id]
  );

  const handleCreateUniverse = async () => {
    const name = newUniverseName.trim();
    if (!name) return;
    setCreatingUniverse(true);
    try {
      const res = await fetch('/api/universes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: newUniverseDescription.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || t('seriesForm.universeCreateError'));

      const created: UniverseOption = { id: data.id, name: data.name };
      setUniverses((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      form.setFieldValue('universeId', created.id);
      setNewUniverseModalOpen(false);
      setNewUniverseName('');
      setNewUniverseDescription('');
      message.success(
        interpolateMessage(t('seriesForm.universeCreated'), {
          name: created.name,
        })
      );
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : t('seriesForm.universeCreateError')
      );
    } finally {
      setCreatingUniverse(false);
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const url =
        mode === 'create' ? '/api/series' : `/api/series/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      // basedOn comes as array from Select mode="tags", convert to string
      const submitValues = {
        ...values,
        basedOn: Array.isArray(values.basedOn)
          ? values.basedOn[0] || null
          : values.basedOn || null,
      };

      // Include pending content items in the creation request
      const bodyPayload =
        mode === 'create' && pendingContent.length > 0
          ? {
              ...submitValues,
              contentItems: pendingContent.map(
                ({ _tempId, ...contentData }) => contentData
              ),
            }
          : submitValues;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) throw new Error('Error saving series');

      const savedSerie = await response.json();

      submittedSuccessfully.current = true;

      message.success(
        mode === 'create'
          ? t('seriesForm.createSuccess')
          : t('seriesForm.updateSuccess')
      );

      router.push(`/series/${savedSerie.id}`);
    } catch (error) {
      message.error(t('seriesForm.saveError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error uploading file');
      }

      const data = await response.json();

      // Actualizar el campo imageUrl en el formulario
      form.setFieldsValue({ imageUrl: data.url });
      message.success(t('seriesForm.uploadSuccess'));

      return false; // Prevent default upload behavior
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('seriesForm.uploadError');
      message.error(errorMessage);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (mode !== 'edit' || !initialData?.id) return;
    try {
      const response = await fetch(`/api/series/${initialData.id}/favorite`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setIsFavorite(data.isFavorite);
      message.success(
        data.isFavorite
          ? t('seriesForm.favoriteAdded')
          : t('seriesForm.favoriteRemoved')
      );
    } catch {
      message.error(t('seriesForm.favoriteError'));
    }
  };

  const submittedSuccessfully = useRef(false);
  const initialDataLoaded = useRef(false);

  const hasUnsavedChanges = useCallback(() => {
    if (!initialDataLoaded.current) return false;
    return !submittedSuccessfully.current && form.isFieldsTouched();
  }, [form]);

  // Warn on browser close/reload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges()) {
      modal.confirm({
        title: t('seriesForm.unsavedTitle'),
        icon: <ExclamationCircleOutlined />,
        content: t('seriesForm.unsavedContent'),
        okText: t('seriesForm.unsavedOk'),
        cancelText: t('seriesForm.unsavedCancel'),
        okButtonProps: { danger: true },
        onOk: () => router.back(),
      });
    } else {
      router.back();
    }
  }, [hasUnsavedChanges, router, modal]);

  const config = getContentTypeConfig(selectedType);
  const showSeasons = shouldShowSeasons(selectedType);

  return (
    <div className="series-form">
      <Card
        title={
          <div className="series-form__header">
            <span>
              {mode === 'create'
                ? t('seriesForm.headerCreate')
                : t('seriesForm.headerEdit')}
            </span>
            <Space wrap>
              {mode === 'edit' && initialData?.id && (
                <Button
                  icon={isFavorite ? <StarFilled /> : <StarOutlined />}
                  onClick={handleToggleFavorite}
                  style={
                    isFavorite
                      ? { color: '#faad14', borderColor: '#faad14' }
                      : {}
                  }
                >
                  {isFavorite
                    ? t('seriesForm.favoriteButton')
                    : t('seriesForm.addFavoriteButton')}
                </Button>
              )}
              <Button icon={<CloseOutlined />} onClick={handleCancel}>
                {t('seriesForm.cancelButton')}
              </Button>
            </Space>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: 'serie',
            basedOn: null,
            format: 'regular',
            actors: [],
            directors: [],
            ...(showSeasons
              ? { seasons: [{ seasonNumber: 1, episodeCount: null }] }
              : {}),
          }}
        >
          {/* Información Básica */}
          <Card
            type="inner"
            title={`📝 ${t('seriesForm.sectionBasic')}`}
            style={{ marginBottom: 24 }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={t('seriesForm.fieldTitle')}
                  name="title"
                  rules={[
                    { required: true, message: t('seriesForm.requiredTitle') },
                  ]}
                >
                  <Input placeholder={t('seriesForm.hintTitle')} size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={t('seriesForm.fieldOriginalTitle')}
                  name="originalTitle"
                >
                  <Input
                    placeholder={t('seriesForm.hintOriginalTitle')}
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label={t('seriesForm.fieldType')}
                  name="type"
                  rules={[
                    { required: true, message: t('seriesForm.requiredType') },
                  ]}
                >
                  <Select
                    size="large"
                    onChange={(value) => setSelectedType(value)}
                  >
                    <Option value="serie">
                      📺 {t('seriesForm.typeOption_serie')}
                    </Option>
                    <Option value="pelicula">
                      🎬 {t('seriesForm.typeOption_pelicula')}
                    </Option>
                    <Option value="corto">
                      🎞️ {t('seriesForm.typeOption_corto')}
                    </Option>
                    <Option value="especial">
                      ✨ {t('seriesForm.typeOption_especial')}
                    </Option>
                    <Option value="anime">
                      🎨 {t('seriesForm.typeOption_anime')}
                    </Option>
                    <Option value="reality">
                      🎤 {t('seriesForm.typeOption_reality')}
                    </Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label={t('seriesForm.fieldCountry')}
                  name="countryName"
                >
                  <Select
                    placeholder={t('seriesForm.hintCountry')}
                    size="large"
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label as string)
                        ?.toLowerCase()
                        .includes(input.toLowerCase()) ?? false
                    }
                    options={countries.map((c) => ({
                      value: c.name,
                      label: c.name,
                    }))}
                    optionRender={(option) => {
                      const country = countries.find(
                        (c) => c.name === option.value
                      );
                      return (
                        <Space>
                          <CountryFlag code={country?.code} size="small" />
                          {option.label}
                        </Space>
                      );
                    }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label={t('seriesForm.fieldYear')} name="year">
                  <InputNumber
                    placeholder="2024"
                    style={{ width: '100%' }}
                    size="large"
                    min={1900}
                    max={2100}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label={t('seriesForm.fieldUniverse')}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item name="universeId" noStyle>
                      <Select
                        placeholder={t('seriesForm.hintUniverse')}
                        size="large"
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                          (option?.children as unknown as string)
                            ?.toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        style={{ width: '100%' }}
                      >
                        {universes.map((u) => (
                          <Option key={u.id} value={u.id}>
                            {u.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Button
                      size="large"
                      icon={<PlusOutlined />}
                      onClick={() => setNewUniverseModalOpen(true)}
                      title={t('seriesForm.createNewUniverseTitle')}
                    />
                  </Space.Compact>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={t('seriesForm.fieldBasedOn')}
                  name="basedOn"
                  help={t('seriesForm.helpBasedOn')}
                >
                  <Select
                    mode="tags"
                    placeholder={t('seriesForm.hintBasedOn')}
                    size="large"
                    allowClear
                    maxCount={1}
                    tokenSeparators={[',']}
                    style={{ width: '100%' }}
                    options={basedOnOptions.map((v) => ({
                      value: v,
                      label: v,
                    }))}
                    filterOption={(inputValue, option) =>
                      (option?.label as string)
                        .toLowerCase()
                        .includes(inputValue.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={t('seriesForm.fieldFormat')}
                  name="format"
                  rules={[
                    { required: true, message: t('seriesForm.requiredFormat') },
                  ]}
                >
                  <Select size="large">
                    <Option value="regular">
                      📱 {t('seriesForm.formatOption_regular')}
                    </Option>
                    <Option value="vertical">
                      📲 {t('seriesForm.formatOption_vertical')}
                    </Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={t('seriesForm.fieldProduction')}
                  name="productionCompanyName"
                  help={t('seriesForm.helpProduction')}
                >
                  <AutoComplete
                    options={productionCompanies.map((pc) => ({ value: pc }))}
                    placeholder={t('seriesForm.hintProduction')}
                    size="large"
                    filterOption={(inputValue, option) =>
                      option!.value
                        .toLowerCase()
                        .includes(inputValue.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={t('seriesForm.fieldLanguage')}
                  name="originalLanguageName"
                  help={t('seriesForm.helpLanguage')}
                >
                  <AutoComplete
                    options={languages.map((l) => ({ value: l }))}
                    placeholder={t('seriesForm.hintLanguage')}
                    size="large"
                    filterOption={(inputValue, option) =>
                      option!.value
                        .toLowerCase()
                        .includes(inputValue.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={t('seriesForm.fieldGenres')}
                  name="genres"
                  help={t('seriesForm.helpGenres')}
                >
                  <Select
                    mode="tags"
                    size="large"
                    placeholder={t('seriesForm.hintGenres')}
                    tokenSeparators={[',']}
                    style={{ width: '100%' }}
                    options={genres.map((g) => ({ value: g, label: g }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label={t('seriesForm.fieldSynopsis')}
                  name="synopsis"
                >
                  <TextArea
                    rows={4}
                    placeholder={t('seriesForm.hintSynopsis')}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={t('seriesForm.fieldSoundtrack')}
                  name="soundtrack"
                >
                  <Input
                    placeholder={t('seriesForm.hintSoundtrack')}
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={t('seriesForm.fieldRating')}
                  name="overallRating"
                >
                  <InputNumber
                    placeholder={t('seriesForm.hintRating')}
                    style={{ width: '100%' }}
                    size="large"
                    min={1}
                    max={10}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label={t('seriesForm.fieldObservations')}
                  name="observations"
                >
                  <TextArea
                    rows={3}
                    placeholder={t('seriesForm.hintObservations')}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label={t('seriesForm.fieldTags')}
                  name="tags"
                  help={t('seriesForm.helpTags')}
                >
                  <Select
                    mode="tags"
                    size="large"
                    placeholder={t('seriesForm.hintTags')}
                    tokenSeparators={[',']}
                    style={{ width: '100%' }}
                    options={tags.map((t) => ({ value: t, label: t }))}
                    filterOption={(inputValue, option) =>
                      (option?.label as string)
                        .toLowerCase()
                        .includes(inputValue.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label={`🖼️ ${t('seriesForm.fieldImage')}`}
                  name="imageUrl"
                  help={t('seriesForm.helpImage')}
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      size="large"
                      placeholder={t('seriesForm.hintImage')}
                    />
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      beforeUpload={handleUpload}
                    >
                      <Button
                        icon={<UploadOutlined />}
                        loading={uploading}
                        size="large"
                      >
                        {uploading
                          ? t('seriesForm.uploadingLabel')
                          : t('seriesForm.uploadButton')}
                      </Button>
                    </Upload>
                  </Space.Compact>
                </Form.Item>
              </Col>

              {imageUrl && (
                <Col xs={24}>
                  <Form.Item
                    label={`📍 ${t('seriesForm.fieldImagePosition')}`}
                    name="imagePosition"
                    help={t('seriesForm.helpImagePosition')}
                  >
                    <ImagePositionSelector imageUrl={imageUrl} />
                  </Form.Item>
                </Col>
              )}
            </Row>
          </Card>

          {/* Reparto */}
          <Card
            type="inner"
            title={`👥 ${t('seriesForm.sectionCast')}`}
            style={{ marginBottom: 24 }}
          >
            {showSeasons && (
              <Alert
                title={t('seriesForm.castAlertTitle')}
                description={t('seriesForm.castAlertDescription')}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-tertiary)',
                marginBottom: 12,
              }}
            >
              {t('seriesForm.castPairingHint')}
            </div>
            <Form.List name="actors">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="series-form__actor-row">
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
                      >
                        <AutoComplete
                          options={actors.map((a) => ({ value: a }))}
                          placeholder={t('seriesForm.hintActorName')}
                          filterOption={(inputValue, option) =>
                            option!.value
                              .toLowerCase()
                              .includes(inputValue.toLowerCase())
                          }
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'character']}
                        style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
                      >
                        <Input placeholder={t('seriesForm.hintCharacter')} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'isMain']}
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Checkbox>{t('seriesForm.fieldIsMain')}</Checkbox>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'pairingGroup']}
                        style={{ marginBottom: 0, width: 80 }}
                      >
                        <InputNumber
                          placeholder={t('seriesForm.hintPairingGroup')}
                          min={1}
                          max={20}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </div>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      {t('seriesForm.addActorButton')}
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Card>

          {/* Directores */}
          <Card
            type="inner"
            title={`🎬 ${t('seriesForm.sectionDirectors')}`}
            style={{ marginBottom: 24 }}
          >
            <Form.List name="directors">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="series-form__actor-row">
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
                      >
                        <AutoComplete
                          options={directors.map((d) => ({ value: d }))}
                          placeholder={t('seriesForm.hintDirectorName')}
                          filterOption={(inputValue, option) =>
                            option!.value
                              .toLowerCase()
                              .includes(inputValue.toLowerCase())
                          }
                        />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </div>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      {t('seriesForm.addDirectorButton')}
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Card>

          {/* Donde Ver */}
          <Card
            type="inner"
            title={t('seriesForm.sectionWatchLinks')}
            style={{ marginBottom: 24 }}
          >
            <Form.List name="watchLinks">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="series-form__actor-row">
                      <Form.Item
                        {...restField}
                        name={[name, 'platform']}
                        style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
                      >
                        <Select
                          placeholder={t('seriesForm.fieldPlatform')}
                          options={[
                            { value: 'YouTube', label: 'YouTube' },
                            { value: 'Viki', label: 'Viki' },
                            { value: 'iQIYI', label: 'iQIYI' },
                            { value: 'WeTV', label: 'WeTV' },
                            { value: 'Netflix', label: 'Netflix' },
                            { value: 'GagaOOLala', label: 'GagaOOLala' },
                            { value: 'Bilibili', label: 'Bilibili' },
                            { value: 'Otro', label: 'Otro' },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'url']}
                        style={{ marginBottom: 0, flex: 2, minWidth: 0 }}
                      >
                        <Input placeholder={t('seriesForm.hintWatchUrl')} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'official']}
                        valuePropName="checked"
                        initialValue={true}
                        style={{ marginBottom: 0 }}
                      >
                        <Checkbox>{t('seriesForm.fieldOfficial')}</Checkbox>
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </div>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add({ official: true })}
                      block
                      icon={<PlusOutlined />}
                    >
                      {t('seriesForm.addPlatformButton')}
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Card>

          {/* Temporadas (solo para series) */}
          {showSeasons && (
            <Card
              type="inner"
              title={`📺 ${'seasonLabel' in config ? config.seasonLabel : 'Temporadas'}`}
              style={{ marginBottom: 24 }}
            >
              <Alert
                title={t('seriesForm.seasonAlertTitle')}
                description={
                  mode === 'edit'
                    ? t('seriesForm.seasonAlertEdit')
                    : t('seriesForm.seasonAlertCreate')
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form.List name="seasons">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => {
                      const seasonData = form.getFieldValue(['seasons', name]);
                      const hasId = seasonData?.id;

                      return (
                        <div key={key} className="series-form__season-row">
                          <Form.Item {...restField} name={[name, 'id']} hidden>
                            <Input type="hidden" />
                          </Form.Item>

                          <Form.Item
                            {...restField}
                            name={[name, 'seasonNumber']}
                            label={t('seriesForm.fieldSeasonNumber')}
                            rules={[
                              {
                                required: true,
                                message: t('seriesForm.requiredSeasonNumber'),
                              },
                            ]}
                            style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
                          >
                            <InputNumber
                              placeholder="1"
                              min={1}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>

                          <Form.Item
                            {...restField}
                            name={[name, 'episodeCount']}
                            label={t('seriesForm.fieldEpisodeCount')}
                            style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
                          >
                            <InputNumber
                              placeholder="12"
                              min={1}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>

                          <Form.Item
                            {...restField}
                            name={[name, 'year']}
                            label={t('seriesForm.fieldYear')}
                            style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
                          >
                            <InputNumber
                              placeholder="2024"
                              min={1900}
                              max={2100}
                              style={{ width: '100%' }}
                            />
                          </Form.Item>

                          {mode === 'edit' && hasId && (
                            <Link
                              href={`/admin/seasons/${seasonData.id}/editar`}
                            >
                              <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {t('seriesForm.editSeasonButton')}
                              </Button>
                            </Link>
                          )}

                          <MinusCircleOutlined onClick={() => remove(name)} />
                        </div>
                      );
                    })}
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                      >
                        Agregar Temporada
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Card>
          )}

          {/* Series Relacionadas */}
          <Card
            type="inner"
            title={`🔗 ${t('seriesForm.sectionRelated')}`}
            style={{ marginBottom: 24 }}
          >
            <Form.Item
              name="relatedSeriesIds"
              help={t('seriesForm.helpRelated')}
            >
              <Select
                mode="multiple"
                placeholder={t('seriesForm.hintRelatedSeries')}
                loading={searchingRelated}
                onSearch={handleSearchRelatedSeries}
                filterOption={false}
                showSearch
                size="large"
                style={{ width: '100%' }}
                options={relatedSeriesOptions.map((s) => ({
                  value: s.id,
                  label: `${s.title}${s.year ? ` (${s.year})` : ''}`,
                }))}
                notFoundContent={
                  searchingRelated
                    ? t('seriesForm.relatedSearching')
                    : t('seriesForm.relatedEmpty')
                }
              />
            </Form.Item>
          </Card>

          {/* Contenido Relacionado */}
          <Card
            type="inner"
            title={`📹 ${t('seriesForm.sectionContent')}`}
            style={{ marginBottom: 24 }}
          >
            {mode === 'edit' && initialData?.id ? (
              <SeriesContentManager seriesId={initialData.id as number} />
            ) : (
              <SeriesContentManager
                pendingItems={pendingContent}
                onPendingItemsChange={setPendingContent}
              />
            )}
          </Card>

          {/* Botones de acción */}
          <Form.Item>
            <Space size="large">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                size="large"
                loading={loading}
              >
                {mode === 'create'
                  ? t('seriesForm.createButton')
                  : t('seriesForm.saveButton')}
              </Button>
              <Button size="large" onClick={handleCancel}>
                {t('seriesForm.cancelButton')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title={t('seriesForm.universeModalTitle')}
        open={newUniverseModalOpen}
        onOk={handleCreateUniverse}
        onCancel={() => {
          setNewUniverseModalOpen(false);
          setNewUniverseName('');
          setNewUniverseDescription('');
        }}
        confirmLoading={creatingUniverse}
        okText={t('seriesForm.universeCreateButton')}
        cancelText={t('seriesForm.universeCancelButton')}
        okButtonProps={{ disabled: !newUniverseName.trim() }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginTop: 16,
          }}
        >
          <Input
            placeholder={t('seriesForm.universeNamePlaceholder')}
            value={newUniverseName}
            onChange={(e) => setNewUniverseName(e.target.value)}
            onPressEnter={() =>
              newUniverseName.trim() && handleCreateUniverse()
            }
          />
          <Input.TextArea
            placeholder={t('seriesForm.universeDescriptionPlaceholder')}
            value={newUniverseDescription}
            onChange={(e) => setNewUniverseDescription(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
}
