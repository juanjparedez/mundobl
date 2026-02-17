'use client';

import { useState } from 'react';
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
  Checkbox,
} from 'antd';
import {
  PlusOutlined,
  MinusCircleOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import './SeriesForm.css';

const { TextArea } = Input;

interface SeasonEditFormProps {
  initialData: {
    id: number;
    seriesId: number;
    seriesTitle: string;
    seasonNumber: number;
    title?: string | null;
    episodeCount?: number | null;
    year?: number | null;
    synopsis?: string | null;
    observations?: string | null;
    actors?: Array<{
      name: string;
      character: string;
      isMain: boolean;
    }>;
  };
}

export function SeasonEditForm({ initialData }: SeasonEditFormProps) {
  const message = useMessage();
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/seasons/${initialData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Error al actualizar temporada');

      message.success('Temporada actualizada exitosamente');
      router.push(`/series/${initialData.seriesId}`);
    } catch (error) {
      message.error('Error al actualizar la temporada');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="season-edit-form series-form">
      <Card
        title={
          <div className="series-form__header">
            <span>
              Editar Temporada {initialData.seasonNumber} -{' '}
              {initialData.seriesTitle}
            </span>
            <Button
              icon={<CloseOutlined />}
              onClick={() => router.push(`/series/${initialData.seriesId}`)}
            >
              Cancelar
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={initialData}
        >
          <Card
            type="inner"
            title="📝 Información de la Temporada"
            style={{ marginBottom: 24 }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Título de la Temporada (opcional)"
                  name="title"
                >
                  <Input placeholder="Ej: The Ambassador" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
                <Form.Item label="Número de Capítulos" name="episodeCount">
                  <InputNumber
                    placeholder="12"
                    style={{ width: '100%' }}
                    size="large"
                    min={1}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
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

              <Col xs={24}>
                <Form.Item label="Sinopsis" name="synopsis">
                  <TextArea
                    rows={4}
                    placeholder="Sinopsis de esta temporada específica..."
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Observaciones" name="observations">
                  <TextArea
                    rows={3}
                    placeholder="Notas personales sobre esta temporada..."
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Reparto Específico de la Temporada */}
          <Card
            type="inner"
            title="👥 Reparto de esta Temporada"
            style={{ marginBottom: 24 }}
          >
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Actores específicos de esta temporada (si difieren de la serie
              general)
            </p>
            <Form.List name="actors">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="series-form__actor-row">
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        rules={[
                          { required: true, message: 'Nombre requerido' },
                        ]}
                        style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
                      >
                        <Input placeholder="Nombre del actor" />
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

          {/* Botones de acción */}
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                size="large"
                loading={loading}
              >
                Guardar Cambios
              </Button>
              <Button
                size="large"
                onClick={() => router.push(`/series/${initialData.seriesId}`)}
              >
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
