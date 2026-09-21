import { revalidatePath, revalidateTag } from 'next/cache';
import { getSeriesUrl, getVerUrl } from './slug';

/**
 * Tag de los caches de datos (`unstable_cache`) que alimentan los listados de
 * series. Existe porque `revalidatePath` rehace el HTML de la pagina pero NO
 * vacia un `unstable_cache` que viva adentro: sin el tag, /catalogo se
 * re-renderizaba con los mismos datos viejos hasta que venciera el TTL
 * interno, y por eso ese TTL tenia que quedar corto (900s) — lo cual mandaba
 * al tacho el `revalidate` de la pagina, que Next resuelve como el MINIMO
 * entre el del segmento y el de los caches que usa. Con el tag, el TTL pasa a
 * ser red de seguridad y la frescura la da la invalidacion on-demand.
 */
export const SERIES_LISTINGS_TAG = 'series-listings';

/**
 * Invalidacion on-demand de las superficies publicas de UNA serie.
 *
 * Por que existe este helper y no `revalidatePath('/series/' + id)` suelto:
 * las fichas viven en URLs con slug (`/series/648-title`, ver getSeriesUrl),
 * asi que invalidar `/series/648` apuntaba a un path que no esta en el cache
 * y no hacia nada. El parche que tapaba ese agujero era
 * `revalidatePath('/series/[id]', 'page')`, que si funciona pero tira abajo
 * las ~650 fichas de golpe: cada edicion de una sola serie disparaba una
 * regeneracion masiva del catalogo entero (ISR writes + Active CPU, las dos
 * cuotas que se pasaron de largo en Vercel). Con la URL real solo se rehace
 * lo que cambio.
 *
 * Se invalidan las dos formas (con slug y sin slug) porque getSeriesUrl cae
 * a `/series/{id}` cuando el titulo queda vacio, y porque pueden quedar
 * entradas viejas cacheadas de un titulo anterior.
 */
export function revalidateSeriesDetail(serie: {
  id: number;
  title?: string | null;
}): void {
  revalidatePath(getSeriesUrl(serie.id, serie.title));
  revalidatePath(`/series/${serie.id}`);
  revalidatePath(getVerUrl(serie.id, serie.title));
  revalidatePath(`/ver/${serie.id}`);
}

/**
 * Listados que muestran series y por lo tanto quedan viejos cuando se crea,
 * edita o borra una. Son pocas paginas, asi que invalidarlas en cada cambio
 * es barato — al reves de lo que pasaba con las fichas.
 */
export function revalidateSeriesListings(): void {
  // Next 16 pide un perfil de cacheLife como segundo argumento.
  // `{ expire: 0 }` = purga inmediata, que es lo que queremos: el admin
  // acaba de guardar y espera ver el cambio. (`updateTag`, el atajo para
  // esto, solo se puede llamar desde Server Actions, no desde un Route
  // Handler como los de /api.)
  revalidateTag(SERIES_LISTINGS_TAG, { expire: 0 });
  revalidatePath('/admin/series');
  revalidatePath('/catalogo');
  revalidatePath('/ver');
  // La parrilla de /estrenos sale de `airDays`, que se edita junto con la
  // serie; sin esto el cambio no se ve hasta que expire el ISR.
  revalidatePath('/estrenos');
  revalidatePath('/');
}

/** Atajo para el caso comun: cambio en una serie -> ficha + listados. */
export function revalidateSeries(serie: {
  id: number;
  title?: string | null;
}): void {
  revalidateSeriesDetail(serie);
  revalidateSeriesListings();
}
