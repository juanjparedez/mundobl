'use client';

import Link from 'next/link';
import { Button } from 'antd';
import {
  ReadOutlined,
  LockOutlined,
  TeamOutlined,
  ToolOutlined,
  EditOutlined,
  EyeOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './WorkspaceFooter.css';

export interface WorkspaceFooterProps {
  seriesId: number;
}

/** Footer 4-cols del workspace admin (mock catalogo.png).
 *  Col 1: Reseñas públicas (link al endpoint que ya muestra el RightRail)
 *  Col 2: Notas privadas (placeholder hasta que se decida UX de notas
 *         a nivel serie — hoy EpisodeNote es por episode)
 *  Col 3: Actividad del equipo (placeholder hasta wire del AccessLog
 *         filtrado por path /admin/series/[id]/*)
 *  Col 4: Herramientas de administración (links rapidos a editar, ver
 *         publico, listar series, etc.) */
export function WorkspaceFooter({ seriesId }: WorkspaceFooterProps) {
  const { t } = useLocale();

  return (
    <section className="mb-workspace-footer">
      {/* Col 1: Reseñas públicas */}
      <div className="mb-workspace-footer__col">
        <div className="mb-workspace-footer__head">
          <ReadOutlined />
          <h4 className="mb-workspace-footer__title">
            {t('workspace.footerPublicReviewsTitle')}
          </h4>
        </div>
        <p className="mb-workspace-footer__hint">
          {t('workspace.footerPublicReviewsHint')}
        </p>
        <Link href={`/series/${seriesId}#series-section-reviews`}>
          <Button size="small">
            {t('workspace.footerPublicReviewsAction')}
          </Button>
        </Link>
      </div>

      {/* Col 2: Notas privadas */}
      <div className="mb-workspace-footer__col">
        <div className="mb-workspace-footer__head">
          <LockOutlined />
          <h4 className="mb-workspace-footer__title">
            {t('workspace.footerPrivateNotesTitle')}
          </h4>
        </div>
        <p className="mb-workspace-footer__hint">
          {t('workspace.footerPrivateNotesHint')}
        </p>
        <span className="mb-workspace-footer__pending">
          {t('workspace.footerPending')}
        </span>
      </div>

      {/* Col 3: Actividad del equipo */}
      <div className="mb-workspace-footer__col">
        <div className="mb-workspace-footer__head">
          <TeamOutlined />
          <h4 className="mb-workspace-footer__title">
            {t('workspace.footerTeamActivityTitle')}
          </h4>
        </div>
        <p className="mb-workspace-footer__hint">
          {t('workspace.footerTeamActivityHint')}
        </p>
        <span className="mb-workspace-footer__pending">
          {t('workspace.footerPending')}
        </span>
      </div>

      {/* Col 4: Herramientas admin */}
      <div className="mb-workspace-footer__col">
        <div className="mb-workspace-footer__head">
          <ToolOutlined />
          <h4 className="mb-workspace-footer__title">
            {t('workspace.footerAdminToolsTitle')}
          </h4>
        </div>
        <div className="mb-workspace-footer__tools">
          <Link href={`/admin/series/${seriesId}/editar`}>
            <Button size="small" icon={<EditOutlined />}>
              {t('workspace.footerAdminToolsEdit')}
            </Button>
          </Link>
          <Link href={`/series/${seriesId}`}>
            <Button size="small" icon={<EyeOutlined />}>
              {t('workspace.footerAdminToolsView')}
            </Button>
          </Link>
          <Link href="/admin/series">
            <Button size="small" icon={<AppstoreOutlined />}>
              {t('workspace.footerAdminToolsList')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
