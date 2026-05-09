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
import { useLocale } from '@/lib/providers/LocaleProvider';
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
  const { t } = useLocale();
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

      if (!response.ok) throw new Error(t('seasonEditForm.updateSeasonError'));

      message.success(t('seasonEditForm.seasonUpdateSuccess'));
      router.push(`/series/${initialData.seriesId}`);
    } catch (error) {
      message.error(t('seasonEditForm.seasonUpdateError'));
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
              {t('seasonEditForm.editSeasonTitle', {
                seasonNumber: initialData.seasonNumber,
                seriesTitle: initialData.seriesTitle,
              })}
            </span>
            <Button
              icon={<CloseOutlined />}
              onClick={() => router.push(`/series/${initialData.seriesId}`)}
            >
              {t('seasonEditForm.cancelButton')}
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
            title={t('seasonEditForm.infoCardTitle')}
            style={{ marginBottom: 24 }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={t('seasonEditForm.seasonTitleLabel')}
                  name="title"
                >
                  <Input
                    placeholder={t('seasonEditForm.seasonTitlePlaceholder')}
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
                <Form.Item
                  label={t('seasonEditForm.episodeCountLabel')}
                  name="episodeCount"
                >
                  <InputNumber
                    placeholder={t('seasonEditForm.episodeCountPlaceholder')}
                    style={{ width: '100%' }}
                    size="large"
                    min={1}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
                <Form.Item label={t('seasonEditForm.yearLabel')} name="year">
                  <InputNumber
                    placeholder={t('seasonEditForm.yearPlaceholder')}
                    style={{ width: '100%' }}
                    size="large"
                    min={1900}
                    max={2100}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label={t('seasonEditForm.synopsisLabel')}
                  name="synopsis"
                >
                  <TextArea
                    rows={4}
                    placeholder={t('seasonEditForm.synopsisPlaceholder')}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label={t('seasonEditForm.observationsLabel')}
                  name="observations"
                >
                  <TextArea
                    rows={3}
                    placeholder={t('seasonEditForm.observationsPlaceholder')}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Reparto Específico de la Temporada */}
          <Card
            type="inner"
            title={t('seasonEditForm.castCardTitle')}
            style={{ marginBottom: 24 }}
          >
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              {t('seasonEditForm.castDescription')}
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
                          {
                            required: true,
                            message: t('seasonEditForm.actorNameRequired'),
                          },
                        ]}
                        style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
                      >
                        <Input
                          placeholder={t('seasonEditForm.actorNamePlaceholder')}
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'character']}
                        style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
                      >
                        <Input
                          placeholder={t('seasonEditForm.characterPlaceholder')}
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'isMain']}
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Checkbox>
                          {t('seasonEditForm.isMainCheckbox')}
                        </Checkbox>
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
                      {t('seasonEditForm.addActorButton')}
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
                {t('seasonEditForm.saveChangesButton')}
              </Button>
              <Button
                size="large"
                onClick={() => router.push(`/series/${initialData.seriesId}`)}
              >
                {t('seasonEditForm.cancelButton')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
