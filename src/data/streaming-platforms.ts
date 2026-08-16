export interface PlatformPlan {
  name: string;
  price: string;
  period: string; // 'mes' | 'año' | 'único'
  features: string[];
}

export interface StreamingPlatformInfo {
  id: string;
  name: string;
  color: string;
  website: string;
  logoText: string;
  tagline: string;
  description: string;
  plans: PlatformPlan[];
  uncutAvailable: boolean;
  spanishSubs: boolean;
  freeTier: boolean;
  vpnRequiredLatam: boolean;
  maxQuality: string; // '1080p' | '4K HDR' | '720p'
  bestFor: string;
  highlights: string[];
}

export const STREAMING_PLATFORMS: StreamingPlatformInfo[] = [
  {
    id: 'gagaoolala',
    name: 'GagaOOLala',
    color: '#e91e63',
    website: 'https://www.gagaoolala.com',
    logoText: '💖 GagaOOLala',
    tagline: 'La mayor plataforma de streaming LGBTQ+ y BL de Asia',
    description:
      'Especializada en contenido queer, BL y GL de Taiwán, Japón, Tailandia y Corea. Cuenta con versiones sin censura (Uncut) y subtítulos en español.',
    plans: [
      {
        name: 'Gratuito',
        price: '$0',
        period: 'siempre',
        features: ['Primeros episodios gratis', 'Catálogo libre seleccionado', 'Resolución 720p con anuncios'],
      },
      {
        name: 'VIP Mensual',
        price: '$8.49 USD',
        period: 'mes',
        features: ['Todo el catálogo ilimitado', 'Versiones Uncut sin censura', 'Full HD 1080p sin anuncios', 'Simulcast estrenos en simultáneo'],
      },
      {
        name: 'VIP Anual',
        price: '$79.99 USD',
        period: 'año',
        features: ['Ahorro del 21%', 'Acceso prioritario a festivales', 'Todas las ventajas VIP'],
      },
    ],
    uncutAvailable: true,
    spanishSubs: true,
    freeTier: true,
    vpnRequiredLatam: false,
    maxQuality: '1080p',
    bestFor: 'Versiones completas sin censura y catálogo diverso de Taiwán y Japón.',
    highlights: ['Versiones Uncut exclusivas', 'Subtítulos oficiales en español', 'Sin restricciones geográficas en su mayoría'],
  },
  {
    id: 'viki',
    name: 'Rakuten Viki',
    color: '#1abc9c',
    website: 'https://www.viki.com',
    logoText: '💎 Rakuten Viki',
    tagline: 'El hogar de los K-Dramas y BLs coreanos con subtítulos comunitarios',
    description:
      'Líder en dramas asiáticos con una comunidad global de traducción. Extenso catálogo de K-BLs, dramas taiwaneses y tailandeses.',
    plans: [
      {
        name: 'Estándar Gratis',
        price: '$0',
        period: 'siempre',
        features: ['Títulos clásicos seleccionados', 'Con anuncios', 'Calidad estándar'],
      },
      {
        name: 'Viki Pass Standard',
        price: '$4.99 USD',
        period: 'mes',
        features: ['Acceso a la mayoría de series BL', 'Full HD sin anuncios', 'Transmisión en 2 dispositivos'],
      },
      {
        name: 'Viki Pass Plus',
        price: '$9.99 USD',
        period: 'mes',
        features: ['Todo el catálogo de Kocowa incluido', 'Estrenos inmediatos', 'Full HD sin anuncios'],
      },
    ],
    uncutAvailable: false,
    spanishSubs: true,
    freeTier: true,
    vpnRequiredLatam: false,
    maxQuality: '1080p',
    bestFor: 'BLs coreanos y japoneses con excelente traducción en español.',
    highlights: ['Subtítulos en español de alta calidad', 'Comunidad y comentarios por timestamp', 'App disponible en Smart TV y móviles'],
  },
  {
    id: 'youtube-official',
    name: 'YouTube Oficial (GMMTV / Mandee / Wabi Sabi)',
    color: '#ff0033',
    website: 'https://www.youtube.com',
    logoText: '🔴 YouTube Canales Oficiales',
    tagline: 'Emisión legal y gratuita de las mayores productoras de Tailandia',
    description:
      'GMMTV, Mandee Channel, Studio Wabi Sabi, Me Mind Y y Dee Hup publican sus series completas de forma legal con subtítulos multiidioma.',
    plans: [
      {
        name: 'Emisión Oficial Gratuita',
        price: '$0',
        period: 'siempre',
        features: ['Episodios completos (habitualmente divididos en 4 partes)', 'Subtítulos oficiales CC en español e inglés', 'Resolución hasta 4K'],
      },
      {
        name: 'Membresía de Canal (VIP)',
        price: '$1.99 - $3.99 USD',
        period: 'mes',
        features: ['Behind the scenes exclusivos', 'Insignias y emojis en comentarios en vivo', 'Acceso anticipado a contenido especial'],
      },
    ],
    uncutAvailable: false,
    spanishSubs: true,
    freeTier: true,
    vpnRequiredLatam: false,
    maxQuality: '4K HDR',
    bestFor: 'Series tailandesas completas, gratuitas y de emisión semanal simultánea.',
    highlights: ['100% legal y gratuito', 'Subtítulos en español desde el reproductor', 'Disponible en todos los dispositivos'],
  },
  {
    id: 'iqiyi',
    name: 'iQIYI',
    color: '#00be06',
    website: 'https://www.iq.com',
    logoText: '🟢 iQIYI',
    tagline: 'Plataforma líder en superproducciones BL tailandesas y dramas chinos',
    description:
      'Hogar de producciones exclusivas como KinnPorsche, We Are y series de gran presupuesto. Ofrece versiones Uncut para usuarios VIP.',
    plans: [
      {
        name: 'Gratuito',
        price: '$0',
        period: 'siempre',
        features: ['Episodios con 1 semana de demora', 'Resolución 720p con anuncios'],
      },
      {
        name: 'VIP Estándar',
        price: '$5.99 USD',
        period: 'mes',
        features: ['Estrenos simultáneos y versiones Uncut', 'Full HD 1080p sin anuncios', '2 pantallas simultáneas', 'Descarga de episodios'],
      },
      {
        name: 'VIP Premium',
        price: '$8.99 USD',
        period: 'mes',
        features: ['Audio Dolby Atmos y video 4K', '4 pantallas simultáneas', 'Acceso anticipado a finales'],
      },
    ],
    uncutAvailable: true,
    spanishSubs: true,
    freeTier: true,
    vpnRequiredLatam: false,
    maxQuality: '4K HDR',
    bestFor: 'Superproducciones tailandesas con versiones sin censura y máxima calidad técnica.',
    highlights: ['Versiones Uncut exclusivas', 'Calidad 4K y sonido Dolby Atmos', 'Subtítulos oficiales en español'],
  },
  {
    id: 'wetv',
    name: 'WeTV (Tencent Video)',
    color: '#ff7a00',
    website: 'https://wetv.vip',
    logoText: '🟠 WeTV',
    tagline: 'Plataforma oficial de Tencent para dramas asiáticos y series BL',
    description:
      'Amplia variedad de series tailandesas y taiwanesas (Love Mechanics, We Best Love, etc.) con opción Fast Track.',
    plans: [
      {
        name: 'Gratuito',
        price: '$0',
        period: 'siempre',
        features: ['Episodios emitidos con delay', 'Resolución 720p con publicidad'],
      },
      {
        name: 'VIP Mensual',
        price: '$5.99 USD',
        period: 'mes',
        features: ['Emisión simultánea sin espera', '1080p sin anuncios', 'Opción Fast Track para desbloquear episodios'],
      },
    ],
    uncutAvailable: true,
    spanishSubs: true,
    freeTier: true,
    vpnRequiredLatam: false,
    maxQuality: '1080p',
    bestFor: 'BLs taiwaneses y tailandeses de Tencent y Wabi Sabi.',
    highlights: ['Fast Track para ver antes que nadie', 'Subtítulos en español oficiales'],
  },
  {
    id: 'vimeo-vod',
    name: 'Vimeo On Demand (Strongberry / Productores Indie)',
    color: '#1ab7ea',
    website: 'https://vimeo.com/ondemand',
    logoText: '🎬 Vimeo On Demand',
    tagline: 'Compra y alquiler directo para apoyar a estudios independientes',
    description:
      'Utilizado por productoras independientes coreanas (como Strongberry) para financiar sus cortometrajes y películas sin intermediarios.',
    plans: [
      {
        name: 'Alquiler por título',
        price: '$1.99 - $3.99 USD',
        period: '48 horas',
        features: ['Acceso por 48 horas', 'Streaming Full HD', 'Apoyo 100% directo a los realizadores'],
      },
      {
        name: 'Compra digital de por vida',
        price: '$4.99 - $9.99 USD',
        period: 'único',
        features: ['Acceso permanente ilimitado', 'Descarga en alta calidad', 'Behind the scenes incluidos'],
      },
    ],
    uncutAvailable: true,
    spanishSubs: true,
    freeTier: false,
    vpnRequiredLatam: false,
    maxQuality: '1080p',
    bestFor: 'Cortometrajes y películas coreanas independientes exclusivas.',
    highlights: ['El 90% del dinero va directo al creador', 'Sin suscripciones mensuales recurrentes'],
  },
];
