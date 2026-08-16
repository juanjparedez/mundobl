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
import { CatalogoStatsWidget } from './widgets/CatalogoStatsWidget/CatalogoStatsWidget';
import {
  CatalogoRecentlyAddedWidget,
  type RecentSeriesItem,
} from './widgets/CatalogoRecentlyAddedWidget/CatalogoRecentlyAddedWidget';

const WIDGET_IDS = {
  stats: 'catalogo.stats',
  recentlyAdded: 'catalogo.recentlyAdded',
} as const;

const DEFAULT_LAYOUTS: DashboardLayouts = {
  lg: [
    { i: WIDGET_IDS.stats, x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 3 },
    {
      i: WIDGET_IDS.recentlyAdded,
      x: 0,
      y: 4,
      w: 12,
      h: 8,
      minW: 6,
      minH: 5,
    },
  ],
  md: [
    { i: WIDGET_IDS.stats, x: 0, y: 0, w: 10, h: 4 },
    { i: WIDGET_IDS.recentlyAdded, x: 0, y: 4, w: 10, h: 8 },
  ],
  sm: [
    { i: WIDGET_IDS.stats, x: 0, y: 0, w: 6, h: 5 },
    { i: WIDGET_IDS.recentlyAdded, x: 0, y: 5, w: 6, h: 8 },
  ],
  xs: [
    { i: WIDGET_IDS.stats, x: 0, y: 0, w: 4, h: 7 },
    { i: WIDGET_IDS.recentlyAdded, x: 0, y: 7, w: 4, h: 8 },
  ],
};

export interface CatalogoDashboardClientProps {
  totalSeries: number;
  totalSeasons: number;
  totalEpisodes: number;
  totalActors: number;
  totalCountries: number;
  recentlyAdded: RecentSeriesItem[];
}

export function CatalogoDashboardClient(props: CatalogoDashboardClientProps) {
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { layouts, setLayouts, removeWidget, addWidget, reset, widgetIds } =
    useDashboardLayout('catalogo', DEFAULT_LAYOUTS);

  useMemo(() => {
    WidgetRegistry.register({
      id: WIDGET_IDS.stats,
      category: 'overview',
      labelKey: 'catalogoDashboard.widgetStats',
      descriptionKey: 'catalogoDashboard.widgetStatsDesc',
      defaultSize: { w: 12, h: 4, minW: 6, minH: 3 },
      Component: CatalogoStatsWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.recentlyAdded,
      category: 'media',
      labelKey: 'catalogoDashboard.widgetRecentlyAdded',
      descriptionKey: 'catalogoDashboard.widgetRecentlyAddedDesc',
      defaultSize: { w: 12, h: 8, minW: 6, minH: 5 },
      Component: CatalogoRecentlyAddedWidget as never,
    });
  }, []);

  const widgetProps = useMemo<Record<string, Record<string, unknown>>>(() => {
    const map: Record<string, Record<string, unknown>> = {};
    map[WIDGET_IDS.stats] = {
      totalSeries: props.totalSeries,
      totalSeasons: props.totalSeasons,
      totalEpisodes: props.totalEpisodes,
      totalActors: props.totalActors,
      totalCountries: props.totalCountries,
    };
    map[WIDGET_IDS.recentlyAdded] = { items: props.recentlyAdded };
    return map;
  }, [props]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SectionHeader
        as="h1"
        size="lg"
        title={t('catalogoDashboard.title')}
        subtitle={t('catalogoDashboard.subtitle')}
        actions={
          <Link href="/catalogo">
            <Button icon={<ArrowLeftOutlined />}>
              {t('catalogoDashboard.backToClassic')}
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
