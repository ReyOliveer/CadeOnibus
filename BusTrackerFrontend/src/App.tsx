import { useState, useCallback, useRef, useMemo } from 'react'
import { useBuses } from './hooks/useBuses'
import { useDebounce } from './hooks/useDebounce'
import { BusMap, type BusMapHandle } from './components/Map/BusMap'
import { Sidebar } from './components/Sidebar/Sidebar'
import { TopBar } from './components/UI/TopBar'
import { RightPanel } from './components/UI/RightPanel'
import { ErrorBanner } from './components/UI/ErrorBanner'
import { LoadingOverlay } from './components/UI/LoadingOverlay'
import { ProfilePanel } from './components/UI/ProfilePanel'
import type { BusPosition } from './types'

export default function App() {
  const [activeNav, setActiveNav] = useState('Mapa Principal')
  const [lineFilter, setLineFilter] = useState('')
  const [selectedBus, setSelectedBus] = useState<BusPosition | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const lastUpdateRef = useRef<Date | null>(null)
  const mapRef = useRef<BusMapHandle | null>(null)
  const normalizedLineFilter = lineFilter.trim()
  const debouncedLineFilter = useDebounce(normalizedLineFilter, 500)

  const {
    data: busData, isLoading: busLoading, isFetching: busFetching,
    isError: busError, error: busErrorObj, refetch: refetchBuses,
  } = useBuses(debouncedLineFilter)

  const hasEverLoaded = useRef(false)
  if (busData) {
    hasEverLoaded.current = true
    lastUpdateRef.current = new Date()
  }

  const allBuses = busData?.buses ?? []
  const visibleBuses = useMemo(() => allBuses, [allBuses])
  const isFirstLoad = busLoading && !hasEverLoaded.current
  const showEmptyState = !busLoading && !busFetching && !busError && visibleBuses.length === 0

  const handleLineFilterChange = useCallback((value: string) => {
    setLineFilter(value)
    setSelectedBus(null)
  }, [])

  const handleClearSelection = useCallback(() => {
    setLineFilter('')
    setSelectedBus(null)
  }, [])

  const handleSelectBus = useCallback((bus: BusPosition | null) => setSelectedBus(bus), [])
  const handleClearBus = useCallback(() => setSelectedBus(null), [])
  const handleRefresh = useCallback(() => refetchBuses(), [refetchBuses])
  const handleLocateUser = useCallback(() => mapRef.current?.locateUser(), [])

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg)' }}>
      {isFirstLoad && <LoadingOverlay />}

      <Sidebar
        activeNav={activeNav}
        onNavChange={setActiveNav}
        totalBuses={allBuses.length}
        visibleBuses={visibleBuses.length}
        lineFilter={lineFilter}
        onLineFilterChange={handleLineFilterChange}
        onClearSelection={handleClearSelection}
        selectedBus={selectedBus}
        onClearBus={handleClearBus}
        isLoading={busFetching}
        lastUpdate={lastUpdateRef.current}
        isError={busError}
        onRefresh={handleRefresh}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <TopBar
          lineFilter={lineFilter}
          totalShown={visibleBuses.length}
          isLoading={busFetching}
          onRefresh={handleRefresh}
          buses={visibleBuses}
        />

        <BusMap
          ref={mapRef}
          buses={visibleBuses}
          selectedBus={selectedBus}
          onSelectBus={handleSelectBus}
        />

        {showEmptyState && (
          <div
            className="animate-fade-in"
            style={{
              position: 'absolute',
              top: 72,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              minWidth: 320,
              maxWidth: 460,
              padding: '14px 18px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.96)',
              boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
              Nenhum ônibus encontrado
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {normalizedLineFilter
                ? `A API não retornou veículos para a linha "${normalizedLineFilter}".`
                : 'A API não retornou veículos no momento. Tente atualizar novamente.'}
            </div>
          </div>
        )}

        {activeNav === 'Meu Perfil' && (
          <ProfilePanel onClose={() => setActiveNav('Mapa Principal')} />
        )}

        {busError && (
          <ErrorBanner
            message={(busErrorObj as Error)?.message ?? 'Erro ao carregar dados'}
            onRetry={handleRefresh}
          />
        )}

        <button
          type="button"
          onClick={handleLocateUser}
          title="Fixar minha localização"
          style={{
            position: 'absolute',
            bottom: 20,
            left: 16,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minHeight: 48,
            padding: '0 16px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'white',
            color: 'var(--text)',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="5.5" stroke="var(--accent)" strokeWidth="1.5" />
            <circle cx="9" cy="9" r="1.8" fill="var(--accent)" />
            <path d="M9 1.5V4M9 14V16.5M1.5 9H4M14 9H16.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Minha localização
        </button>
      </div>

      <RightPanel
        collapsed={rightCollapsed}
        onToggleCollapse={() => setRightCollapsed(v => !v)}
      />
    </div>
  )
}
