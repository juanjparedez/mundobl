'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Space,
  AutoComplete,
  Checkbox,
  Divider,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  MinusCircleOutlined,
  SaveOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import './SeasonForm.css';
import { useMessage } from '@/hooks/useMessage';

const { TextArea } = Input;

interface SeasonFormData {
  id: number;
  seriesId: number;
  seriesTitle: string;
  seasonNumber: number;
  title?: string | null;
  episodeCount?: number | null;
  year?: number | null;
  synopsis?: string | null;
  observations?: string | null;
  imageUrl?: string | null;
}

interface SeasonFormProps {
  initialData: SeasonFormData;
}

export function SeasonForm({ initialData }: SeasonFormProps) {
  const message = useMessage();
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actors, setActors] = useState<string[]>([]);

  const loadFormData = useCallback(async () => {
    try {
      const actorsRes = await fetch('/api/actors');
      const actorsData = await actorsRes.json();
      setActors(actorsData.map((a: { name: string }) => a.name));
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  }, []);

  useEffect(() => {
    loadFormData();
    if (initialData) {
      form.setFieldsValue(initialData);
    }
  }, [initialData, loadFormData, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/seasons/${initialData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Error saving season');

      message.success('Temporada actualizada exitosamente');
      router.push(`/series/${initialData.seriesId}`);
    } catch (error) {
      message.error('Error al guardar la temporada');
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
      form.setFieldsValue({ imageUrl: data.url });
      message.success('Imagen subida exitosamente');

      return false;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al subir la imagen';
      message.error(errorMessage);
      return false;
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="season-form">
      <Card
        title={
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link href={`/series/${initialData.seriesId}`}>
                <Button icon={<ArrowLeftOutlined />} type="text">
                  Volver a {initialData.seriesTitle}
                </Button>
              </Link>
              <Divider type="vertical" />
              <span>Editar Temporada {initialData.seasonNumber}</span>
            </div>
            <Button icon={<CloseOutlined />} onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            actors: [{ name: '', character: '', isMain: false }],
          }}
        >
          {/* Información Básica */}
          <Card
            type="inner"
            title="📝 Información Básica de la Temporada"
            style={{ marginBottom: 24 }}
          >
            <Row gutter={16}>
              <Col xs={24} md={6}>
                <Form.Item
                  label="Número de Temporada"
                  name="seasonNumber"
                  rules={[{ required: true, message: 'Requerido' }]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
                <Form.Item label="Título (opcional)" name="title">
                  <Input placeholder="Ej: The Beginning" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
                <Form.Item label="Número de Capítulos" name="episodeCount">
                  <InputNumber
                    min={1}
                    style={{ width: '100%' }}
                    size="large"
                    placeholder="12"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
                <Form.Item label="Año" name="year">
                  <InputNumber
                    min={1900}
                    max={2100}
                    style={{ width: '100%' }}
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label="📖 Sinopsis de esta Temporada"
                  name="synopsis"
                >
                  <TextArea
                    rows={4}
                    placeholder="Descripción de lo que sucede en esta temporada..."
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="📝 Observaciones" name="observations">
                  <TextArea
                    rows={3}
                    placeholder="Notas personales sobre esta temporada..."
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label="🖼️ Imagen de la Temporada"
                  name="imageUrl"
                  help="Pega una URL o sube un archivo desde tu computadora"
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      size="large"
                      placeholder="https://example.com/season-image.jpg"
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
            </Row>
          </Card>

          {/* Reparto de esta Temporada */}
          <Card
            type="inner"
            title="👥 Reparto de esta Temporada"
            style={{ marginBottom: 24 }}
          >
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Agrega actores específicos de esta temporada. El reparto principal
              de la serie se muestra automáticamente.
            </p>
            <Form.List name="actors">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: 8,
                        alignItems: 'flex-start',
                      }}
                    >
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        rules={[
                          { required: true, message: 'Nombre requerido' },
                        ]}
                        style={{ marginBottom: 0, flex: 1 }}
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
                        style={{ marginBottom: 0, flex: 1 }}
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

                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        style={{
                          fontSize: '18px',
                          color: '#ff4d4f',
                          cursor: 'pointer',
                          marginTop: '8px',
                        }}
                      />
                    </div>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      Agregar Actor a esta Temporada
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
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
                Guardar Cambios
              </Button>
              <Button size="large" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Link href={`/series/${initialData.seriesId}`}>
                <Button size="large">Ver Serie</Button>
              </Link>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
