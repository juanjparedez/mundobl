'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tag, Input, Radio, Segmented } from 'antd';
import {
  SearchOutlined,
  BulbOutlined,
  WarningOutlined,
  TranslationOutlined,
  BookOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { EmptyState } from '@/components/design-system/EmptyState/EmptyState';
import { CULTURAL_GLOSSARY, type GlossaryTerm } from '@/data/cultural-glossary';
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

const CATEGORY_LABEL_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c.labelKey]));

function categoryLabelKey(category: GlossaryTerm['category']): TranslationKey {
  return CATEGORY_LABEL_BY_ID.get(category) ?? 'glosario.categoryAll';
}

export function GlosarioClient() {
  const { t } = useLocale();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const [country, setCountry] =
    useState<(typeof COUNTRIES)[number]['id']>('all');
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]['id']>('all');
  const [view, setView] = useState<'dictionary' | 'trivia'>(() =>
    searchParams.get('view') === 'trivia' ? 'trivia' : 'dictionary'
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CULTURAL_GLOSSARY.filter((item) => {
      if (country !== 'all' && item.country !== country) return false;
      if (category !== 'all' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.term.toLowerCase().includes(q) ||
        item.transliteration?.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.context.toLowerCase().includes(q)
      );
    });
  }, [search, country, category]);

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
          onChange={(v) => setView(v as 'dictionary' | 'trivia')}
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
          </div>
        )}
      </header>

      {view === 'trivia' ? (
        <GlosarioQuiz />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t('glosario.emptyTitle')}
          description={t('glosario.emptyDescription')}
        />
      ) : (
        <div className="glosario-grid">
          {filtered.map((item, idx) => (
            <article key={idx} className="glosario-card">
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
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
