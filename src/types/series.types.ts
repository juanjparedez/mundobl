/**
 * Tipos de datos para el sistema de gestión de series
 */

export interface Serie {
  id: string;
  titulo: string;
  descripcion?: string;
  genero: string[];
  temporadas: number;
  episodios: number;
  anio: number;
  estado: EstadoSerie;
  calificacion?: number;
  imagenUrl?: string;
  fechaAgregado: Date;
  fechaActualizacion: Date;
}

export enum EstadoSerie {
  ACTIVA = 'activa',
  FINALIZADA = 'finalizada',
  CANCELADA = 'cancelada',
  EN_PAUSA = 'en_pausa',
}

export interface FiltrosSeries {
  genero?: string[];
  estado?: EstadoSerie[];
  anioDesde?: number;
  anioHasta?: number;
  busqueda?: string;
}

export interface OpcionOrdenamiento {
  campo: keyof Serie;
  orden: 'asc' | 'desc';
}
