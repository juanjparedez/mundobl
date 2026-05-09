'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { SectionHeader } from '@/components/design-system';
import {
  DashboardEditToolbar,
  DashboardGrid,
  WidgetPickerDrawer,
  WidgetRegistry,
  useDashboardLayout,
  type DashboardLayouts,
} from '@/components/dashboard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { SerieDetailData } from '../types';
import { SerieHeroWidget } from './widgets/SerieHeroWidget/SerieHeroWidget';
import { SerieInfoWidget } from './widgets/SerieInfoWidget/SerieInfoWidget';
import { SerieActorsWidget } from './widgets/SerieActorsWidget/SerieActorsWidget';
import { SerieRatingsWidget } from './widgets/SerieRatingsWidget/SerieRatingsWidget';
import './dashboard.css';

const WIDGET_IDS = {
  hero: 'serie.hero',
  info: 'serie.info',
  actors: 'serie.actors',
  ratings: 'serie.ratings',
} as const;

const DEFAULT_LAYOUTS: DashboardLayouts = {
  lg: [
    { i: WIDGET_IDS.hero, x: 0, y: 0, w: 12, h: 6, minW: 6, minH: 5 },
    { i: WIDGET_IDS.info, x: 0, y: 6, w: 4, h: 5, minW: 3, minH: 4 },
    { i: WIDGET_IDS.actors, x: 4, y: 6, w: 4, h: 6, minW: 3, minH: 4 },
    { i: WIDGET_IDS.ratings, x: 8, y: 6, w: 4, h: 6, minW: 3, minH: 4 },
  ],
  md: [
    { i: WIDGET_IDS.hero, x: 0, y: 0, w: 10, h: 6 },
    { i: WIDGET_IDS.info, x: 0, y: 6, w: 5, h: 5 },
    { i: WIDGET_IDS.actors, x: 5, y: 6, w: 5, h: 6 },
    { i: WIDGET_IDS.ratings, x: 0, y: 12, w: 10, h: 5 },
  ],
  sm: [
    { i: WIDGET_IDS.hero, x: 0, y: 0, w: 6, h: 7 },
    { i: WIDGET_IDS.info, x: 0, y: 7, w: 6, h: 5 },
    { i: WIDGET_IDS.actors, x: 0, y: 12, w: 6, h: 6 },
    { i: WIDGET_IDS.ratings, x: 0, y: 18, w: 6, h: 5 },
  ],
  xs: [
    { i: WIDGET_IDS.hero, x: 0, y: 0, w: 4, h: 9 },
    { i: WIDGET_IDS.info, x: 0, y: 9, w: 4, h: 5 },
    { i: WIDGET_IDS.actors, x: 0, y: 14, w: 4, h: 6 },
    { i: WIDGET_IDS.ratings, x: 0, y: 20, w: 4, h: 6 },
  ],
};

export interface SerieDashboardClientProps {
  serie: SerieDetailData;
}

export function SerieDashboardClient({ serie }: SerieDashboardClientProps) {
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { layouts, setLayouts, removeWidget, addWidget, reset, widgetIds } =
    useDashboardLayout('series-detail', DEFAULT_LAYOUTS);

  // Registry: idempotente por id, asi que correr en cada mount esta OK.
  useMemo(() => {
    WidgetRegistry.register({
      id: WIDGET_IDS.hero,
      category: 'overview',
      labelKey: 'serieDashboard.widgetHero',
      descriptionKey: 'serieDashboard.widgetHeroDesc',
      defaultSize: { w: 12, h: 6, minW: 6, minH: 5 },
      Component: SerieHeroWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.info,
      category: 'overview',
      labelKey: 'serieDashboard.widgetInfo',
      descriptionKey: 'serieDashboard.widgetInfoDesc',
      defaultSize: { w: 4, h: 5, minW: 3, minH: 4 },
      Component: SerieInfoWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.actors,
      category: 'media',
      labelKey: 'serieDashboard.widgetActors',
      descriptionKey: 'serieDashboard.widgetActorsDesc',
      defaultSize: { w: 4, h: 6, minW: 3, minH: 4 },
      Component: SerieActorsWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.ratings,
      category: 'overview',
      labelKey: 'serieDashboard.widgetRatings',
      descriptionKey: 'serieDashboard.widgetRatingsDesc',
      defaultSize: { w: 4, h: 6, minW: 3, minH: 4 },
      Component: SerieRatingsWidget as never,
    });
  }, []);

  const widgetProps = useMemo((): Record<string, Record<string, unknown>> => {
    const map: Record<string, Record<string, unknown>> = {};
    map[WIDGET_IDS.hero] = { serie };
    map[WIDGET_IDS.info] = { serie };
    map[WIDGET_IDS.actors] = { serie };
    map[WIDGET_IDS.ratings] = { serie };
    return map;
  }, [serie]);

  const backHref = serie.id ? `/catalogo/${serie.id}` : '/catalogo';

  return (
    <div className="mb-serie-dashboard">
      <SectionHeader
        as="h1"
        size="lg"
        title={serie.title}
        subtitle={t('serieDashboard.subtitle')}
        actions={
          <Link href={backHref}>
            <Button icon={<ArrowLeftOutlined />}>
              {t('serieDashboard.backToClassic')}
            </Button>
          </Link>
        }
      />

      <DashboardEditToolbar
        editing={editing}
        onToggleEditing={() => setEditing((v) => !v)}
        onAddWidget={() => setPickerOpen(true)}
        onReset={reset}
      />

      <DashboardGrid
        layouts={layouts}
        widgetProps={widgetProps}
        editing={editing}
        onLayoutsChange={setLayouts}
        onRemoveWidget={removeWidget}
      />

      <WidgetPickerDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addWidget}
        alreadyAdded={widgetIds}
      />
    </div>
  );
}
