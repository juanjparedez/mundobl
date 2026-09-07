import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { PanelCard, SectionHeader } from '@/components/design-system';
import { ColaboradorNav } from '../ColaboradorNav';
import '../colaborador.css';
import './guia.css';

export const metadata: Metadata = {
  title: 'Guía de carga | Mi panel de colaborador',
  robots: { index: false, follow: false },
};

// Contenido estatico a proposito: son las reglas con las que ya corre el
// importador (src/lib/episode-parser.ts) y los limites reales de
// src/lib/rate-limit.ts. Si alguna de esas dos cosas cambia, esta pagina
// tiene que cambiar con ellas — por eso viven referenciadas aca abajo.
export default async function ColaboradorGuiaPage() {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== 'COLLABORATOR' && session.user.role !== 'ADMIN')
  ) {
    redirect('/catalogo');
  }

  return (
    <div className="colaborador-page">
      <ColaboradorNav />

      <PanelCard
        header={
          <SectionHeader
            as="h1"
            size="lg"
            title="Guía de carga"
            subtitle="Cómo subir una serie para que se vea bien y no haya que corregirla después."
          />
        }
      >
        <p className="guia-lead">
          Todo lo que cargás entra al catálogo <strong>mirable</strong> (
          <Link href="/ver">/ver</Link>), separado del catálogo curado de{' '}
          <Link href="/catalogo">/catalogo</Link>. Publicás vos: no hay una cola
          de aprobación previa que te frene.
        </p>
      </PanelCard>

      <PanelCard
        header={
          <SectionHeader
            title="1. Títulos de los episodios"
            subtitle="Es lo único de lo que sale la numeración."
          />
        }
      >
        <p>
          La plataforma <strong>no cuenta filas</strong> para numerar capítulos:
          lee el número del título del video en YouTube. Si el título no lo
          trae, se muestra el título tal cual en vez de inventar un número.
          Antes se adivinaba, y salían cosas como &ldquo;Capítulo 5 · Parte
          0&rdquo; arriba de un video que era el EP.2.
        </p>

        <h3 className="guia-h3">Formatos que se reconocen</h3>
        <ul className="guia-list">
          <li>
            <code>EP.12</code>, <code>EP12</code>, <code>Ep. 12</code> — el más
            común en canales tailandeses (GMMTV, Be On Cloud, Idol Factory).
          </li>
          <li>
            <code>S1E12</code>, <code>S01E01</code>, <code>1x12</code> — cuando
            la serie tiene más de una temporada.
          </li>
          <li>
            <code>Episode 12</code>, <code>Episodio 12</code>,{' '}
            <code>Capítulo 12</code>, <code>Season 1 Episode 12</code>.
          </li>
          <li>
            <code>E12</code> suelto después de un separador. Funciona, pero es
            el más frágil: si podés, usá <code>EP.12</code>.
          </li>
        </ul>

        <h3 className="guia-h3">Capítulos partidos en varias partes</h3>
        <p>
          Cuando un capítulo viene en varios videos, el formato que se entiende
          es la fracción entre corchetes o paréntesis:
        </p>
        <ul className="guia-list">
          <li>
            <code>EP.2 [1/4]</code>, <code>EP.2 [2/4]</code>… — la forma
            recomendada.
          </li>
          <li>
            <code>Part 2</code>, <code>Parte 2</code>, <code>Pt.2</code> también
            se leen, con o sin total.
          </li>
        </ul>
        <p className="guia-note">
          No asumas 4 partes por capítulo: si son 5, poné <code>[1/5]</code>. El
          total se lee del título, no se da por sentado.
        </p>

        <h3 className="guia-h3">Etiquetas que se limpian solas</h3>
        <p>
          No hace falta que las saques a mano: <code>[FULL EP]</code>,{' '}
          <code>[ENG SUB]</code>, <code>[THAI SUB]</code>,{' '}
          <code>[OFFICIAL]</code>, <code>[HD]</code>, <code>[4K]</code>,{' '}
          <code>[UNCUT]</code>, <code>[FULL]</code> y <code>[CC]</code> se
          quitan del título limpio que se muestra en la ficha.
        </p>
      </PanelCard>

      <PanelCard
        header={
          <SectionHeader
            title="2. Canales oficiales, siempre"
            subtitle="La regla que sostiene todo el proyecto."
          />
        }
      >
        <ul className="guia-list">
          <li>
            Cargá <strong>solo</strong> videos del canal oficial de la
            productora o del canal que tiene los derechos. Nada de reuploads,
            mirrors ni recopilaciones de terceros.
          </li>
          <li>
            Si el canal oficial te da una playlist completa, importá la playlist
            entera desde{' '}
            <Link href="/admin/colaborador/importar">
              Importar desde YouTube
            </Link>{' '}
            en vez de video por video: se numera mejor y es menos trabajo.
          </li>
          <li>
            Los videos que YouTube marca como{' '}
            <strong>restringidos por edad</strong> llegan destildados en la
            vista previa. Es a propósito: revisalos uno por uno antes de
            incluirlos.
          </li>
          <li>
            Si un video no se puede embeber (el canal lo bloqueó, o hay
            geobloqueo), la ficha lo va a decir en vez de mostrar un reproductor
            que no arranca. No lo fuerces.
          </li>
        </ul>
      </PanelCard>

      <PanelCard
        header={
          <SectionHeader
            title="3. Ficha de la serie"
            subtitle="Los datos que después se usan para buscar y filtrar."
          />
        }
      >
        <ul className="guia-list">
          <li>
            <strong>Título:</strong> el nombre con el que se conoce la serie en
            español o inglés. El título original va en su propio campo, no
            metido entre paréntesis en el principal.
          </li>
          <li>
            <strong>País y año:</strong> cargalos siempre. Son dos de los
            filtros más usados en <Link href="/ver">/ver</Link>.
          </li>
          <li>
            <strong>Sinopsis:</strong> dos o tres frases sin spoilers. Si sólo
            tenés la sinopsis en inglés o tailandés, dejala así: es mejor que
            vacía, y se puede traducir después.
          </li>
          <li>
            <strong>Poster:</strong> vertical. Se genera una miniatura 600x900
            automáticamente.
          </li>
          <li>
            Si la serie <strong>ya existe</strong> en el catálogo curado,
            asociala en vez de duplicarla: quedan enlazadas y se ven los badges
            en las dos fichas.
          </li>
        </ul>
      </PanelCard>

      <PanelCard
        header={
          <SectionHeader
            title="4. Límites y estados"
            subtitle="Qué esperar del sistema mientras cargás."
          />
        }
      >
        <ul className="guia-list">
          <li>
            <strong>200 series por día.</strong> Es un tope pensado para que
            puedas hacer una sesión grande de carga sin quemar la cuota de la
            API de YouTube. Si te queda corto, avisanos y lo ajustamos.
          </li>
          <li>
            <strong>Visible:</strong> el estado normal. Se ve en{' '}
            <Link href="/ver">/ver</Link> apenas tiene episodios con embed.
          </li>
          <li>
            <strong>Oculta:</strong> un admin la sacó de la vista pública
            después de publicada. La seguís viendo vos. Si pasa, te llega una
            notificación con el motivo.
          </li>
          <li>
            Los <strong>trailers y adelantos</strong> quedan fuera del catálogo
            mirable por duración. No es un error: una serie de puros trailers no
            se puede &ldquo;mirar&rdquo;.
          </li>
        </ul>
      </PanelCard>

      <PanelCard
        header={
          <SectionHeader
            title="¿Te quedó una duda?"
            subtitle="No hace falta que la publiques en el foro."
          />
        }
      >
        <p>
          Escribinos por <Link href="/admin/colaborador/soporte">Soporte</Link>:
          es un canal privado entre vos y curaduría. Para proponer una función o
          reportar un bug de la plataforma, ese sí va al{' '}
          <Link href="/feedback">tablero público</Link>.
        </p>
      </PanelCard>
    </div>
  );
}
