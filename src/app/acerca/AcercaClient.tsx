'use client';

import Link from 'next/link';
import { Tag, Avatar, Button } from 'antd';
import {
  HeartFilled,
  SafetyCertificateOutlined,
  GithubOutlined,
  UserOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import './acerca.css';

export function AcercaClient() {
  return (
    <div className="acerca-container">
      {/* Hero */}
      <header className="acerca-hero">
        <div className="acerca-hero__badge">
          <HeartFilled style={{ color: '#ff4d4f' }} /> Proyecto Independiente & Comunitario
        </div>
        <h1 className="acerca-hero__title">
          La casa de la comunidad BL & GL en español
        </h1>
        <p className="acerca-hero__subtitle">
          MundoBL nació de una pasión compartida: crear un espacio limpio, rápido, sin publicidad invasiva y 100% legal para descubrir, seguir y debatir las mejores producciones asiáticas y universales.
        </p>
      </header>

      {/* El Equipo */}
      <section className="acerca-section">
        <h2 className="acerca-section__title">
          <UserOutlined /> Quiénes hacemos MundoBL
        </h2>
        <div className="acerca-team-grid">
          <div className="acerca-member-card">
            <Avatar
              size={80}
              icon={<UserOutlined />}
              className="acerca-member-card__avatar"
            />
            <div className="acerca-member-card__info">
              <div className="acerca-member-card__head">
                <h3 className="acerca-member-card__name">Juan José Paredez</h3>
                <Tag color="blue">Desarrollo & Arquitectura</Tag>
              </div>
              <p className="acerca-member-card__bio">
                Desarrollador Full-Stack. Responsable de la arquitectura técnica, diseño de interfaz, optimización de rendimiento y del reproductor integrado de MundoBL.
              </p>
              <div className="acerca-member-card__links">
                <a
                  href="https://github.com/juanjparedez/mundobl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GithubOutlined /> GitHub del Proyecto
                </a>
              </div>
            </div>
          </div>

          <div className="acerca-member-card">
            <Avatar
              size={80}
              icon={<UserOutlined />}
              className="acerca-member-card__avatar acerca-member-card__avatar--flor"
            />
            <div className="acerca-member-card__info">
              <div className="acerca-member-card__head">
                <h3 className="acerca-member-card__name">Flor</h3>
                <Tag color="magenta">Product Owner & Curaduría</Tag>
              </div>
              <p className="acerca-member-card__bio">
                La verdadera experta en BLs y series asiáticas. Responsable de la dirección del producto, selección del catálogo, organización de novedades y el pulso de la comunidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Manifiesto y Valores */}
      <section className="acerca-section">
        <h2 className="acerca-section__title">
          <SafetyCertificateOutlined /> Nuestros Valores y Manifiesto
        </h2>
        <div className="acerca-values-grid">
          <div className="acerca-value-box">
            <div className="acerca-value-box__icon">⚖️</div>
            <h3>100% Legal y Oficial</h3>
            <p>
              No alojamos videos pirateados en servidores propios. Todas las reproducciones se realizan a través de reproductores oficiales autorizados (YouTube, Vimeo, Bilibili, Dailymotion), respetando las vistas y la monetización de las productoras originales.
            </p>
          </div>

          <div className="acerca-value-box">
            <div className="acerca-value-box__icon">🚫</div>
            <h3>Sin cobro de membresías por mirar</h3>
            <p>
              Creemos que el acceso a la cultura y a las series oficiales debe ser libre. No cobramos mensualidades para ver contenido ni te obligamos a pagar para desbloquear episodios.
            </p>
          </div>

          <div className="acerca-value-box">
            <div className="acerca-value-box__icon">🛡️</div>
            <h3>Arbitraje y Guía Transparente</h3>
            <p>
              Te decimos la verdad sobre dónde ver cada serie: cuándo está gratis, cuándo conviene una suscripción VIP (como GagaOOLala o Rakuten Viki) y cuáles tienen versión Uncut sin censura.
            </p>
          </div>

          <div className="acerca-value-box">
            <div className="acerca-value-box__icon">📊</div>
            <h3>Métricas Reales de la Comunidad</h3>
            <p>
              No usamos algoritmos ocultos ni inflamos calificaciones. Los números de calificaciones, favoritos y visualizaciones son 100% transparentes y calculados directamente de los aportes de los usuarios.
            </p>
          </div>
        </div>
      </section>

      {/* Contacto y Feedback */}
      <section className="acerca-contact-box">
        <h3>¿Tenés ideas, sugerencias o querés colaborar?</h3>
        <p>
          MundoBL crece con la comunidad. Si encontrás algún dato para corregir o querés proponer una funcionalidad, estamos siempre escuchando.
        </p>
        <div className="acerca-contact-box__actions">
          <Link href="/feedback">
            <Button type="primary" icon={<CommentOutlined />} size="large">
              Enviar Feedback o Sugerencia
            </Button>
          </Link>
          <Link href="/estadisticas">
            <Button size="large">
              Ver Estadísticas de la Comunidad
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
