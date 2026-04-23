import type { BusListResponse, BusLine, BusPosition } from '../types'

const BASE_URL = '/api'

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro desconhecido' }))
    throw new Error(err.message ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  getBuses(linha?: string): Promise<BusListResponse> {
    const params = linha ? `?linha=${encodeURIComponent(linha)}` : ''
    return fetchJson<BusListResponse>(`${BASE_URL}/buses${params}`)
  },
  getLines(): Promise<BusLine[]> {
    return fetchJson<BusLine[]>(`${BASE_URL}/buses/lines`)
  },
  getBusByOrdem(ordem: string): Promise<BusPosition> {
    return fetchJson<BusPosition>(`${BASE_URL}/buses/${encodeURIComponent(ordem)}`)
  },
}
