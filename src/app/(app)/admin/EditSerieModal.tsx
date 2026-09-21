'use client';

import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Select, InputNumber, Spin } from 'antd';
import { PanelModal } from '@/components/design-system';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './EditSerieModal.css';

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
  const { t } = useLocale();

  const fetchSerieData = useCallback(async () => {
    setFetching(true);
    try {
      const response = await fetch(`/api/series/${serieId}`);
      if (!response.ok) throw new Error(t('editSerieModal.loadError'));

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
      message.error(t('editSerieModal.loadError'));
      console.error(error);
    } finally {
      setFetching(false);
    }
  }, [serieId, form, message, t]);

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

      message.success(t('editSerieModal.updateSuccess'));
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('editSerieModal.updateError');
      message.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PanelModal
      title={t('editSerieModal.title')}
      open={open}
      onClose={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      size="lg"
      okText={t('editSerieModal.save')}
      cancelText={t('editSerieModal.cancel')}
      forceRender
      // maskClosable={false} es el DEFAULT de PanelModal, por el reporte
      // de Flor: perdia todo lo cargado al clickear afuera por error. El
      // modal solo cierra con Cancelar/X, con Escape, o al guardar.
    >
      <Spin spinning={fetching} size="large">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <div className="edit-serie-modal__grid">
            <Form.Item
              label={t('editSerieModal.fieldTitle')}
              name="title"
              rules={[
                { required: true, message: t('editSerieModal.requiredTitle') },
              ]}
            >
              <Input placeholder={t('editSerieModal.placeholderTitle')} />
            </Form.Item>

            <Form.Item
              label={t('editSerieModal.fieldOriginalTitle')}
              name="originalTitle"
            >
              <Input
                placeholder={t('editSerieModal.placeholderOriginalTitle')}
              />
            </Form.Item>

            <Form.Item
              label={t('editSerieModal.fieldImageUrl')}
              name="imageUrl"
            >
              <Input placeholder={t('editSerieModal.placeholderImageUrl')} />
            </Form.Item>

            <Form.Item label={t('editSerieModal.fieldYear')} name="year">
              <InputNumber
                placeholder={t('editSerieModal.placeholderYear')}
                min={1900}
                max={2100}
                className="edit-serie-modal__number"
              />
            </Form.Item>

            <Form.Item
              label={t('editSerieModal.fieldType')}
              name="type"
              rules={[
                { required: true, message: t('editSerieModal.requiredType') },
              ]}
            >
              <Select placeholder={t('editSerieModal.placeholderType')}>
                <Option value="serie">{t('seriesHeader.typeSerie')}</Option>
                <Option value="pelicula">
                  {t('seriesHeader.typePelicula')}
                </Option>
                <Option value="corto">{t('seriesHeader.typeCorto')}</Option>
                <Option value="especial">
                  {t('seriesHeader.typeEspecial')}
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={t('editSerieModal.fieldCountry')}
              name="countryId"
            >
              <Select
                placeholder={t('editSerieModal.placeholderCountry')}
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

            <Form.Item
              label={t('editSerieModal.fieldRating')}
              name="overallRating"
            >
              <InputNumber
                placeholder={t('editSerieModal.placeholderRating')}
                min={1}
                max={10}
                className="edit-serie-modal__number"
              />
            </Form.Item>

            <Form.Item label={t('editSerieModal.fieldBasedOn')} name="basedOn">
              <Select
                placeholder={t('editSerieModal.placeholderBasedOn')}
                allowClear
              >
                <Option value="libro">
                  {t('editSerieModal.basedOnLibro')}
                </Option>
                <Option value="novela">
                  {t('editSerieModal.basedOnNovela')}
                </Option>
                <Option value="corto">
                  {t('editSerieModal.basedOnCorto')}
                </Option>
                <Option value="manga">
                  {t('editSerieModal.basedOnManga')}
                </Option>
                <Option value="anime">
                  {t('editSerieModal.basedOnAnime')}
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={t('editSerieModal.fieldFormat')}
              name="format"
              rules={[
                { required: true, message: t('editSerieModal.requiredFormat') },
              ]}
              initialValue="regular"
            >
              <Select>
                <Option value="regular">
                  {t('editSerieModal.formatRegular')}
                </Option>
                <Option value="vertical">
                  {t('editSerieModal.formatVertical')}
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              className="edit-serie-modal__full"
              label={t('editSerieModal.fieldSynopsis')}
              name="synopsis"
            >
              <TextArea
                autoSize={{ minRows: 3, maxRows: 8 }}
                placeholder={t('editSerieModal.placeholderSynopsis')}
                showCount
                maxLength={1000}
              />
            </Form.Item>

            <Form.Item
              className="edit-serie-modal__full"
              label={t('editSerieModal.fieldReview')}
              name="review"
            >
              <TextArea
                autoSize={{ minRows: 4, maxRows: 10 }}
                placeholder={t('editSerieModal.placeholderReview')}
                showCount
                maxLength={2000}
              />
            </Form.Item>

            <Form.Item
              label={t('editSerieModal.fieldSoundtrack')}
              name="soundtrack"
            >
              <Input placeholder={t('editSerieModal.placeholderSoundtrack')} />
            </Form.Item>

            <Form.Item
              className="edit-serie-modal__full"
              label={t('editSerieModal.fieldObservations')}
              name="observations"
            >
              <TextArea
                autoSize={{ minRows: 3, maxRows: 8 }}
                placeholder={t('editSerieModal.placeholderObservations')}
                showCount
                maxLength={2000}
              />
            </Form.Item>
          </div>
        </Form>
      </Spin>
    </PanelModal>
  );
}
