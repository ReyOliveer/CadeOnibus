<<<<<<< Updated upstream
import { useState, useCallback, useRef, useMemo } from 'react'
import { useBuses } from './hooks/useBuses'
import { useDebounce } from './hooks/useDebounce'
import { BusMap, type BusMapHandle } from './components/Map/BusMap'
=======
import { useState, useCallback, useRef, useMemo, lazy, Suspense } from 'react'
import { useBuses, useMultipleLines } from './hooks/useBuses'
import { useTheme } from './hooks/useTheme'
import type { BusMapHandle } from './components/Map/BusMap'

const BusMap = lazy(() =>
  import('./components/Map/BusMap').then(m => ({ default: m.BusMap }))
)
>>>>>>> Stashed changes
import { Sidebar } from './components/Sidebar/Sidebar'
import { TopBar } from './components/UI/TopBar'
import { RightPanel } from './components/UI/RightPanel'
import { ErrorBanner } from './components/UI/ErrorBanner'
import { LoadingOverlay } from './components/UI/LoadingOverlay'
import { ProfilePanel } from './components/UI/ProfilePanel'
import { BusFilterOverlay } from './components/UI/BusFilterOverlay'
import type { BusPosition } from './types'

export default function App() {
  const [activeNav, setActiveNav] = useState('Mapa Principal')
  const [activeLines, setActiveLines] = useState<string[]>([])
  const [selectedBus, setSelectedBus] = useState<BusPosition | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [forceShowAll, setForceShowAll] = useState(false)
  const lastUpdateRef = useRef<Date | null>(null)
  const mapRef = useRef<BusMapHandle | null>(null)

<<<<<<< Updated upstream
  const {
    data: busData, isLoading: busLoading, isFetching: busFetching,
    isError: busError, error: busErrorObj, refetch: refetchBuses,
  } = useBuses(debouncedLineFilter)
=======
  const shouldFetchAll = activeLines.length === 0
  const {
    data: allBusesData,
    isLoading: allBusesLoading,
    isFetching: allBusesFetching,
    isError: allBusesError,
    error: allBusesErrorObj,
    refetch: refetchAllBuses,
  } = useBuses(undefined, shouldFetchAll)

  const {
    allBuses: multipleBuses,
    isLoading: multipleLoading,
    isFetching: multipleFetching,
    isError: multipleError,
    error: multipleErrorObj,
    hasData,
    refetchAll: refetchMultiple,
  } = useMultipleLines(activeLines)
>>>>>>> Stashed changes

  const hasEverLoaded = useRef(false)
  if (allBusesData || hasData) {
    hasEverLoaded.current = true
    lastUpdateRef.current = new Date()
  }

<<<<<<< Updated upstream
  const allBuses = busData?.buses ?? []
  const visibleBuses = useMemo(() => allBuses, [allBuses])
  const isFirstLoad = busLoading && !hasEverLoaded.current
  const showEmptyState = !busLoading && !busFetching && !busError && visibleBuses.length === 0
=======
  const visibleBuses = useMemo(() => {
    if (activeLines.length > 0) {
      return multipleBuses
    }
    if (forceShowAll) {
      return allBusesData?.buses ?? []
    }
    return []
  }, [activeLines, multipleBuses, forceShowAll, allBusesData])
>>>>>>> Stashed changes

  const totalActiveBusesInRio = allBusesData?.total ?? 0

  const busLoading = activeLines.length > 0 ? multipleLoading : (forceShowAll ? allBusesLoading : false)
  const busFetching = activeLines.length > 0 ? multipleFetching : (forceShowAll ? allBusesFetching : false)
  const busError = activeLines.length > 0 ? multipleError : (forceShowAll ? allBusesError : false)
  const busErrorObj = activeLines.length > 0 ? multipleErrorObj : (forceShowAll ? allBusesErrorObj : null)

  const isFirstLoad = busLoading && !hasEverLoaded.current

  const handleAddLine = useCallback((line: string) => {
    const normalized = line.trim().toUpperCase()
    if (!normalized) return
    setActiveLines(prev => prev.includes(normalized) ? prev : [...prev, normalized])
    setForceShowAll(false)
  }, [])

  const handleRemoveLine = useCallback((line: string) => {
    setActiveLines(prev => prev.filter(l => l !== line))
    setSelectedBus(prev => prev?.linha === line ? null : prev)
  }, [])

  const handleSelectBus = useCallback((bus: BusPosition | null) => setSelectedBus(bus), [])
  const handleClearBus = useCallback(() => setSelectedBus(null), [])
  
  const handleRefresh = useCallback(() => {
    if (activeLines.length > 0) {
      refetchMultiple()
    } else {
      refetchAllBuses()
    }
  }, [activeLines, refetchMultiple, refetchAllBuses])

  const handleLocateUser = useCallback(() => mapRef.current?.locateUser(), [])

  const showOverlay = activeLines.length === 0 && !forceShowAll

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg)' }}>
      {isFirstLoad && <LoadingOverlay />}

      <Sidebar
        activeNav={activeNav}
        onNavChange={setActiveNav}
        activeLines={activeLines}
        onAddLine={handleAddLine}
        onRemoveLine={handleRemoveLine}
        totalBuses={visibleBuses.length}
        selectedBus={selectedBus}
        onClearBus={handleClearBus}
        isLoading={busLoading}
        isFetching={busFetching}
        lastUpdate={lastUpdateRef.current}
        isError={busError}
        onRefresh={handleRefresh}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <TopBar
          lineFilter={activeLines.join(', ')}
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

<<<<<<< Updated upstream
        {showEmptyState && (
=======
        {showOverlay && (
          <BusFilterOverlay
            lineFilter=""
            onLineFilterChange={handleAddLine}
            onBypass={() => setForceShowAll(true)}
            totalBuses={totalActiveBusesInRio}
          />
        )}

        {!busLoading && !busFetching && !busError && activeLines.length > 0 && visibleBuses.length === 0 && hasEverLoaded.current && (
>>>>>>> Stashed changes
          <div
            className="animate-fade-in"
            style={{
              position: 'absolute', top: 72, left: '50%',
              transform: 'translateX(-50%)', zIndex: 1000,
              minWidth: 320, maxWidth: 460,
              padding: '14px 18px', borderRadius: 8,
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
<<<<<<< Updated upstream
              {normalizedLineFilter
                ? `A API não retornou veículos para a linha "${normalizedLineFilter}".`
                : 'A API não retornou veículos no momento. Tente atualizar novamente.'}
=======
              A API não retornou veículos para{' '}
              {activeLines.length === 1
                ? `a linha "${activeLines[0]}"`
                : `as linhas ${activeLines.map(l => `"${l}"`).join(', ')}`}.
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
            position: 'absolute', bottom: 20, left: 16, zIndex: 1000,
            display: 'flex', alignItems: 'center', gap: 10,
            minHeight: 48, padding: '0 16px',
            border: '1px solid var(--border)', borderRadius: 8,
            background: 'var(--bg)', color: 'var(--text)',
            fontSize: 13, fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer',
>>>>>>> Stashed changes
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
