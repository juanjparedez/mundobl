'use client';

import { Skeleton } from 'antd';
import './loading.css';

export default function CatalogoDetailLoading() {
  return (
    <div className="catalogo-detail-loading">
      <Skeleton.Image active className="catalogo-detail-loading__image" />
      <Skeleton
        active
        paragraph={{ rows: 6 }}
        className="catalogo-detail-loading__text"
      />
    </div>
  );
}
