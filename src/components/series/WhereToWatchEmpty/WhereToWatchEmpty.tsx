'use client';

import { Button } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import { SeriesSuggestionButton } from '../SuggestionModal/SeriesSuggestionButton';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './WhereToWatchEmpty.css';

interface WhereToWatchEmptyProps {
  seriesId: number;
  seriesTitle: string;
}

/** "Dónde ver" sin datos: lo decimos, y quien sepa lo cuenta en dos clicks. */
export function WhereToWatchEmpty({
  seriesId,
  seriesTitle,
}: WhereToWatchEmptyProps) {
  const { t } = useLocale();
  return (
    <div className="where-to-watch-empty">
      <p className="where-to-watch-empty__text">
        {t('seriesInfo.whereToWatchUnknown')}
      </p>
      <SeriesSuggestionButton
        seriesId={seriesId}
        seriesTitle={seriesTitle}
        initialType="LINK_OFICIAL"
        renderTrigger={(open) => (
          <Button icon={<BulbOutlined />} onClick={open}>
            {t('seriesInfo.whereToWatchSuggest')}
          </Button>
        )}
      />
    </div>
  );
}
