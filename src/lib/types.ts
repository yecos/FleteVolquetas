export interface Volqueta {
  id: string
  placa: string
  marca: string
  modelo: string
  capacidadM3: number
  capacidadTon: number
  conductor: string
  estado: string
  createdAt: string
  _count?: { viajes: number }
}

export interface Tarifa {
  id: string
  tipoVia: string
  precioBase: number
  precioPorKm: number
  precioPorM3: number
  activa: boolean
}

export interface Viaje {
  id: string
  volquetaId: string
  volqueta?: { placa: string; conductor?: string } | null
  origen: string
  destino: string
  distanciaKm: number
  tipoVia: string
  tipoCargue: string
  metrosCubicos: number
  toneladas: number | null
  numViaje: number | null
  cliente: string | null
  hrIni: string | null
  hrFinal: string | null
  klIni: number | null
  klFinal: number | null
  costoFlete: number
  observaciones: string | null
  fecha: string
  estado: string
}

export interface Stats {
  totalVolquetas: number
  volquetasDisponibles: number
  volquetasEnViaje: number
  volquetasMantenimiento: number
  viajesMes: number
  ingresosMes: number
  viajesRecientes: Viaje[]
}

export interface CalcResult {
  tarifaPorM3Km: number
  numViajes: number
  metrosCubicos: number
  distanciaKm: number
  tipoVia: string
  costoTotal: number
  formula: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)

export const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })

export const TIPO_VIA_LABELS: Record<string, string> = {
  pavimentada: 'Pavimentada',
  destapada: 'Destapada',
  terraceria: 'Terracería',
}

export const TIPO_CARGUE_LABELS: Record<string, string> = {
  material_piedra: 'Material Piedra',
  arena: 'Arena',
  escombros: 'Escombros',
  tierra: 'Tierra',
  relleno: 'Relleno',
  descapote: 'Descapote',
  base: 'Base',
  subbase: 'Subbase',
  madera: 'Madera',
  chatarra: 'Chatarra',
}

export const ESTADO_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  'en viaje': 'En Viaje',
  mantenimiento: 'Mantenimiento',
  pendiente: 'Pendiente',
  'en curso': 'En Curso',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

export const estadoColor = (estado: string) => {
  switch (estado) {
    case 'disponible':
    case 'completado':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'en viaje':
    case 'en curso':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'mantenimiento':
    case 'cancelado':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'pendiente':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export const estadoDotColor = (estado: string) => {
  switch (estado) {
    case 'disponible':
    case 'completado':
      return 'bg-emerald-500'
    case 'en viaje':
    case 'en curso':
      return 'bg-amber-500'
    case 'mantenimiento':
    case 'cancelado':
      return 'bg-red-500'
    case 'pendiente':
      return 'bg-slate-400'
    default:
      return 'bg-slate-400'
  }
}
