'use client';

import { useState, useMemo } from 'react';
import { Tag, Input, Radio } from 'antd';
import {
  SearchOutlined,
  BulbOutlined,
  WarningOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { CULTURAL_GLOSSARY } from '@/data/cultural-glossary';
import './glosario.css';

export function GlosarioClient() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CULTURAL_GLOSSARY.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.term.toLowerCase().includes(q) ||
        item.transliteration?.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.context.toLowerCase().includes(q)
      );
    });
  }, [search, category]);

  return (
    <div className="glosario-container">
      {/* Hero */}
      <header className="glosario-hero">
        <div className="glosario-hero__badge">
          <TranslationOutlined /> Cultura & Traducción Ética
        </div>
        <h1 className="glosario-hero__title">Glosario Cultural BL & GL</h1>
        <p className="glosario-hero__subtitle">
          Los dramas asiáticos tienen códigos culturales únicos. Acá podés
          consultar el significado real de los honoríficos tailandeses (P’, N’,
          Khun), términos afectivos (Faen, Ti-lak) y evitar los errores típicos
          de la traducción automática.
        </p>

        {/* Buscador y Filtros */}
        <div className="glosario-filters">
          <Input
            prefix={
              <SearchOutlined style={{ color: 'var(--text-secondary)' }} />
            }
            placeholder="Buscar término (ej: P', Faen, SOTUS, Hia)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            size="large"
            className="glosario-search"
          />

          <Radio.Group
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value="all">
              Todos ({CULTURAL_GLOSSARY.length})
            </Radio.Button>
            <Radio.Button value="Honoríficos">Honoríficos</Radio.Button>
            <Radio.Button value="Relaciones">Relaciones & Pareja</Radio.Button>
            <Radio.Button value="Género y Conceptos">Géneros</Radio.Button>
            <Radio.Button value="Cultura Universitaria">
              Universidad
            </Radio.Button>
          </Radio.Group>
        </div>
      </header>

      {/* Grid de Términos */}
      <div className="glosario-grid">
        {filtered.map((item, idx) => (
          <article key={idx} className="glosario-card">
            <div className="glosario-card__header">
              <div className="glosario-card__term-wrap">
                <span className="glosario-card__term">{item.term}</span>
                {item.transliteration && (
                  <span className="glosario-card__transliteration">
                    ({item.transliteration})
                  </span>
                )}
              </div>
              <Tag color="blue">{item.category}</Tag>
            </div>

            <div className="glosario-card__meaning">
              <strong>Significado:</strong> {item.meaning}
            </div>

            <p className="glosario-card__context">{item.context}</p>

            {item.examples && (
              <div className="glosario-card__example">
                <BulbOutlined />{' '}
                <span>
                  <strong>Ejemplos:</strong> {item.examples}
                </span>
              </div>
            )}

            {item.commonMistake && (
              <div className="glosario-card__mistake">
                <WarningOutlined />{' '}
                <span>
                  <strong>Error de traducción común:</strong>{' '}
                  {item.commonMistake}
                </span>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
