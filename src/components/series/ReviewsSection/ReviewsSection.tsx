'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Tag,
  Tooltip,
} from 'antd';
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import { SUPPORTED_LOCALES, LOCALE_LABELS } from '@/i18n/config';
import './ReviewsSection.css';

const { TextArea } = Input;

type Verdict = 'RECOMMENDED' | 'MIXED' | 'SKIP';
type Status = 'DRAFT' | 'PUBLISHED' | 'HIDDEN';

interface ReviewUser {
  id: string;
  name: string | null;
  image: string | null;
}

export interface ReviewData {
  id: number;
  title: string;
  body: string;
  verdict: Verdict | null;
  language: string;
  status: Status;
  plotRating: number | null;
  chemistryRating: number | null;
  ostRating: number | null;
  castingRating: number | null;
  helpfulCount: number;
  hasSpoilers: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: ReviewUser | null;
}

interface ReviewsSectionProps {
  seriesId: number;
}

interface FormValues {
  title: string;
  body: string;
  verdict: Verdict | null;
  language: string;
  hasSpoilers: boolean;
  status: Extract<Status, 'DRAFT' | 'PUBLISHED'>;
  plotRating: number | null;
  chemistryRating: number | null;
  ostRating: number | null;
  castingRating: number | null;
}

const EMPTY_FORM: FormValues = {
  title: '',
  body: '',
  verdict: null,
  language: 'es',
  hasSpoilers: false,
  status: 'PUBLISHED',
  plotRating: null,
  chemistryRating: null,
  ostRating: null,
  castingRating: null,
};

