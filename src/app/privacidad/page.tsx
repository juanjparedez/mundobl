import type { Metadata } from 'next';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import './privacidad.css';

export const metadata: Metadata = {
  title: 'Qué guardamos y cómo borrarlo',
  description:
    'Transparencia sobre qué datos almacena MundoBL, cómo se usan y cómo podés exportarlos o borrarlos completamente.',
  alternates: { canonical: '/privacidad' },
};

export default function PrivacidadPage() {
  return (
    <AppLayout>
      <div className="privacidad-page">
        <Breadcrumbs
          items={[{ name: 'Inicio', href: '/' }, { name: 'Privacidad' }]}
        />

        <article className="privacidad-article">
          <header className="privacidad-hero">
            <h1>¿Qué guardamos sobre vos?</h1>
            <p className="privacidad-hero__lead">
              Esto es lo que la app necesita almacenar para funcionar. Tenés
              control total: podés exportar todo, o borrarlo cuando quieras.
            </p>
          </header>

          <section>
            <h2>Lo mínimo, sin sesión</h2>
            <ul>
              <li>
                <strong>Cookies de preferencias</strong> (theme, idioma,
                densidad) — viven en tu browser, no las vemos.
              </li>
              <li>
                <strong>Cookies técnicas</strong> que Next.js y Cloudflare usan
                para servirte el sitio (load balancing, CSRF).
              </li>
              <li>
                <strong>Logs de acceso</strong> (IP, user-agent, ruta) que
                Vercel y Cloudflare guardan automáticamente por días para debug
                y prevención de abuso. No los exponemos en /admin.
              </li>
            </ul>
          </section>

          <section>
            <h2>Si te logueás (Google)</h2>
            <ul>
              <li>
                <strong>Email, nombre, avatar</strong> — los provee Google
                cuando aceptás el login.
              </li>
              <li>
                <strong>Nickname opcional</strong> que vos elegís en tu perfil.
                Si lo dejás vacío, mostramos tu nombre con apellido abreviado
                (ej. <em>Juan P.</em>).
              </li>
              <li>
                <strong>Rol</strong> (USER por default; ADMIN/MODERATOR si te lo
                asigna el admin).
              </li>
            </ul>
          </section>

          <section>
            <h2>Tu actividad en la app</h2>
            <ul>
              <li>
                <strong>Vistas</strong>: qué series y episodios marcaste como
                vistos / viendo / abandonadas / retomar.
              </li>
              <li>
                <strong>Ratings</strong> (estrellas) y{' '}
                <strong>favoritos</strong>.
              </li>
              <li>
                <strong>Reseñas y comentarios</strong> (públicos o privados —
                los marcados como privados solo los ves vos y los admins).
              </li>
              <li>
                <strong>Series que aportaste</strong> a /ver (con tu nickname
                como autor del aporte; cualquiera lo puede ver en /admin aunque
                desde 2026-05-13 ya no se muestra en el front).
              </li>
              <li>
                <strong>Suscripciones</strong> a series (notificaciones cuando
                se sube un episodio nuevo).
              </li>
              <li>
                <strong>Layout customizado</strong> de tu /perfil dashboard
                (orden y visibilidad de widgets — vive en tu cuenta,
                sincronizado entre dispositivos).
              </li>
              <li>
                <strong>Push subscriptions</strong> si habilitaste
                notificaciones push (endpoint del browser + claves de cifrado).
              </li>
            </ul>
          </section>

          <section>
            <h2>Lo que NO guardamos</h2>
            <ul>
              <li>
                <strong>Contraseñas</strong>. El login es OAuth con Google; tu
                password vive en Google, no acá.
              </li>
              <li>
                <strong>Tracking de terceros</strong>. No usamos Google
                Analytics, Meta Pixel, Hotjar, ni similares.
              </li>
              <li>
                <strong>Tu ubicación precisa</strong>. Solo el país inferido por
                Vercel/Cloudflare a partir de la IP, y nunca lo persistimos en
                DB.
              </li>
              <li>
                <strong>El contenido de los videos</strong> que mirás. Todo lo
                que se reproduce son iframes oficiales de YouTube/Vimeo/
                Bilibili/Dailymotion — esas plataformas pueden tener sus propios
                trackers. Ver <Link href="/legal">aviso legal</Link> para más
                sobre embeds.
              </li>
            </ul>
          </section>

          <section className="privacidad-actions">
            <h2>Tus controles</h2>
            <p>Todo accesible desde tu perfil:</p>
            <ul className="privacidad-actions__list">
              <li>
                <Link href="/perfil">
                  <strong>/perfil</strong>
                </Link>{' '}
                → Privacidad y datos:
                <ul>
                  <li>
                    <em>Exportar mis datos</em> — descarga JSON con todo lo que
                    tenés en la app (vistas, ratings, comentarios, favoritos,
                    reseñas, suscripciones, layout). Sin contraseña ni datos de
                    Google.
                  </li>
                  <li>
                    <em>Importar datos</em> — restaurar desde un JSON que
                    exportaste antes (útil para migrar entre cuentas o
                    rollback). Solo agrega, no borra.
                  </li>
                </ul>
              </li>
              <li>
                <Link href="/perfil">
                  <strong>/perfil</strong>
                </Link>{' '}
                → Zona peligrosa:
                <ul>
                  <li>
                    <em>Eliminar cuenta</em> — borra TODO tu rastro de la DB
                    (user, vistas, ratings, comentarios, reseñas, favoritos,
                    suscripciones, push, layout). Requiere confirmación por
                    email. <strong>No es reversible.</strong>
                  </li>
                  <li>
                    <em>Cerrar sesión en todos los dispositivos</em> — invalida
                    todas las sesiones (incluso de otros browsers). No borra
                    datos.
                  </li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h2>¿Dudas?</h2>
            <p>
              Si querés saber algo específico, escribinos por{' '}
              <Link href="/feedback">/feedback</Link>. También está el{' '}
              <Link href="/legal">aviso legal</Link> con info sobre embeds y
              derechos de autor.
            </p>
          </section>
        </article>
      </div>
    </AppLayout>
  );
}
