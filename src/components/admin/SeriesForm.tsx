'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from '@ant-design/icons/lib/icons';
import Link from 'next/link';
import { shouldShowSeasons, getContentTypeConfig } from '@/types/content';
import './SeriesForm.css';
import { useMessage } from '@/hooks/useMessage';

const { Option } = Select;
const { TextArea } = Input;

interface SeriesFormInitialData {
  id?: number;
  title?: string;
  type?: string;
  isFavorite?: boolean;
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

const POSITION_OPTIONS = [
  { value: 'top left', label: '↖' },
  { value: 'top center', label: '↑' },
  { value: 'top right', label: '↗' },
  { value: 'center left', label: '←' },
  { value: 'center', label: '•' },
  { value: 'center right', label: '→' },
  { value: 'bottom left', label: '↙' },
  { value: 'bottom center', label: '↓' },
  { value: 'bottom right', label: '↘' },
];

function ImagePositionSelector({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) {
  const current = value || 'center';
  return (
    <div className="image-position-grid">
      {POSITION_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`image-position-cell ${current === opt.value ? 'image-position-cell--active' : ''}`}
          onClick={() => onChange?.(opt.value)}
          title={opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SeriesForm({ initialData, mode }: SeriesFormProps) {
  const message = useMessage();
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('serie');

  // Datos para autocompletado
  const [countries, setCountries] = useState<string[]>([]);
  const [actors, setActors] = useState<string[]>([]);
  const [directors, setDirectors] = useState<string[]>([]);
  const [universes, setUniverses] = useState<UniverseOption[]>([]);
  const [productionCompanies, setProductionCompanies] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const imageUrl = Form.useWatch('imageUrl', form);
  const [isFavorite, setIsFavorite] = useState(
    initialData?.isFavorite ?? false
  );

  const loadFormData = useCallback(async () => {
    try {
      // Cargar países
      const countriesRes = await fetch('/api/countries');
      const countriesData = await countriesRes.json();
      setCountries(countriesData.map((c: { name: string }) => c.name));

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
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  }, []);

  useEffect(() => {
    loadFormData();
    if (initialData) {
      form.setFieldsValue(initialData);
      setSelectedType(initialData.type || 'serie');
    }
  }, [initialData, loadFormData, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const url =
        mode === 'create' ? '/api/series' : `/api/series/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Error saving series');

      const savedSerie = await response.json();
      message.success(
        mode === 'create'
          ? 'Serie creada exitosamente'
          : 'Serie actualizada exitosamente'
      );

      router.push(`/series/${savedSerie.id}`);
    } catch (error) {
      message.error('Error al guardar la serie');
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
      message.success('Imagen subida exitosamente');

      return false; // Prevent default upload behavior
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al subir la imagen';
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !isFavorite }),
      });
      if (!response.ok) throw new Error();
      setIsFavorite(!isFavorite);
      message.success(
        !isFavorite ? '⭐ Agregado a favoritos' : 'Removido de favoritos'
      );
    } catch {
      message.error('Error al actualizar favorito');
    }
  };

  const config = getContentTypeConfig(selectedType);
  const showSeasons = shouldShowSeasons(selectedType);

  return (
    <div className="series-form">
      <Card
        title={
          <div className="series-form__header">
            <span>
              {mode === 'create'
                ? 'Nueva Serie/Película'
                : 'Editar Serie/Película'}
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
                  {isFavorite ? 'Favorito' : 'Agregar a Favoritos'}
                </Button>
              )}
              <Button icon={<CloseOutlined />} onClick={() => router.back()}>
                Cancelar
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
            title="📝 Información Básica"
            style={{ marginBottom: 24 }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Título"
                  name="title"
                  rules={[
                    { required: true, message: 'El título es obligatorio' },
                  ]}
                >
                  <Input placeholder="Ej: 2 Moons" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Título Original" name="originalTitle">
                  <Input placeholder="Título en idioma original" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label="Tipo"
                  name="type"
                  rules={[{ required: true, message: 'Selecciona un tipo' }]}
                >
                  <Select
                    size="large"
                    onChange={(value) => setSelectedType(value)}
                  >
                    <Option value="serie">📺 Serie</Option>
                    <Option value="pelicula">🎬 Película</Option>
                    <Option value="corto">🎞️ Cortometraje</Option>
                    <Option value="especial">✨ Especial</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label="País" name="countryName">
                  <AutoComplete
                    options={countries.map((c) => ({ value: c }))}
                    placeholder="Ej: Tailandia"
                    size="large"
                    filterOption={(inputValue, option) =>
                      option!.value
                        .toLowerCase()
                        .includes(inputValue.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label="Año" name="year">
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
                <Form.Item label="Universo (opcional)" name="universeId">
                  <Select
                    placeholder="¿Pertenece a algún universo/franquicia?"
                    size="large"
                    allowClear
                  >
                    {universes.map((u) => (
                      <Option key={u.id} value={u.id}>
                        {u.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Basada en" name="basedOn">
                  <Select
                    placeholder="Selecciona si está basado en algo"
                    size="large"
                    allowClear
                  >
                    <Option value="libro">📖 Libro</Option>
                    <Option value="novela">📚 Novela</Option>
                    <Option value="corto">📄 Cuento/Relato Corto</Option>
                    <Option value="manga">🎌 Manga</Option>
                    <Option value="anime">🎨 Anime</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Formato de Pantalla"
                  name="format"
                  rules={[{ required: true, message: 'Selecciona un formato' }]}
                >
                  <Select size="large">
                    <Option value="regular">📱 Regular (Horizontal)</Option>
                    <Option value="vertical">📲 Vertical (Para móvil)</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Productora"
                  name="productionCompanyName"
                  help="Escribe para buscar o crear una nueva productora"
                >
                  <AutoComplete
                    options={productionCompanies.map((pc) => ({ value: pc }))}
                    placeholder="Ej: GMMTV"
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
                  label="Idioma Original"
                  name="originalLanguageName"
                  help="Escribe para buscar o crear un nuevo idioma"
                >
                  <AutoComplete
                    options={languages.map((l) => ({ value: l }))}
                    placeholder="Ej: Tailandés"
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
                  label="Género"
                  name="genres"
                  help="Escribe y presiona Enter para crear nuevos géneros. Ej: Drama, Romance, Comedia"
                >
                  <Select
                    mode="tags"
                    size="large"
                    placeholder="Agrega géneros como Drama, Romance, etc."
                    tokenSeparators={[',']}
                    style={{ width: '100%' }}
                    options={genres.map((g) => ({ value: g, label: g }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Sinopsis" name="synopsis">
                  <TextArea
                    rows={4}
                    placeholder="Breve descripción de la serie/película"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Banda Sonora (BSO)" name="soundtrack">
                  <Input
                    placeholder="Compositor o información de la BSO"
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Puntuación General (1-10)"
                  name="overallRating"
                >
                  <InputNumber
                    placeholder="8"
                    style={{ width: '100%' }}
                    size="large"
                    min={1}
                    max={10}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Observaciones" name="observations">
                  <TextArea
                    rows={3}
                    placeholder="Notas personales, comentarios, etc."
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label="Tags / Etiquetas"
                  name="tags"
                  help="Escribe y presiona Enter para crear nuevos tags. Ej: Enemy to Lovers, Rico-Pobre, Escuela"
                >
                  <Select
                    mode="tags"
                    size="large"
                    placeholder="Agrega tags como Enemy to Lovers, Escuela, etc."
                    tokenSeparators={[',']}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label="🖼️ Imagen / Portada"
                  name="imageUrl"
                  help="Pega una URL o sube un archivo desde tu computadora"
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      size="large"
                      placeholder="https://example.com/imagen.jpg"
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
                        {uploading ? 'Subiendo...' : 'Subir'}
                      </Button>
                    </Upload>
                  </Space.Compact>
                </Form.Item>
              </Col>

              {imageUrl && (
                <Col xs={24}>
                  <Form.Item
                    label="📍 Posición de imagen en catálogo"
                    name="imagePosition"
                    help="Seleccioná qué parte de la imagen se ve en las cards"
                  >
                    <ImagePositionSelector />
                  </Form.Item>
                </Col>
              )}
            </Row>
          </Card>

          {/* Reparto */}
          <Card type="inner" title="👥 Reparto" style={{ marginBottom: 24 }}>
            {showSeasons && (
              <Alert
                title="Reparto principal de la serie"
                description="Este es el reparto que aparece en todas las temporadas. Para agregar reparto específico de cada temporada, usa el botón 'Editar' junto a cada temporada abajo."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
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
                          placeholder="Nombre del actor"
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
                        <Input placeholder="Personaje" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'isMain']}
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Checkbox>Protagonista</Checkbox>
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
                      Agregar Actor
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Card>

          {/* Directores */}
          <Card type="inner" title="🎬 Directores" style={{ marginBottom: 24 }}>
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
                          placeholder="Nombre del director"
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
                      Agregar Director
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
                title="Información básica de temporadas"
                description={
                  mode === 'edit'
                    ? "Usa el botón 'Editar' junto a cada temporada para agregar reparto específico, sinopsis, episodios, comentarios y ratings."
                    : 'Primero guarda la serie, luego podrás editar cada temporada en detalle para agregar reparto, sinopsis, episodios, etc.'
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
                            label="Temporada"
                            rules={[
                              { required: true, message: 'Número requerido' },
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
                            label="Capítulos"
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
                            label="Año"
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
                                Editar
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
                {mode === 'create' ? 'Crear Serie' : 'Guardar Cambios'}
              </Button>
              <Button size="large" onClick={() => router.back()}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
