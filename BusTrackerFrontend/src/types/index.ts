export interface BusPosition {
  ordem: string
  linha: string
  latitude: number
  longitude: number
  velocidade: number
  dataHora: string
  sentido: 'I' | 'V' | string | null
  trajeto: string | null
  emMovimento: boolean
}

export interface BusLine {
  linha: string
  totalVeiculos: number
  veiculosEmMovimento: number
  velocidadeMedia: number
}

export interface BusListResponse {
  buses: BusPosition[]
  total: number
  cachedAt: string
  filtroLinha: string | null
}

export type SentidoLabel = 'Ida' | 'Volta' | 'N/A'

export function sentidoLabel(sentido: string | null): SentidoLabel {
  if (sentido === 'I') return 'Ida'
  if (sentido === 'V') return 'Volta'
  return 'N/A'
}

export function formatDataHora(dataHora: string): string {
  const date = new Date(dataHora)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function velocidadeCor(v: number): string {
  if (v === 0) return '#94a3b8'
  if (v < 20) return '#d97706'
  if (v < 50) return '#2563eb'
  return '#16a34a'
}
