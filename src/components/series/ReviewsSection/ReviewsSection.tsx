'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
  Space,
  Spin,
  Switch,
  Tag,
} from 'antd';
import {
  ClockCircleOutlined,
  DeleteOutlined,
  DislikeFilled,
  DislikeOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  LikeFilled,
  LikeOutlined,
  PlusOutlined,
  StarFilled,
  TranslationOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import { interpolateMessage } from '@/lib/i18n-format';
import { SpoilerGate } from '@/components/common/SpoilerGate/SpoilerGate';
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
  unhelpfulCount: number;
  hasSpoilers: boolean;
  isFeatured: boolean;
  myVote: boolean | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: ReviewUser | null;
}

interface ReviewsSectionProps {
  seriesId: number;
  // Si la serie ya esta VISTA o ABANDONADA, no aplicamos el gate
  // sobre reseñas con spoilers. Default: false (asumir no vista).
  seriesWatched?: boolean;
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

export function ReviewsSection({
  seriesId,
  seriesWatched = false,
}: ReviewsSectionProps) {
  const { data: session } = useSession();
  const { locale, t } = useLocale();
  const message = useMessage();

  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const [editingId, setEditingId] = useState<number | null>(null);

  // Estado del asistente IA (Gemini)
  type AiAction = 'polish' | 'translate' | 'suggest-title' | 'spoiler-check';
  const [aiBusy, setAiBusy] = useState<AiAction | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{
    field: 'title' | 'body';
    text: string;
  } | null>(null);
  const [spoilerWarning, setSpoilerWarning] = useState<string[] | null>(null);
  const [translateTo, setTranslateTo] = useState<string>('en');
  // Cooldown disparado por 429 (en segundos restantes; 0 = sin cooldown).
  const [aiCooldown, setAiCooldown] = useState(0);
  // Cache simple de respuestas IA por (action + body + lang + target).
  const aiCacheRef = useRef<Map<string, unknown>>(new Map());

  // Tick del countdown de cooldown.
  useEffect(() => {
    if (aiCooldown <= 0) return;
    const interval = setInterval(() => {
      setAiCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [aiCooldown]);

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
    if (submitting || aiBusy) return;
    setModalOpen(false);
    form.resetFields();
    setEditingId(null);
    setAiSuggestion(null);
    setSpoilerWarning(null);
  };

  const callAi = async (
    action: AiAction,
    payload: Record<string, unknown>
  ): Promise<unknown> => {
    if (aiCooldown > 0) {
      throw new Error(t('reviews.aiCooldownActive'));
    }
    // Dedupe: si la misma combinacion ya devolvio resultado, lo reusamos.
    const cacheKey = JSON.stringify({ action, ...payload });
    const cached = aiCacheRef.current.get(cacheKey);
    if (cached !== undefined) return cached;

    setAiBusy(action);
    try {
      const res = await fetch('/api/reviews/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = (await res.json()) as {
        error?: string;
        source?: string;
      } & Record<string, unknown>;
      if (!res.ok) {
        if (res.status === 429) {
          // Throttle local = 60s, Gemini = 60s tambien (ventana por minuto).
          setAiCooldown(60);
        }
        throw new Error(data.error || 'Error');
      }
      aiCacheRef.current.set(cacheKey, data);
      return data;
    } finally {
      setAiBusy(null);
    }
  };

  const handleAiPolish = async () => {
    const body = (form.getFieldValue('body') as string | undefined)?.trim();
    if (!body) {
      message.warning(t('reviews.aiNeedBody'));
      return;
    }
    try {
      const result = (await callAi('polish', {
        body,
        language: form.getFieldValue('language'),
      })) as { text: string };
      setAiSuggestion({ field: 'body', text: result.text });
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('reviews.aiError')
      );
    }
  };

  const handleAiSuggestTitle = async () => {
    const body = (form.getFieldValue('body') as string | undefined)?.trim();
    if (!body) {
      message.warning(t('reviews.aiNeedBody'));
      return;
    }
    try {
      const result = (await callAi('suggest-title', {
        body,
        language: form.getFieldValue('language'),
      })) as { text: string };
      setAiSuggestion({ field: 'title', text: result.text });
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('reviews.aiError')
      );
    }
  };

  const handleAiTranslate = async () => {
    const body = (form.getFieldValue('body') as string | undefined)?.trim();
    if (!body) {
      message.warning(t('reviews.aiNeedBody'));
      return;
    }
    try {
      const result = (await callAi('translate', {
        body,
        title: form.getFieldValue('title'),
        language: form.getFieldValue('language'),
        targetLanguage: translateTo,
      })) as { text: string };
      setAiSuggestion({ field: 'body', text: result.text });
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('reviews.aiError')
      );
    }
  };

