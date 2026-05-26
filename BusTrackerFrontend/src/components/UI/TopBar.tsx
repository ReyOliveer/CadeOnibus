import { useMemo } from 'react'
import type { BusPosition } from '../../types'

interface TopBarProps {
  lineFilter: string
  totalShown: number
  isLoading: boolean
  onRefresh: () => void
  buses: BusPosition[]
}

export function TopBar({ lineFilter, totalShown, isLoading, onRefresh, buses }: TopBarProps) {
  const avgSpeed = useMemo(() => {
    const moving = buses.filter(b => b.emMovimento)
    if (!moving.length) return 0
    return moving.reduce((acc, b) => acc + b.velocidade, 0) / moving.length
  }, [buses])

  const normalizedFilter = lineFilter.trim()
  const label = normalizedFilter ? `Linha ${normalizedFilter}` : 'Todas as linhas'

  return (
    <div style={{
      position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1000, background: 'var(--bg)', borderRadius: 8,
      border: '1px solid var(--border)', padding: '7px 14px',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: normalizedFilter ? 'var(--accent)' : 'var(--text)' }}>
        {label}
      </span>

      <span style={{
        fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-muted)',
        background: 'var(--bg-subtle)', padding: '1px 7px',
        borderRadius: 4, border: '1px solid var(--border)',
      }}>
        {totalShown.toLocaleString('pt-BR')} ônibus
      </span>

      <div style={{ height: 16, width: 1, background: 'var(--border)' }} />

      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        Vel. média <strong style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>{avgSpeed.toFixed(0)} km/h</strong>
      </span>

      <div style={{ height: 16, width: 1, background: 'var(--border)' }} />

      <button onClick={onRefresh} disabled={isLoading} style={{
        background: isLoading ? 'var(--accent-light)' : 'transparent',
        border: `1px solid ${isLoading ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 6, padding: '3px 10px', cursor: isLoading ? 'wait' : 'pointer',
        color: isLoading ? 'var(--accent)' : 'var(--text-muted)',
        fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span style={{ display: 'inline-block', animation: isLoading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
        {isLoading ? 'Atualizando...' : '30s'}
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </button>
    </div>
  )
}
