// En un route group para que el esqueleto envuelva solo el indice: si
// envolviera tambien a [id], el 404 de una ficha inexistente salia con 200.
import { PageSkeleton } from '@/components/common/PageSkeleton/PageSkeleton';

export default function VerLoading() {
  return <PageSkeleton variant="hub" />;
}
