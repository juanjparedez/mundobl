import type { SerieData, CatalogItem } from './catalogTypes';

/** Agrupa una lista de series en CatalogItems: series que comparten un
 *  universo (2+) se agrupan en un UniverseGroup, el resto queda como
 *  SingleSerie. Extraido de CatalogoClient (antes vivia inline en el
 *  useMemo de `catalogItems`) para que la vista carrusel (categoria
 *  "Sagas y universos") use la MISMA regla — un universo con una sola
 *  serie visible se cuenta como single, no como grupo de 1 — sin
 *  duplicarla. El orden de presentacion (sort) queda a cargo del
 *  caller, no de este helper. */
export function groupIntoCatalogItems(series: SerieData[]): CatalogItem[] {
  const universeMap = new Map<number, SerieData[]>();
  const singles: SerieData[] = [];

  series.forEach((s) => {
    if (s.universoId) {
      const existing = universeMap.get(s.universoId) || [];
      existing.push(s);
      universeMap.set(s.universoId, existing);
    } else {
      singles.push(s);
    }
  });

  const items: CatalogItem[] = [];

  universeMap.forEach((groupSeries, universoId) => {
    if (groupSeries.length > 1) {
      const sorted = [...groupSeries].sort(
        (a, b) => (a.anio || 0) - (b.anio || 0)
      );
      items.push({
        type: 'universe',
        universoId,
        universoNombre: sorted[0].universoNombre || 'Universo',
        series: sorted,
      });
    } else {
      singles.push(groupSeries[0]);
    }
  });

  singles.forEach((serie) => {
    items.push({ type: 'single', serie });
  });

  return items;
}