  const handleAiSpoilerCheck = async () => {
    const body = (form.getFieldValue('body') as string | undefined)?.trim();
    if (!body) {
      message.warning(t('reviews.aiNeedBody'));
      return;
    }
    try {
      const result = (await callAi('spoiler-check', {
        body,
        language: form.getFieldValue('language'),
      })) as { hasSpoilers: boolean; reasons: string[] };
      if (result.hasSpoilers) {
        setSpoilerWarning(result.reasons);
        if (form.getFieldValue('hasSpoilers') !== true) {
          message.info(t('reviews.spoilerDetectedHint'));
        }
      } else {
        setSpoilerWarning([]);
        message.success(t('reviews.spoilerNoneFound'));
      }
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('reviews.aiError')
      );
    }
  };

  const acceptSuggestion = () => {
    if (!aiSuggestion) return;
    form.setFieldValue(aiSuggestion.field, aiSuggestion.text);
    setAiSuggestion(null);
  };

  const dismissSuggestion = () => setAiSuggestion(null);

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

  const handleVote = async (reviewId: number, helpful: boolean) => {
    if (!session?.user) {
      message.warning(t('reviews.voteLoginRequired'));
      return;
    }
    try {
      const res = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful }),
      });
      const data = (await res.json()) as {
        error?: string;
        myVote?: boolean | null;
        helpfulCount?: number;
        unhelpfulCount?: number;
      };
      if (!res.ok) throw new Error(data.error || 'Error');
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                myVote: data.myVote ?? null,
                helpfulCount: data.helpfulCount ?? r.helpfulCount,
                unhelpfulCount: data.unhelpfulCount ?? r.unhelpfulCount,
              }
            : r
        )
      );
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('reviews.voteError')
      );
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
              {myReview.isFeatured && (
                <Tag color="gold" icon={<StarFilled />}>
                  {t('reviews.featuredTag')}
                </Tag>
              )}
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
            <Card
              key={review.id}
              className={`review-card${review.isFeatured ? ' review-card--featured' : ''}`}
            >
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
                  {review.isFeatured && (
                    <Tag color="gold" icon={<StarFilled />}>
                      {t('reviews.featuredTag')}
                    </Tag>
                  )}
                  <Tag>
                    {LOCALE_LABELS[review.language as never] ?? review.language}
                  </Tag>
                  {renderVerdict(review.verdict)}
                  {review.hasSpoilers && (
                    <Tag color="volcano">{t('reviews.spoilerTag')}</Tag>
                  )}
                </span>
              </div>
              <SpoilerGate
                hide={review.hasSpoilers && !seriesWatched}
                cacheKey={`review-${review.id}`}
                reason={t('spoilerGate.reasonReviewSpoilers')}
              >
                <ReviewBody review={review} renderVerdict={null} />
              </SpoilerGate>
              <div className="review-card__footer">
                <span>
                  <ClockCircleOutlined />{' '}
                  {new Date(
                    review.publishedAt ?? review.createdAt
                  ).toLocaleDateString(locale)}
                </span>
                <Space size={4} className="review-card__votes">
                  <Button
                    size="small"
                    type={review.myVote === true ? 'primary' : 'text'}
                    icon={
                      review.myVote === true ? <LikeFilled /> : <LikeOutlined />
                    }
                    onClick={() => handleVote(review.id, true)}
                    aria-label={t('reviews.voteHelpful')}
                  >
                    {review.helpfulCount}
                  </Button>
                  <Button
                    size="small"
                    type={review.myVote === false ? 'primary' : 'text'}
                    danger={review.myVote === false}
                    icon={
                      review.myVote === false ? (
                        <DislikeFilled />
                      ) : (
                        <DislikeOutlined />
                      )
                    }
                    onClick={() => handleVote(review.id, false)}
                    aria-label={t('reviews.voteUnhelpful')}
                  >
                    {review.unhelpfulCount}
                  </Button>
                </Space>
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
            label={
              <span className="reviews-form__label-row">
                {t('reviews.fieldTitle')}
                <Button
                  size="small"
                  type="link"
                  icon={<ThunderboltOutlined />}
                  loading={aiBusy === 'suggest-title'}
                  disabled={Boolean(aiBusy) || aiCooldown > 0}
                  onClick={handleAiSuggestTitle}
                >
                  {t('reviews.aiSuggestTitle')}
                </Button>
              </span>
            }
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

          <div className="reviews-form__ai-bar">
            <Space wrap size="small">
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                loading={aiBusy === 'polish'}
                disabled={Boolean(aiBusy) || aiCooldown > 0}
                onClick={handleAiPolish}
              >
                {t('reviews.aiPolish')}
              </Button>
              <Button
                size="small"
                icon={<WarningOutlined />}
                loading={aiBusy === 'spoiler-check'}
                disabled={Boolean(aiBusy) || aiCooldown > 0}
                onClick={handleAiSpoilerCheck}
              >
                {t('reviews.aiSpoilerCheck')}
              </Button>
              <Space.Compact>
                <Select
                  size="small"
                  value={translateTo}
                  onChange={setTranslateTo}
                  options={SUPPORTED_LOCALES.map((code) => ({
                    value: code,
                    label: LOCALE_LABELS[code],
                  }))}
                  style={{ width: 130 }}
                />
                <Button
                  size="small"
                  icon={<TranslationOutlined />}
                  loading={aiBusy === 'translate'}
                  disabled={Boolean(aiBusy) || aiCooldown > 0}
                  onClick={handleAiTranslate}
                >
                  {t('reviews.aiTranslate')}
                </Button>
              </Space.Compact>
            </Space>
            <span className="reviews-form__ai-meta">
              {aiCooldown > 0
                ? interpolateMessage(t('reviews.aiCooldownMessage'), {
                    s: String(aiCooldown),
                  })
                : t('reviews.aiPoweredBy')}
            </span>
          </div>

          {aiBusy && (
            <div className="reviews-form__ai-loading">
              <Spin size="small" /> <span>{t('reviews.aiThinking')}</span>
            </div>
          )}

          {aiSuggestion && (
            <Alert
              type="info"
              showIcon
              className="reviews-form__ai-suggestion"
              message={
                aiSuggestion.field === 'title'
                  ? t('reviews.aiSuggestionTitle')
                  : t('reviews.aiSuggestionBody')
              }
              description={
                <>
                  <div className="reviews-form__ai-text">
                    {aiSuggestion.text}
                  </div>
                  <Space>
                    <Button
                      size="small"
                      type="primary"
                      onClick={acceptSuggestion}
                    >
                      {t('reviews.aiAccept')}
                    </Button>
                    <Button size="small" onClick={dismissSuggestion}>
                      {t('reviews.aiDiscard')}
                    </Button>
                  </Space>
                </>
              }
            />
          )}

          {spoilerWarning && spoilerWarning.length > 0 && (
            <Alert
              type="warning"
              showIcon
              className="reviews-form__ai-suggestion"
              message={t('reviews.spoilerDetectedTitle')}
              description={
                <ul className="reviews-form__spoiler-list">
                  {spoilerWarning.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              }
            />
          )}

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
