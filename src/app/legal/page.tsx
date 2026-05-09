import type { Metadata } from 'next';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import './legal.css';

export const metadata: Metadata = {
  title: 'Aviso legal y derechos de autor',
  description:
    'Aviso legal sobre el uso de contenido embebido en MundoBL: créditos, derechos y procedimiento de baja (takedown).',
  alternates: { canonical: '/legal' },
};

export default function LegalPage() {
  return (
    <AppLayout>
      <div className="legal-page">
        <Breadcrumbs
          items={[{ name: 'Inicio', href: '/' }, { name: 'Legal' }]}
        />

        <article className="legal-article">
          <h1>Aviso legal y derechos de autor</h1>

          <section>
            <h2>Sobre el contenido reproducido</h2>
            <p>
              MundoBL es un catálogo de series asiáticas BL/GL con fines
              informativos y de divulgación. <strong>No alojamos videos</strong>
              : todos los reproductores presentes en el sitio (en{' '}
              <Link href="/ver">/ver</Link>, fichas de series y{' '}
              <Link href="/contenido">/contenido</Link>) son{' '}
              <em>iframes oficiales</em> proporcionados por las plataformas de
              origen (YouTube, Vimeo, Bilibili, Dailymotion, Spotify) bajo sus
              respectivos términos de uso, que permiten el embed.
            </p>
            <p>
              Los derechos sobre cada obra audiovisual pertenecen exclusivamente
              a sus titulares: productoras, distribuidoras, estudios y artistas.
              La presencia de un embed en MundoBL no implica afiliación, endoso
              ni cesión de derechos: es un enlace técnico al canal oficial donde
              la propia productora decidió publicar el contenido.
            </p>
          </section>

          <section>
            <h2>Atribución</h2>
            <p>
              Cada reproductor incluye la atribución visible al canal o
              productora que publicó el video, con un link directo al canal
              oficial. La lista completa de fuentes que usamos está en{' '}
              <Link href="/creditos">Créditos</Link>.
            </p>
          </section>

          <section>
            <h2>Política de baja (DMCA / takedown)</h2>
            <p>
              Si sos titular de derechos sobre alguno de los contenidos
              embebidos en este sitio y querés solicitar la baja del embed,
              escribinos. Vamos a remover el iframe en cuanto verifiquemos la
              solicitud. Aclaramos que <strong>no podemos</strong> eliminar el
              video original — eso solo lo puede hacer la plataforma donde está
              alojado (ej. YouTube).
            </p>
            <p>Para acelerar la verificación, tu mensaje debería incluir:</p>
            <ul>
              <li>Identificación del titular de derechos (nombre/empresa).</li>
              <li>
                URL exacta de la página dentro de MundoBL donde aparece el
                embed.
              </li>
              <li>URL del video original que querés que sea desembebido.</li>
              <li>
                Declaración de buena fe sobre la titularidad o representación de
                los derechos.
              </li>
            </ul>
          </section>

          <section>
            <h2>Contacto</h2>
            <p>
              Mejor canal: a través de <Link href="/feedback">/feedback</Link>{' '}
              seleccionando &laquo;Solicitud de baja&raquo;. Vas a recibir
              confirmación por email.
            </p>
          </section>

          <section>
            <h2>Limitación de responsabilidad</h2>
            <p>
              Reseñas, calificaciones y observaciones publicadas en MundoBL son
              opiniones personales con fines informativos. La calidad, la
              disponibilidad regional y la subtitulación de cada video dependen
              de la plataforma de origen y pueden cambiar sin previo aviso.
            </p>
          </section>
        </article>
      </div>
    </AppLayout>
  );
}