export function ReviewsSection({ seriesId }: ReviewsSectionProps) {
  const { data: session } = useSession();
  const { locale, t } = useLocale();
  const message = useMessage();

  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const [editingId, setEditingId] = useState<number | null>(null);

  const currentUserId = session?.user?.id;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?seriesId=${seriesId}`);
      if (!res.ok) throw new Error('Error al cargar');
      const data: ReviewData[] = await res.json();
      setReviews(data);
    } catch (error) {
      console.error(error);
      message.error(t('reviews.loadError'));
    } finally {
      setLoading(false);
    }
  }, [seriesId, message, t]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const myReview = useMemo(
    () =>
      currentUserId
        ? reviews.find(
            (r) => r.userId === currentUserId && r.language === locale
          )
        : undefined,
    [reviews, currentUserId, locale]
  );

  const otherReviews = useMemo(
    () => reviews.filter((r) => r.id !== myReview?.id),
    [reviews, myReview]
  );

  const openNewModal = () => {
    setEditingId(null);
    form.setFieldsValue({ ...EMPTY_FORM, language: locale });
    setModalOpen(true);
  };

  const openEditModal = (review: ReviewData) => {
    setEditingId(review.id);
    form.setFieldsValue({
      title: review.title,
      body: review.body,
      verdict: review.verdict,
      language: review.language,
      hasSpoilers: review.hasSpoilers,
      status: review.status === 'HIDDEN' ? 'PUBLISHED' : review.status,
      plotRating: review.plotRating,
      chemistryRating: review.chemistryRating,
      ostRating: review.ostRating,
      castingRating: review.castingRating,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    form.resetFields();
    setEditingId(null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesId, ...values }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error');
      }
      message.success(
        values.status === 'DRAFT'
          ? t('reviews.savedDraft')
          : t('reviews.publishedSuccess')
      );
      closeModal();
      await fetchReviews();
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message !== 'Error') {
        message.error(error.message);
      } else {
        message.error(t('reviews.saveError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error');
      message.success(t('reviews.deleteSuccess'));
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error(error);
      message.error(t('reviews.deleteError'));
    }
  };

  const renderVerdict = (verdict: Verdict | null) => {
    if (!verdict) return null;
    const map: Record<Verdict, { color: string; key: string }> = {
      RECOMMENDED: { color: 'green', key: 'reviews.verdictRecommended' },
      MIXED: { color: 'gold', key: 'reviews.verdictMixed' },
      SKIP: { color: 'red', key: 'reviews.verdictSkip' },
    };
    const { color, key } = map[verdict];
    return <Tag color={color}>{t(key as Parameters<typeof t>[0])}</Tag>;
  };

  return (
    <div className="reviews-section">
      <div className="reviews-section__header">
        <p className="reviews-section__subtitle">{t('reviews.subtitle')}</p>
        {session?.user && !myReview && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openNewModal}>
            {t('reviews.writeButton')}
          </Button>
        )}
      </div>

      {!session?.user && (
        <Card className="reviews-section__login">
          <p>{t('reviews.loginPrompt')}</p>
        </Card>
      )}

      {myReview && (
        <Card
          className="review-card review-card--mine"
          title={
            <span className="review-card__mine-title">
              {t('reviews.yourReview')}
              {myReview.status === 'DRAFT' && (
                <Tag color="default">{t('reviews.statusDraft')}</Tag>
              )}
              {myReview.status === 'HIDDEN' && (
                <Tag color="warning" icon={<EyeInvisibleOutlined />}>
                  {t('reviews.statusHidden')}
                </Tag>
              )}
            </span>
          }
          extra={
            <div className="review-card__actions">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditModal(myReview)}
              >
                {t('reviews.edit')}
              </Button>
              <Popconfirm
                title={t('reviews.deleteTitle')}
                onConfirm={() => handleDelete(myReview.id)}
                okText={t('reviews.deleteConfirm')}
                cancelText={t('reviews.cancel')}
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger icon={<DeleteOutlined />}>
                  {t('reviews.delete')}
                </Button>
              </Popconfirm>
            </div>
          }
        >
          <ReviewBody review={myReview} renderVerdict={renderVerdict} />
        </Card>
      )}

      <div className="reviews-section__list">
        <h4 className="reviews-section__list-title">
          {t('reviews.othersTitle')} ({otherReviews.length})
        </h4>
        {loading ? null : otherReviews.length === 0 ? (
          <Empty description={t('reviews.empty')} />
        ) : (
          otherReviews.map((review) => (
            <Card key={review.id} className="review-card">
              <div className="review-card__head">
                <span className="review-card__author">
                  <Avatar
                    src={review.user?.image}
                    icon={!review.user?.image ? <UserOutlined /> : undefined}
                    size={28}
                  />
                  <span>{review.user?.name ?? t('reviews.anonymous')}</span>
                </span>
                <span className="review-card__meta">
                  <Tag>
                    {LOCALE_LABELS[review.language as never] ?? review.language}
                  </Tag>
                  {renderVerdict(review.verdict)}
                  {review.hasSpoilers && (
                    <Tag color="volcano">{t('reviews.spoilerTag')}</Tag>
                  )}
                </span>
              </div>
              <ReviewBody review={review} renderVerdict={null} />
              <div className="review-card__footer">
                <span>
                  <ClockCircleOutlined />{' '}
                  {new Date(
                    review.publishedAt ?? review.createdAt
                  ).toLocaleDateString(locale)}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        title={
          editingId ? t('reviews.modalEditTitle') : t('reviews.modalNewTitle')
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={t('reviews.save')}
        cancelText={t('reviews.cancel')}
        width={720}
      >
        <Form form={form} layout="vertical" initialValues={EMPTY_FORM}>
          <Form.Item
            name="title"
            label={t('reviews.fieldTitle')}
            rules={[{ required: true, max: 160 }]}
          >
            <Input maxLength={160} showCount />
          </Form.Item>
          <Form.Item
            name="body"
            label={t('reviews.fieldBody')}
            rules={[{ required: true, max: 20000 }]}
            tooltip={t('reviews.markdownHint')}
          >
            <TextArea rows={10} maxLength={20000} showCount />
          </Form.Item>

          <div className="reviews-form__row">
            <Form.Item name="verdict" label={t('reviews.fieldVerdict')}>
              <Select
                allowClear
                placeholder={t('reviews.verdictPlaceholder')}
                options={[
                  {
                    value: 'RECOMMENDED',
                    label: t('reviews.verdictRecommended'),
                  },
                  { value: 'MIXED', label: t('reviews.verdictMixed') },
                  { value: 'SKIP', label: t('reviews.verdictSkip') },
                ]}
              />
            </Form.Item>
            <Form.Item name="language" label={t('reviews.fieldLanguage')}>
              <Select
                options={SUPPORTED_LOCALES.map((code) => ({
                  value: code,
                  label: LOCALE_LABELS[code],
                }))}
              />
            </Form.Item>
          </div>

          <div className="reviews-form__row reviews-form__row--ratings">
            <Form.Item name="plotRating" label={t('reviews.ratingPlot')}>
              <InputNumber min={1} max={10} placeholder="1-10" />
            </Form.Item>
            <Form.Item
              name="chemistryRating"
              label={t('reviews.ratingChemistry')}
            >
              <InputNumber min={1} max={10} placeholder="1-10" />
            </Form.Item>
            <Form.Item name="ostRating" label={t('reviews.ratingOst')}>
              <InputNumber min={1} max={10} placeholder="1-10" />
            </Form.Item>
            <Form.Item name="castingRating" label={t('reviews.ratingCasting')}>
              <InputNumber min={1} max={10} placeholder="1-10" />
            </Form.Item>
          </div>

          <div className="reviews-form__row">
            <Form.Item
              name="hasSpoilers"
              label={t('reviews.fieldSpoilers')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item name="status" label={t('reviews.fieldStatus')}>
              <Select
                options={[
                  { value: 'PUBLISHED', label: t('reviews.statusPublished') },
                  { value: 'DRAFT', label: t('reviews.statusDraft') },
                ]}
              />
            </Form.Item>
          </div>
          <Tooltip title={t('reviews.aiAssistTooltip')}>
            <p className="reviews-form__ai-hint">{t('reviews.aiComingSoon')}</p>
          </Tooltip>
        </Form>
      </Modal>
    </div>
  );
}

interface ReviewBodyProps {
  review: ReviewData;
  renderVerdict: ((verdict: Verdict | null) => React.ReactNode) | null;
}

function ReviewBody({ review, renderVerdict }: ReviewBodyProps) {
  return (
    <div className="review-card__body">
      <h3 className="review-card__title">{review.title}</h3>
      {renderVerdict && (
        <div className="review-card__verdict">
          {renderVerdict(review.verdict)}
        </div>
      )}
      <div className="review-card__text">{review.body}</div>
      {(review.plotRating ||
        review.chemistryRating ||
        review.ostRating ||
        review.castingRating) && (
        <div className="review-card__ratings">
          {review.plotRating && <Tag>Plot: {review.plotRating}/10</Tag>}
          {review.chemistryRating && (
            <Tag>Chemistry: {review.chemistryRating}/10</Tag>
          )}
          {review.ostRating && <Tag>OST: {review.ostRating}/10</Tag>}
          {review.castingRating && (
            <Tag>Casting: {review.castingRating}/10</Tag>
          )}
        </div>
      )}
    </div>
  );
}
