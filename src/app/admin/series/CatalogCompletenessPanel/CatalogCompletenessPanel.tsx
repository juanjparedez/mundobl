import Link from 'next/link';
import { EditOutlined } from '@/lib/client-icons';
import {
  PanelCard,
  SectionHeader,
  StatCard,
  Chip,
} from '@/components/design-system';
import type { CompletenessField } from '@/lib/series-completeness';
import { getCatalogCompletenessReport } from '@/lib/catalog-completeness';
import './CatalogCompletenessPanel.css';

// Admin = español hardcodeado (convención de las páginas /admin, que no
// están i18n'd; solo AdminNav lo está).
const FIELD_LABEL: Record<CompletenessField, string> = {
  synopsis: 'Sinopsis',
  imageUrl: 'Portada',
  directors: 'Directores',
  country: 'País',
  year: 'Año',
  originalTitle: 'Título original',
  review: 'Reseña',
  tags: 'Tags',
  soundtrack: 'OST',
  cast: 'Reparto',
};

/** Panel agregado de completitud del catálogo (#112 fase 2). Server
 *  component: solo muestra el reporte + links al editor para priorizar
 *  curación. Va arriba de la tabla de /admin/series. */
export async function CatalogCompletenessPanel() {
  const { total, average, tiers, worst } = await getCatalogCompletenessReport();

  if (total === 0) return null;

  const pct = (n: number) => Math.round((n / total) * 100);

  return (
    <PanelCard padding="md" className="catalog-completeness">
      <SectionHeader
        title="Completitud del catálogo"
        subtitle={`${total} series curadas · promedio ${average}%`}
      />

      <div className="catalog-completeness__stats">
        <StatCard label="Promedio" value={`${average}%`} />
        <StatCard
          label="Completas"
          value={tiers.high}
          hint={`${pct(tiers.high)}% del catálogo`}
        />
        <StatCard
          label="En progreso"
          value={tiers.mid}
          hint={`${pct(tiers.mid)}% del catálogo`}
        />
        <StatCard
          label="Incompletas"
          value={tiers.low}
          hint={`${pct(tiers.low)}% del catálogo`}
        />
      </div>

      {worst.length > 0 && (
        <div className="catalog-completeness__worst">
          <h3 className="catalog-completeness__worst-title">
            Priorizar curación ({worst.length} más incompletas)
          </h3>
          <ul className="catalog-completeness__list">
            {worst.map((s) => (
              <li key={s.id} className="catalog-completeness__row">
                <Link
                  href={`/admin/series/${s.id}/editar`}
                  prefetch={false}
                  className="catalog-completeness__name"
                >
                  <EditOutlined /> {s.title}
                </Link>
                <Chip
                  tone={
                    s.score < 60
                      ? 'error'
                      : s.score < 85
                        ? 'warning'
                        : 'success'
                  }
                  size="sm"
                >
                  {s.score}%
                </Chip>
                <span className="catalog-completeness__missing">
                  {s.missing.map((f) => (
                    <Chip key={f} tone="neutral" size="sm">
                      {FIELD_LABEL[f]}
                    </Chip>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PanelCard>
  );
}
