export interface PlatformPlan {
  name: string;
  price: string;
  period: string; // 'mes' | 'año' | 'único' | '3 meses' | '6 meses'
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
  hasAffiliateProgram: boolean; // Indica si la plataforma cuenta con programa de referidos
  affiliateDisclaimer?: string;
}

export const STREAMING_PLATFORMS: StreamingPlatformInfo[] = [
  {
    id: 'gagaoolala',
    name: 'GagaOOLala',
    color: '#e91e63',
    website: 'https://www.gagaoolala.com',
    logoText: '💖 GagaOOLala',
    tagline: 'La mayor plataforma LGBTQ+ y BL de Asia',
    description:
      'Especializada en contenido queer, BL y GL de Taiwán, Japón, Tailandia y Corea. Es el referente mundial para ver versiones sin censura (Uncut) con subtítulos oficiales en español.',
    plans: [
      {
        name: 'Gratuito',
        price: '$0',
        period: 'siempre',
        features: [
          'Primeros episodios de cada serie gratis',
          'Catálogo libre seleccionado',
          'Resolución 720p con anuncios',
        ],
      },
      {
        name: 'VIP Mensual',
        price: '$8.49 USD',
        period: 'mes',
        features: [
          'Todo el catálogo ilimitado',
          'Versiones Uncut 100% sin censura',
          'Full HD 1080p sin anuncios',
          'Estrenos simultáneos con Asia',
        ],
      },
      {
        name: 'VIP Trimestral',
        price: '$23.99 USD',
        period: '3 meses',
        features: [
          'Ahorro del 6% ($7.99/mes)',
          'Acceso completo a todo el catálogo VIP',
          'Full HD 1080p sin anuncios',
        ],
      },
      {
        name: 'VIP Anual (30% OFF)',
        price: '$59.99 USD',
        period: '12 meses',
        features: [
          'Ahorro del 41% ($4.99/mes)',
          'Acceso prioritario a festivales de cine',
          'Todas las ventajas VIP ilimitadas',
        ],
      },
    ],
    uncutAvailable: true,
    spanishSubs: true,
    freeTier: true,
    vpnRequiredLatam: false,
    maxQuality: '1080p',
    bestFor: 'Versiones completas sin censura y el catálogo más amplio de Taiwán, Japón y Tailandia.',
    highlights: [
      'Versiones Uncut exclusivas',
      'Subtítulos oficiales en español',
      'Disponible en LATAM y España sin VPN',
    ],
    hasAffiliateProgram: true,
    affiliateDisclaimer:
      'Enlace oficial con programa de afiliados. Al suscribirte desde aquí colaborás con el mantenimiento de MundoBL sin costo adicional.',
  },
  {
    id: 'viki',
    name: 'Rakuten Viki',
    color: '#1abc9c',
    website: 'https://www.viki.com',
    logoText: '💎 Rakuten Viki',
    tagline: 'El hogar de los K-Dramas y BLs coreanos con subtítulos comunitarios',
    description:
      'Líder global en dramas asiáticos. Cuenta con el catálogo más completo de BLs coreanos y japoneses, con subtítulos en español de máxima calidad hechos por su comunidad de traductores.',
    plans: [
      {
        name: 'Estándar Gratis',
        price: '$0',
        period: 'siempre',
        features: [
          'Títulos clásicos seleccionados',
          'Con anuncios',
          'Calidad estándar 720p',
        ],
      },
      {
        name: 'Viki Pass Standard',
        price: '$4.99 USD',
        period: 'mes',
        features: [
          'Acceso a la gran mayoría de series BL y K-Dramas',
          'Full HD 1080p sin publicidad',
          'Transmisión en 2 pantallas simultáneas',
          'Opción anual: $49.99 USD / año (17% OFF)',
        ],
      },
      {
        name: 'Viki Pass Plus',
        price: '$9.99 USD',
        period: 'mes',
        features: [
          'Todo el catálogo de Kocowa incluido',
          'Estrenos inmediatos sin delay',
          'Full HD y 4 pantallas simultáneas',
          'Opción anual: $99.99 USD / año',
        ],
      },
    ],
    uncutAvailable: false,
    spanishSubs: true,
    freeTier: true,
    vpnRequiredLatam: false,
    maxQuality: '1080p',
    bestFor: 'BLs coreanos y japoneses con la mejor traducción en español y comunidad activa.',
    highlights: [
      'Subtítulos en español de alta calidad',
      'Comentarios en vivo por timestamp',
      'App en Smart TV, iOS y Android',
    ],
    hasAffiliateProgram: true,
    affiliateDisclaimer:
      'Enlace oficial de Rakuten Viki con programa de afiliados.',
  },
  {
    id: 'iqiyi',
    name: 'iQIYI',
    color: '#00be06',
    website: 'https://www.iq.com',
    logoText: '🟢 iQIYI',
    tagline: 'Líder en superproducciones BL tailandesas y dramas chinos',
    description:
      'Plataforma oficial de superproducciones de alto presupuesto como KinnPorsche, We Are y Love in the Air. Ofrece versiones Uncut extendidas para usuarios VIP.',
    plans: [
      {
        name: 'Gratuito',
        price: '$0',
        period: 'siempre',
        features: ['Episodios con delay', 'Resolución 720p con anuncios'],
      },
      {
        name: 'VIP Mensual',
        price: '$4.99 USD',
        period: 'mes',
        features: [
          'Estrenos simultáneos y versiones Uncut',
          'Full HD 1080p sin anuncios',
          '2 pantallas simultáneas',
          'Descarga offline de episodios',
        ],
      },
      {
        name: 'VIP Trimestral (10% OFF)',
        price: '$13.99 USD',
        period: '3 meses',
        features: [
          '10% de descuento',
          'Acceso completo VIP',
          'Full HD 1080p sin anuncios',
        ],
      },
      {
        name: 'VIP Semestral (20% OFF)',
        price: '$23.99 USD',
        period: '6 meses',
        features: [
          '20% de descuento',
          'Acceso completo VIP',
          'Full HD 1080p sin anuncios',
        ],
      },
      {
        name: 'VIP Anual (30% OFF)',
        price: '$43.99 USD',
        period: '12 meses',
        features: [
          '30% de descuento ($3.66/mes)',
          'Acceso prioritario a finales y versiones Uncut',
          'Todas las ventajas VIP',
        ],
      },
    ],
    uncutAvailable: true,
    spanishSubs: true,
    freeTier: true,
    vpnRequiredLatam: false,
    maxQuality: '4K HDR',
    bestFor: 'Superproducciones tailandesas con versiones sin censura y máxima calidad 4K.',
    highlights: [
      'Versiones Uncut exclusivas',
      'Calidad 4K y sonido Dolby Atmos',
      'Subtítulos oficiales en español',
    ],
    hasAffiliateProgram: true,
    affiliateDisclaimer:
      'Enlace oficial con programa de afiliados iQIYI International.',
  },
  {
    id: 'wetv',
    name: 'WeTV (Tencent Video)',
    color: '#ff7a00',
    website: 'https://wetv.vip',
    logoText: '🟠 WeTV',
    tagline: 'Plataforma oficial de Tencent para dramas asiáticos y BLs',
    description:
      'Distribuidor oficial de series tailandesas y taiwanesas de primer nivel (Love Mechanics, We Best Love, The Untamed) con la opción de Fast Track.',
    plans: [
      {
        name: 'Gratuito',
        price: '$0',
        period: 'siempre',
        features: ['Episodios con delay', 'Resolución 720p con publicidad'],
      },
      {
        name: 'VIP Mensual',
        price: '$5.99 USD',
        period: 'mes',
        features: [
          'Emisión simultánea sin espera',
          'Full HD 1080p sin anuncios',
          'Opción Fast Track para desbloquear episodios anticipados',
        ],
      },
      {
        name: 'VIP Trimestral',
        price: '$16.99 USD',
        period: '3 meses',
        features: ['Acceso VIP completo', '1080p sin anuncios'],
      },
      {
        name: 'VIP Anual',
        price: '$54.99 USD',
        period: '12 meses',
        features: ['Ahorro anual ($4.58/mes)', 'Acceso VIP completo'],
      },
    ],
    uncutAvailable: true,
    spanishSubs: true,
    freeTier: true,
    vpnRequiredLatam: false,
    maxQuality: '1080p',
    bestFor: 'BLs de Tencent y Studio Wabi Sabi con función Fast Track.',
    highlights: [
      'Fast Track para ver capítulos antes de emisión general',
      'Subtítulos en español oficiales',
    ],
    hasAffiliateProgram: false,
    affiliateDisclaimer: 'Enlace oficial directo a WeTV (sin comisión).',
  },
  {
    id: 'youtube-official',
    name: 'YouTube Oficial (GMMTV / Mandee / Wabi Sabi)',
    color: '#ff0033',
    website: 'https://www.youtube.com',
    logoText: '🔴 YouTube Canales Oficiales',
    tagline: 'Emisión legal y gratuita de las mayores productoras de Tailandia',
    description:
      'GMMTV, Mandee Channel, Studio Wabi Sabi, Me Mind Y y Dee Hup House publican sus series completas de forma 100% legal con subtítulos multiidioma.',
    plans: [
      {
        name: 'Emisión Oficial Gratuita',
        price: '$0',
        period: 'siempre',
        features: [
          'Episodios completos (habitualmente divididos en 4 partes)',
          'Subtítulos oficiales CC en español e inglés',
          'Resolución hasta 4K',
        ],
      },
      {
        name: 'Membresía de Canal (VIP Opcional)',
        price: '$1.99 - $3.99 USD',
        period: 'mes',
        features: [
          'Behind the scenes exclusivos',
          'Insignias y emojis en comentarios en vivo',
          'Acceso anticipado a contenido especial',
        ],
      },
    ],
    uncutAvailable: false,
    spanishSubs: true,
    freeTier: true,
    vpnRequiredLatam: false,
    maxQuality: '4K HDR',
    bestFor: 'Series tailandesas completas, gratuitas y de emisión semanal simultánea.',
    highlights: [
      '100% legal y gratuito',
      'Subtítulos en español desde el reproductor',
      'Disponible en todos los dispositivos',
    ],
    hasAffiliateProgram: false,
    affiliateDisclaimer: 'Emisión oficial gratuita en YouTube.',
  },
  {
    id: 'heavenly',
    name: 'Heavenly (Corea)',
    color: '#3f51b5',
    website: 'https://heavenly.tv',
    logoText: '💜 Heavenly',
    tagline: 'La plataforma surcoreana especializada en K-BLs originales',
    description:
      'Plataforma coreana creada específicamente para la producción y distribución de dramas BL (Semantic Error, Ocean Likes Me, Cherry Blossoms After Winter).',
    plans: [
      {
        name: 'Pase por Serie / Episodio',
        price: '$1.99 - $8.99 USD',
        period: 'único / serie',
        features: [
          'Compra de pases por serie completa',
          'Calidad Full HD',
          'Subtítulos en español e inglés',
          'Apoyo directo a producciones coreanas',
        ],
      },
    ],
    uncutAvailable: true,
    spanishSubs: true,
    freeTier: false,
    vpnRequiredLatam: false,
    maxQuality: '1080p',
    bestFor: 'K-BLs coreanos originales y estrenos exclusivos de productoras de Seúl.',
    highlights: [
      'Pionera en dramas BL de Corea del Sur',
      'Subtítulos en español',
    ],
    hasAffiliateProgram: false,
    affiliateDisclaimer: 'Enlace oficial directo a Heavenly.',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    color: '#e50914',
    website: 'https://www.netflix.com',
    logoText: '🎬 Netflix',
    tagline: 'Grandes títulos globales LGBTQ+ y licencias asiáticas selectas',
    description:
      'Cuenta con producciones de renombre mundial (Heartstopper, Young Royals, The Untamed, Gameboys, Wish You, 2gether) con subtítulos y doblajes profesionales.',
    plans: [
      {
        name: 'Estándar con anuncios',
        price: '~$6.99 USD',
        period: 'mes',
        features: ['Full HD 1080p', '2 dispositivos simultáneos', 'Con pausas publicitarias'],
      },
      {
        name: 'Estándar',
        price: '~$15.49 USD',
        period: 'mes',
        features: ['Full HD 1080p sin anuncios', '2 dispositivos simultáneos', 'Descargas offline'],
      },
      {
        name: 'Premium 4K',
        price: '~$22.99 USD',
        period: 'mes',
        features: ['4K Ultra HD + HDR + Audio espacial', '4 dispositivos simultáneos'],
      },
    ],
    uncutAvailable: false,
    spanishSubs: true,
    freeTier: false,
    vpnRequiredLatam: false,
    maxQuality: '4K HDR',
    bestFor: 'Títulos occidentales premiados y licencias comerciales de éxito masivo.',
    highlights: [
      'Doblajes y subtítulos en español de estudio',
      'Excelente compatibilidad en cualquier TV o consola',
    ],
    hasAffiliateProgram: false,
    affiliateDisclaimer: 'Enlace oficial directo a Netflix.',
  },
  {
    id: 'bilibili',
    name: 'Bilibili / Bilibili TV',
    color: '#00a1d6',
    website: 'https://www.bilibili.tv',
    logoText: '📺 Bilibili TV',
    tagline: 'Plataforma asiática para anime, donghua y series BL',
    description:
      'Hogar de numerosas series tailandesas y chinas (donghuas BL como Heaven Official’s Blessing y dramas asiáticos) con subtítulos en varios idiomas.',
    plans: [
      {
        name: 'Gratuito',
        price: '$0',
        period: 'siempre',
        features: ['Acceso con anuncios en 720p'],
      },
      {
        name: 'Premium Mensual',
        price: '$4.99 USD',
        period: 'mes',
        features: ['Acceso a todo el catálogo', '1080p y 4K sin anuncios', 'Descargas offline'],
      },
    ],
    uncutAvailable: false,
    spanishSubs: true,
    freeTier: true,
    vpnRequiredLatam: false,
    maxQuality: '4K HDR',
    bestFor: 'Donghuas y adaptaciones de novelas danmei chinas.',
    highlights: ['Catálogo de animación asiática y BL', 'Subtítulos en español'],
    hasAffiliateProgram: false,
    affiliateDisclaimer: 'Enlace oficial directo a Bilibili TV.',
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
        features: [
          'Acceso por 48 horas',
          'Streaming Full HD',
          'Apoyo 100% directo a los realizadores',
        ],
      },
      {
        name: 'Compra digital de por vida',
        price: '$4.99 - $9.99 USD',
        period: 'único',
        features: [
          'Acceso permanente ilimitado',
          'Descarga en alta calidad',
          'Behind the scenes incluidos',
        ],
      },
    ],
    uncutAvailable: true,
    spanishSubs: true,
    freeTier: false,
    vpnRequiredLatam: false,
    maxQuality: '1080p',
    bestFor: 'Cortometrajes independientes y películas queer coreanas premiadas.',
    highlights: [
      '100% de los ingresos van al creador',
      'Subtítulos oficiales en español',
    ],
    hasAffiliateProgram: false,
    affiliateDisclaimer: 'Compra directa a los realizadores independientes.',
  },
];
