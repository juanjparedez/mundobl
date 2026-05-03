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
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';

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
  const { t } = useLocale();
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

      message.success(t('seasonForm.updateSuccess'));
      router.push(`/series/${initialData.seriesId}`);
    } catch (error) {
      message.error(t('seasonForm.saveError'));
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
      message.success(t('seasonForm.uploadSuccess'));

      return false;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('seasonForm.uploadError');
      message.error(errorMessage);
      return false;
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="season-form series-form">
      <Card
        title={
          <div className="series-form__header">
            <div className="series-form__header-left">
              <Link href={`/series/${initialData.seriesId}`}>
                <Button icon={<ArrowLeftOutlined />} type="text">
                  {interpolateMessage(t('seasonForm.backButton'), { title: initialData.seriesTitle })}
                </Button>
              </Link>
              <span>{interpolateMessage(t('seasonForm.headerTitle'), { number: initialData.seasonNumber })}</span>
            </div>
            <Button icon={<CloseOutlined />} onClick={() => router.back()}>
              {t('seasonForm.cancelButton')}
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
            title={`📝 ${t('seasonForm.sectionBasic')}`}
            style={{ marginBottom: 24 }}
          >
            <Row gutter={16}>
              <Col xs={24} md={6}>
                <Form.Item
                  label={t('seasonForm.fieldSeasonNumber')}
                  name="seasonNumber"
                  rules={[{ required: true, message: t('seasonForm.requiredSeasonNumber') }]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
                <Form.Item label={t('seasonForm.fieldTitle')} name="title">
                  <Input placeholder={t('seasonForm.hintTitle')} size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
                <Form.Item label={t('seasonForm.fieldEpisodeCount')} name="episodeCount">
                  <InputNumber
                    min={1}
                    style={{ width: '100%' }}
                    size="large"
                    placeholder={t('seasonForm.hintEpisodeCount')}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
                <Form.Item label={t('seasonForm.fieldYear')} name="year">
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
                  label={`📖 ${t('seasonForm.fieldSynopsis')}`}
                  name="synopsis"
                >
                  <TextArea
                    rows={4}
                    placeholder={t('seasonForm.hintSynopsis')}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label={`📝 ${t('seasonForm.fieldObservations')}`} name="observations">
                  <TextArea
                    rows={3}
                    placeholder={t('seasonForm.hintObservations')}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label={`🖼️ ${t('seasonForm.fieldImage')}`}
                  name="imageUrl"
                  help={t('seasonForm.helpImage')}
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      size="large"
                      placeholder={t('seasonForm.hintImage')}
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
                        {uploading ? t('seasonForm.uploadingLabel') : t('seasonForm.uploadButton')}
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
            title={`👥 ${t('seasonForm.sectionCast')}`}
            style={{ marginBottom: 24 }}
          >
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              {t('seasonForm.castDescription')}
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
                          { required: true, message: t('seasonForm.requiredActorName') },
                        ]}
                        style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
                      >
                        <AutoComplete
                          options={actors.map((a) => ({ value: a }))}
                          placeholder={t('seasonForm.hintActorName')}
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
                        <Input placeholder={t('seasonForm.hintCharacter')} />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'isMain']}
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Checkbox>{t('seasonForm.fieldIsMain')}</Checkbox>
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
                      {t('seasonForm.addActorButton')}
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
                {t('seasonForm.saveButton')}
              </Button>
              <Button size="large" onClick={() => router.back()}>
                {t('seasonForm.cancelButton')}
              </Button>
              <Link href={`/series/${initialData.seriesId}`}>
                <Button size="large">{t('seasonForm.viewSeriesButton')}</Button>
              </Link>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
