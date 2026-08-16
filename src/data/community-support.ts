// ============================================
// Configuración de Apoyo Comunitario & Donaciones
// ============================================
//
// MundoBL es una plataforma 100% independiente y libre de publicidad invasiva.
// Estos enlaces permiten a la comunidad colaborar voluntariamente para cubrir
// los costos de infraestructura (Vercel, Supabase PostgreSQL, dominios).
//
// Podes activar/desactivar cada método completando las URLs correspondientes.

export interface CommunitySupportConfig {
  enabled: boolean;
  cafecito?: {
    enabled: boolean;
    url: string; // ej: "https://cafecito.app/mundobl"
    username: string;
  };
  kofi?: {
    enabled: boolean;
    url: string; // ej: "https://ko-fi.com/mundobl"
    username: string;
  };
  paypal?: {
    enabled: boolean;
    url: string; // ej: "https://paypal.me/mundobl"
  };
  directBank?: {
    enabled: boolean;
    alias: string; // ej: "mundobl.mp"
    cvu?: string;
    titular: string;
  };
  supporterPerks: string[];
}

export const COMMUNITY_SUPPORT: CommunitySupportConfig = {
  // Cambiar a true cuando tengas los enlaces creados
  enabled:
    process.env.NEXT_PUBLIC_ENABLE_COMMUNITY_DONATIONS === 'true' || false,
  cafecito: {
    enabled: false,
    url: 'https://cafecito.app/mundobl',
    username: 'mundobl',
  },
  kofi: {
    enabled: false,
    url: 'https://ko-fi.com/mundobl',
    username: 'mundobl',
  },
  paypal: {
    enabled: false,
    url: 'https://paypal.me/mundobl',
  },
  directBank: {
    enabled: false,
    alias: 'mundobl.comunidad',
    titular: 'Juan José Paredez',
  },
  supporterPerks: [
    '⭐ Badge dorado "Colaborador de la Comunidad" en tu perfil y comentarios',
    '🛡️ Mantenimiento de la plataforma 100% libre de anuncios invasivos',
    '🚀 Prioridad en revisión de sugerencias y aportes de series',
    '❤️ Nuestro agradecimiento eterno en la página de Créditos',
  ],
};
