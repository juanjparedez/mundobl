// En un route group para que el esqueleto envuelva solo el indice: si
// envolviera tambien a [id], el 404 de una ficha inexistente salia con 200.
import { Spin } from 'antd';

export default function CatalogoLoading() {
  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <Spin size="large" description="Cargando catálogo..." />
      </div>
    </>
  );
}
