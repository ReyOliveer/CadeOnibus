import { useQuery, useQueries } from '@tanstack/react-query'
import { api } from '../services/api'

const POLL_INTERVAL = 60_000

export function useBuses(linha?: string, enabled = true) {
  const normalizedLine = linha?.trim() ?? ''
  return useQuery({
    queryKey: ['buses', normalizedLine],
    queryFn: () => api.getBuses(normalizedLine || undefined),
    refetchInterval: enabled ? POLL_INTERVAL : false,
    refetchIntervalInBackground: false,
    staleTime: 55_000,
    retry: 2,
    enabled,
  })
}

/** Busca cada linha em paralelo e mescla todos os ônibus num único array. */
export function useMultipleLines(lines: string[]) {
  const results = useQueries({
    queries: lines.map(linha => ({
      queryKey: ['buses', linha],
      queryFn: () => api.getBuses(linha),
      refetchInterval: POLL_INTERVAL,
      refetchIntervalInBackground: false,
      staleTime: 55_000,
      retry: 2,
    })),
  })

  const allBuses = results.flatMap(r => r.data?.buses ?? [])
  const isLoading = results.some(r => r.isLoading)
  const isFetching = results.some(r => r.isFetching)
  const isError = results.some(r => r.isError)
  const error = results.find(r => r.isError)?.error ?? null
  const hasData = results.some(r => r.data != null)
  const refetchAll = () => results.forEach(r => r.refetch())

  return { allBuses, isLoading, isFetching, isError, error, hasData, refetchAll, results }
}

export function useLines() {
  return useQuery({
    queryKey: ['lines'],
    queryFn: () => api.getLines(),
    refetchInterval: 60_000,
    staleTime: 50_000,
    retry: 2,
  })
}
