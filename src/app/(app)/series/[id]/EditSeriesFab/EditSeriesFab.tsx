'use client';

import Link from 'next/link';
import { FloatButton } from 'antd';
import { useSession } from 'next-auth/react';
import { EditOutlined } from '@/lib/client-icons';
import { canEditCatalog } from '@/lib/auth-client';
import { FloatButtonPortal } from '@/components/common/FloatButtonPortal/FloatButtonPortal';

interface EditSeriesFabProps {
  seriesId: number;
}

/** Botón flotante para editar — solo admin/moderator. En user regular
 *  apuntaba a /admin/series/X/editar y devolvia 403, asi que ademas de
 *  tapar contenido (reportado por Flor en feedback #98) era un dead-end.
 *  Portalado a body: el backdrop-filter de .app-content rompia el
 *  position:fixed y lo dejaba pegado al fondo del panel en vez de flotar
 *  con el scroll.
 *
 *  Client component propio (en vez de un `canEditCatalog(session...)`
 *  calculado en /series/[id]/page.tsx): la pagina dejo de llamar
 *  `await auth()` para no forzar render dinamico, asi que el chequeo de
 *  rol se resuelve aca via useSession(). */
export function EditSeriesFab({ seriesId }: EditSeriesFabProps) {
  const { data: session } = useSession();

  if (!canEditCatalog(session?.user?.role)) return null;

  return (
    <FloatButtonPortal>
      <Link href={`/admin/series/${seriesId}/editar`} prefetch={false}>
        <FloatButton
          icon={<EditOutlined />}
          type="primary"
          className="series-edit-fab"
          tooltip="Editar serie"
          aria-label="Editar serie"
        />
      </Link>
    </FloatButtonPortal>
  );
}
