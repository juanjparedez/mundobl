'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, InputNumber, Spin } from 'antd';
import { useMessage } from '@/hooks/useMessage';

const { TextArea } = Input;
const { Option } = Select;

interface EditSerieModalProps {
  open: boolean;
  serieId: string | null;
  onClose: () => void;
  onSuccess: () => void;
  countries: Array<{ id: number; name: string }>;
}

export function EditSerieModal({
  open,
  serieId,
  onClose,
  onSuccess,
  countries,
}: EditSerieModalProps) {
  const message = useMessage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchSerieData = useCallback(async () => {
    setFetching(true);
    try {
      const response = await fetch(`/api/series/${serieId}`);
      if (!response.ok) throw new Error('Error al cargar la serie');

      const data = await response.json();

      form.setFieldsValue({
        title: data.title,
        originalTitle: data.originalTitle,
        year: data.year,
        type: data.type,
        basedOn: data.basedOn,
        format: data.format,
        imageUrl: data.imageUrl,
        synopsis: data.synopsis,
        review: data.review,
        soundtrack: data.soundtrack,
        overallRating: data.overallRating,
        observations: data.observations,
        countryId: data.countryId,
      });
    } catch (error) {
      message.error('Error al cargar los datos de la serie');
      console.error(error);
    } finally {
      setFetching(false);
    }
  }, [serieId, form, message]);

  useEffect(() => {
    if (open && serieId) {
      fetchSerieData();
    } else {
      form.resetFields();
    }
  }, [open, serieId, fetchSerieData, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!serieId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/series/${serieId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar la serie');
      }

      message.success('Serie actualizada correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al actualizar la serie';
      message.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Editar Serie"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={800}
      okText="Guardar"
      cancelText="Cancelar"
    >
      <Spin spinning={fetching} size="large">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Título"
            name="title"
            rules={[{ required: true, message: 'El título es requerido' }]}
          >
            <Input placeholder="Título de la serie" />
          </Form.Item>

          <Form.Item label="Título Original" name="originalTitle">
            <Input placeholder="Título original (opcional)" />
          </Form.Item>

          <Form.Item label="URL de Imagen" name="imageUrl">
            <Input placeholder="URL de la imagen de portada" />
          </Form.Item>

          <Form.Item label="Año" name="year">
            <InputNumber
              placeholder="Año de estreno"
              min={1900}
              max={2100}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Tipo"
            name="type"
            rules={[{ required: true, message: 'El tipo es requerido' }]}
          >
            <Select placeholder="Selecciona el tipo">
              <Option value="serie">Serie</Option>
              <Option value="pelicula">Película</Option>
              <Option value="corto">Corto</Option>
              <Option value="especial">Especial</Option>
            </Select>
          </Form.Item>

          <Form.Item label="País de Origen" name="countryId">
            <Select
              placeholder="Selecciona el país"
              showSearch
              optionFilterProp="children"
              allowClear
            >
              {countries.map((country) => (
                <Option key={country.id} value={country.id}>
                  {country.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Rating General" name="overallRating">
            <InputNumber
              placeholder="Rating (1-10)"
              min={1}
              max={10}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Basado en" name="basedOn">
            <Select placeholder="Selecciona si está basado en algo" allowClear>
              <Option value="libro">📖 Libro</Option>
              <Option value="novela">📚 Novela</Option>
              <Option value="corto">📄 Cuento/Relato Corto</Option>
              <Option value="manga">🎌 Manga</Option>
              <Option value="anime">🎨 Anime</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Formato de Pantalla"
            name="format"
            rules={[{ required: true, message: 'Selecciona un formato' }]}
            initialValue="regular"
          >
            <Select>
              <Option value="regular">📱 Regular (Horizontal)</Option>
              <Option value="vertical">📲 Vertical (Para móvil)</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Sinopsis" name="synopsis">
            <TextArea
              rows={4}
              placeholder="Sinopsis de la serie..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item label="Reseña Personal" name="review">
            <TextArea
              rows={6}
              placeholder="Tu reseña personal, opinión, crítica..."
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item label="Banda Sonora" name="soundtrack">
            <Input placeholder="Información sobre la banda sonora" />
          </Form.Item>

          <Form.Item label="Observaciones" name="observations">
            <TextArea
              rows={6}
              placeholder="Observaciones, comentarios, reseña personal..."
              showCount
              maxLength={2000}
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
