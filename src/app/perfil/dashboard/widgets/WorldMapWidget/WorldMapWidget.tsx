'use client';

import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { GlobalOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { ProfileData } from '../../../types';
import './WorldMapWidget.css';

// World topojson de world-atlas (~100KB, 110m resolution — adecuada
// para vista compacta). Las features tienen `id` como ISO 3166-1
// numeric (e.g. 392 = Japan).
import worldTopojson from 'world-atlas/countries-110m.json';

// Mapping ISO-2 (alpha-2 que usa el modelo Country) -> ISO numeric
// (que usa world-atlas como id). Los paises mas relevantes para BL/GL
// estan cubiertos. Para uno que no este, se ignora silenciosamente
// (no rompe el mapa, solo no se ilumina).
const ISO2_TO_NUMERIC: Record<string, string> = {
  KR: '410', // South Korea
  JP: '392', // Japan
  CN: '156', // China
  TW: '158', // Taiwan
  TH: '764', // Thailand
  PH: '608', // Philippines
  VN: '704', // Vietnam
  MY: '458', // Malaysia
  ID: '360', // Indonesia
  IN: '356', // India
  HK: '344', // Hong Kong
  SG: '702', // Singapore
  US: '840', // United States
  GB: '826', // United Kingdom
  BR: '76', // Brazil
  MX: '484', // Mexico
  AR: '32', // Argentina
  ES: '724', // Spain
  FR: '250', // France
  DE: '276', // Germany
  IT: '380', // Italy
  CA: '124', // Canada
  AU: '36', // Australia
  RU: '643', // Russia
};

export interface WorldMapWidgetProps {
  topCountries: ProfileData['stats']['topCountries'];
}

interface GeographyFeature {
  rsmKey: string;
  id?: string | number;
  properties: { name?: string };
}

/** Widget "Países visitados" — mapa SVG mundial con paises iluminados
 *  por count de series vistas de ese pais. Mock-aligned con
 *  style-guide/my-.profile2.png (panel "Heatmap del año / paises").
 *  Complementario a TopCountriesListWidget (lista detallada). */
export function WorldMapWidget({ topCountries }: WorldMapWidgetProps) {
  const { t } = useLocale();
  const [hoveredCountry, setHoveredCountry] = useState<{
    name: string;
    count: number;
  } | null>(null);

  // Index por ISO numeric para lookup O(1) al pintar.
  const countByNumeric = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    for (const c of topCountries) {
      if (!c.code) continue;
      const numericId = ISO2_TO_NUMERIC[c.code.toUpperCase()];
      if (numericId) {
        map.set(numericId, { name: c.name, count: c.count });
      }
    }
    return map;
  }, [topCountries]);

  // Color scale desde bg-spotlight (paises sin data) hasta primary
  // (paises con max count). Lineal en log para distribuir mejor.
  const maxCount = Math.max(1, ...topCountries.map((c) => c.count));
  const colorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, maxCount])
        .range(['rgba(255, 255, 255, 0.04)', 'var(--primary-color, #f6b51e)']),
    [maxCount]
  );

  if (!topCountries || topCountries.length === 0) {
    return (
      <Widget title={t('worldMap.title')} icon={<GlobalOutlined />}>
        <EmptyState
          title={t('worldMap.empty')}
          variant="soft"
          fullHeight={false}
        />
      </Widget>
    );
  }

  return (
    <Widget title={t('worldMap.title')} icon={<GlobalOutlined />} noPadding>
      <div className="mb-world-map">
        <ComposableMap
          projectionConfig={{ scale: 130 }}
          width={800}
          height={400}
          style={{ width: '100%', height: '100%' }}
        >
          <Geographies geography={worldTopojson}>
            {({ geographies }: { geographies: GeographyFeature[] }) =>
              geographies.map((geo) => {
                const id = String(geo.id ?? '');
                const data = countByNumeric.get(id);
                const fill = data
                  ? colorScale(data.count)
                  : 'rgba(255, 255, 255, 0.04)';
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={0.3}
                    style={{
                      default: { outline: 'none' },
                      hover: {
                        fill: data
                          ? 'var(--primary-color, #f6b51e)'
                          : 'rgba(255, 255, 255, 0.1)',
                        outline: 'none',
                        cursor: data ? 'pointer' : 'default',
                      },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={() => {
                      if (data) setHoveredCountry(data);
                    }}
                    onMouseLeave={() => setHoveredCountry(null)}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
        {hoveredCountry && (
          <div className="mb-world-map__tooltip" role="status">
            <strong>{hoveredCountry.name}</strong>
            <span>
              {hoveredCountry.count}{' '}
              {hoveredCountry.count === 1
                ? t('worldMap.serieSingular')
                : t('worldMap.seriePlural')}
            </span>
          </div>
        )}
      </div>
    </Widget>
  );
}
