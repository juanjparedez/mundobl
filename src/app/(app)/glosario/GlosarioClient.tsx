'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Tag,
  Input,
  Radio,
  Segmented,
  Form,
  Button,
  Select,
  message,
} from 'antd';
import { useSession } from 'next-auth/react';
import {
  SearchOutlined,
  BulbOutlined,
  WarningOutlined,
  TranslationOutlined,
  BookOutlined,
  TrophyOutlined,
  LinkOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { EmptyState } from '@/components/design-system/EmptyState/EmptyState';
import type { GlossaryTerm } from '@/data/cultural-glossary';
import type { TranslationKey } from '@/i18n/messages';
import { GlosarioQuiz } from './GlosarioQuiz/GlosarioQuiz';
import './glosario.css';

const COUNTRIES: Array<{
  id: 'all' | GlossaryTerm['country'];
  labelKey: TranslationKey;
}> = [
  { id: 'all', labelKey: 'glosario.countryAll' },
  { id: 'thailand', labelKey: 'glosario.countryThailand' },
  { id: 'korea', labelKey: 'glosario.countryKorea' },
  { id: 'japan', labelKey: 'glosario.countryJapan' },
  { id: 'general', labelKey: 'glosario.countryGeneral' },
];

const CATEGORIES: Array<{
  id: 'all' | GlossaryTerm['category'];
  labelKey: TranslationKey;
}> = [
  { id: 'all', labelKey: 'glosario.categoryAll' },
  { id: 'honorifics', labelKey: 'glosario.categoryHonorifics' },
  { id: 'relationships', labelKey: 'glosario.categoryRelationships' },
  { id: 'genreConcepts', labelKey: 'glosario.categoryGenreConcepts' },
  { id: 'university', labelKey: 'glosario.categoryUniversity' },
  { id: 'fandom', labelKey: 'glosario.categoryFandom' },
];

const CATEGORY_LABEL_BY_ID = new Map<string, TranslationKey>(
  CATEGORIES.map((c) => [c.id, c.labelKey])
);

function categoryLabelKey(category: string): TranslationKey {
  return CATEGORY_LABEL_BY_ID.get(category) ?? 'glosario.categoryAll';
}

interface GlossaryTermData {
  id: number;
  slug: string;
  term: string;
  transliteration: string | null;
  country: string;
  category: string;
  meaning: string;
  context: string;
  commonMistake: string | null;
  examples: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  tagNames: string[];
}

interface GlossaryResource {
  id: number;
  name: string;
  url: string;
  description: string | null;
  language: string | null;
}

interface GlosarioClientProps {
  terms: GlossaryTermData[];
  resources: GlossaryResource[];
}

type GlossaryView = 'dictionary' | 'trivia' | 'resources' | 'contribute';

interface SuggestionFormValues {
  term: string;
  transliteration?: string;
  country: GlossaryTerm['country'];
  category: GlossaryTerm['category'];
  meaning: string;
  context: string;
  examples?: string;
  commonMistake?: string;
  sourceName?: string;
  sourceUrl?: string;
  notes?: string;
}

interface GlossarySuggestion extends SuggestionFormValues {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export function GlosarioClient({ terms, resources }: GlosarioClientProps) {
  const { t } = useLocale();
  const { status: sessionStatus } = useSession();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const [country, setCountry] =
    useState<(typeof COUNTRIES)[number]['id']>('all');
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]['id']>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const term of terms) {
      for (const tagName of term.tagNames) set.add(tagName);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [terms]);
  const [view, setView] = useState<GlossaryView>(() => {
    const requestedView = searchParams.get('view');
    return requestedView === 'trivia' ||
      requestedView === 'resources' ||
      requestedView === 'contribute'
      ? requestedView
      : 'dictionary';
  });
  const [suggestions, setSuggestions] = useState<GlossarySuggestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm<SuggestionFormValues>();

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;

    void fetch('/api/glossary-suggestions')
      .then(async (response) => {
        if (!response.ok)
          throw new Error('No se pudieron cargar tus sugerencias.');
        return (await response.json()) as GlossarySuggestion[];
      })
      .then(setSuggestions)
      .catch((error: unknown) => {
        message.error(
          error instanceof Error
            ? error.message
            : 'Error al cargar sugerencias.'
        );
      });
  }, [sessionStatus]);

  const handleSubmitSuggestion = async (values: SuggestionFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/glossary-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const error =
          result &&
            typeof result === 'object' &&
            'error' in result &&
            typeof result.error === 'string'
            ? result.error
            : 'No se pudo enviar la sugerencia.';
        throw new Error(error);
      }
      setSuggestions((currentSuggestions) => [
        result as GlossarySuggestion,
        ...currentSuggestions,
      ]);
      form.resetFields();
      message.success('Sugerencia enviada para revisión.');
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : 'No se pudo enviar la sugerencia.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return terms.filter((item) => {
      if (country !== 'all' && item.country !== country) return false;
      if (category !== 'all' && item.category !== category) return false;
      if (selectedTag && !item.tagNames.includes(selectedTag)) return false;
      if (!q) return true;
      return (
        item.term.toLowerCase().includes(q) ||
        item.transliteration?.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.context.toLowerCase().includes(q)
      );
    });
  }, [terms, search, country, category, selectedTag]);

  return (
    <div className="glosario-container">
      {/* Hero */}
      <header className="glosario-hero">
        <div className="glosario-hero__badge">
          <TranslationOutlined /> {t('glosario.heroBadge')}
        </div>
        <h1 className="glosario-hero__title">{t('glosario.heroTitle')}</h1>
        <p className="glosario-hero__subtitle">{t('glosario.heroSubtitle')}</p>

        <Segmented
          value={view}
          onChange={(v) => setView(v as GlossaryView)}
          options={[
            {
              label: t('glosario.viewDictionary'),
              value: 'dictionary',
              icon: <BookOutlined />,
            },
            {
              label: t('glosario.viewTrivia'),
              value: 'trivia',
              icon: <TrophyOutlined />,
            },
            {
              label: t('glosario.sectionResources'),
              value: 'resources',
              icon: <LinkOutlined />,
            },
            {
              label: t('glosario.sectionContribute'),
              value: 'contribute',
              icon: <SendOutlined />,
            },
          ]}
        />

        {view === 'dictionary' && (
          <div className="glosario-filters">
            <Input
              prefix={
                <SearchOutlined style={{ color: 'var(--text-secondary)' }} />
              }
              placeholder={t('glosario.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              size="large"
              className="glosario-search"
            />

            <Radio.Group
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              buttonStyle="solid"
              size="middle"
              className="glosario-filter-group"
            >
              {COUNTRIES.map((c) => (
                <Radio.Button key={c.id} value={c.id}>
                  {t(c.labelKey)}
                </Radio.Button>
              ))}
            </Radio.Group>

            <Radio.Group
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              buttonStyle="solid"
              size="middle"
              className="glosario-filter-group"
            >
              {CATEGORIES.map((c) => (
                <Radio.Button key={c.id} value={c.id}>
                  {t(c.labelKey)}
                </Radio.Button>
              ))}
            </Radio.Group>

            {allTags.length > 0 && (
              <div className="glosario-tag-filter">
                <span className="glosario-tag-filter__label">
                  {t('glosario.tagsLabel')}
                </span>
                {allTags.map((tagName) => (
                  <Tag.CheckableTag
                    key={tagName}
                    checked={selectedTag === tagName}
                    onChange={(checked) =>
                      setSelectedTag(checked ? tagName : null)
                    }
                  >
                    {tagName}
                  </Tag.CheckableTag>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {view === 'trivia' ? (
        <GlosarioQuiz terms={terms} />
      ) : view === 'resources' ? (
        <section className="glosario-section">
          <div className="glosario-section__header">
            <h2>{t('glosario.resourcesTitle')}</h2>
            <p>{t('glosario.resourcesDescription')}</p>
          </div>
          {resources.length === 0 ? (
            <EmptyState
              title={t('glosario.resourcesEmptyTitle')}
              description={t('glosario.resourcesEmptyDescription')}
            />
          ) : (
          <div className="glosario-resource-grid">
            {resources.map((resource) => (
              <a
                key={resource.id}
                className="glosario-resource-card"
                href={resource.url}
                target="_blank"
                rel="noreferrer"
              >
                {resource.language && (
                  <span className="glosario-resource-card__meta">
                    <LinkOutlined /> {resource.language}
                  </span>
                )}
                <h3>{resource.name}</h3>
                {resource.description && <p>{resource.description}</p>}
              </a>
            ))}
          </div>
          )}
        </section>
      ) : view === 'contribute' ? (
        <section className="glosario-section">
          <div className="glosario-section__header">
            <h2>{t('glosario.contributeTitle')}</h2>
            <p>{t('glosario.contributeDescription')}</p>
          </div>

          <div className="glosario-contribute__stats">
            <div className="glosario-stat">
              <strong>{terms.length}</strong>
              <span>{t('glosario.approvedTerms')}</span>
            </div>
            <div className="glosario-stat">
              <strong>
                {
                  suggestions.filter(
                    (suggestion) => suggestion.status === 'PENDING'
                  ).length
                }
              </strong>
              <span>{t('glosario.pendingReview')}</span>
            </div>
          </div>

          <div className="glosario-contribute__layout">
            <Form
              form={form}
              className="glosario-form"
              layout="vertical"
              onFinish={handleSubmitSuggestion}
            >
              <div className="glosario-form__grid">
                <Form.Item
                  label={t('glosario.fieldTerm')}
                  name="term"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={t('glosario.fieldTransliteration')}
                  name="transliteration"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={t('glosario.countryGeneral')}
                  name="country"
                  initialValue="general"
                >
                  <Select
                    options={COUNTRIES.filter(
                      (option) => option.id !== 'all'
                    ).map((option) => ({
                      label: t(option.labelKey),
                      value: option.id,
                    }))}
                  />
                </Form.Item>
                <Form.Item
                  label={t('glosario.categoryFandom')}
                  name="category"
                  initialValue="fandom"
                >
                  <Select
                    options={CATEGORIES.filter(
                      (option) => option.id !== 'all'
                    ).map((option) => ({
                      label: t(option.labelKey),
                      value: option.id,
                    }))}
                  />
                </Form.Item>
                <Form.Item
                  label={t('glosario.fieldMeaning')}
                  name="meaning"
                  rules={[{ required: true }]}
                >
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item
                  label={t('glosario.fieldContext')}
                  name="context"
                  rules={[{ required: true }]}
                >
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item
                  label={t('glosario.fieldExamples')}
                  name="examples"
                >
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item
                  label={t('glosario.fieldCommonMistake')}
                  name="commonMistake"
                >
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item
                  label={t('glosario.fieldSourceName')}
                  name="sourceName"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={t('glosario.fieldSourceUrl')}
                  name="sourceUrl"
                >
                  <Input type="url" />
                </Form.Item>
              </div>
              <Form.Item label={t('glosario.fieldNotes')} name="notes">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                {t('glosario.submitSuggestion')}
              </Button>
            </Form>

            <div className="glosario-review-list">
              <h3>{t('glosario.reviewQueue')}</h3>
              {suggestions.length === 0 ? (
                <p className="glosario-empty-queue">
                  {t('glosario.emptyQueue')}
                </p>
              ) : (
                suggestions.map((suggestion) => {
                  const statusKey =
                    `glosario.status${suggestion.status[0].toUpperCase()}${suggestion.status.slice(1)}` as TranslationKey;
                  return (
                    <article
                      className="glosario-review-item"
                      key={suggestion.id}
                    >
                      <div className="glosario-review-item__title-row">
                        <strong>{suggestion.term}</strong>
                        <Tag
                          color={
                            suggestion.status === 'APPROVED'
                              ? 'green'
                              : suggestion.status === 'REJECTED'
                                ? 'red'
                                : 'gold'
                          }
                        >
                          {t(statusKey)}
                        </Tag>
                      </div>
                      <p>{suggestion.meaning}</p>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t('glosario.emptyTitle')}
          description={t('glosario.emptyDescription')}
        />
      ) : (
        <div className="glosario-grid">
                  {filtered.map((item) => (
                    <article key={item.id} className="glosario-card">
              <div className="glosario-card__header">
                <div className="glosario-card__term-wrap">
                  <span className="glosario-card__term">{item.term}</span>
                  {item.transliteration && (
                    <span className="glosario-card__transliteration">
                      ({item.transliteration})
                    </span>
                  )}
                </div>
                <Tag color="blue">{t(categoryLabelKey(item.category))}</Tag>
              </div>

              {item.tagNames.length > 0 && (
                <div className="glosario-card__tags">
                  {item.tagNames.map((tagName) => (
                    <Tag.CheckableTag
                      key={tagName}
                      checked={selectedTag === tagName}
                      onChange={(checked) =>
                        setSelectedTag(checked ? tagName : null)
                      }
                    >
                      {tagName}
                    </Tag.CheckableTag>
                  ))}
                </div>
              )}

              <div className="glosario-card__meaning">
                <strong>{t('glosario.meaningLabel')}</strong> {item.meaning}
              </div>

              <p className="glosario-card__context">{item.context}</p>

              {item.examples && (
                <div className="glosario-card__example">
                  <BulbOutlined />{' '}
                  <span>
                    <strong>{t('glosario.examplesLabel')}</strong>{' '}
                    {item.examples}
                  </span>
                </div>
              )}

              {item.commonMistake && (
                <div className="glosario-card__mistake">
                  <WarningOutlined />{' '}
                  <span>
                    <strong>{t('glosario.commonMistakeLabel')}</strong>{' '}
                    {item.commonMistake}
                  </span>
                </div>
              )}

              {(item.sourceName || item.sourceUrl) && (
                <div className="glosario-card__source">
                  <strong>{t('glosario.sourceLabel')}</strong>{' '}
                  {item.sourceUrl ? (
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                      {item.sourceName || item.sourceUrl}
                    </a>
                  ) : (
                    item.sourceName
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
