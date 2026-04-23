import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

const POLL_INTERVAL = 60_000

export function useBuses(linha?: string) {
  const normalizedLine = linha?.trim() ?? ''

  return useQuery({
    queryKey: ['buses', normalizedLine],
    queryFn: () => api.getBuses(normalizedLine || undefined),
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: false,
    staleTime: 55_000,
    retry: 2,
  })
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
