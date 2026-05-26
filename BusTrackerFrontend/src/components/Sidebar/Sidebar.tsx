import { useState, useCallback } from 'react'
import type { BusPosition } from '../../types'

// Paleta de cores para cada linha adicionada
const LINE_COLORS = [
  '#2563eb', '#7c3aed', '#dc2626', '#16a34a',
  '#d97706', '#0891b2', '#be185d', '#65a30d', '#ea580c', '#0d9488',
]
export function lineColor(linha: string, activeLines: string[]): string {
  const idx = activeLines.indexOf(linha)
  return idx >= 0 ? LINE_COLORS[idx % LINE_COLORS.length] : '#64748b'
}

interface SidebarProps {
  activeNav: string
  onNavChange: (label: string) => void
  activeLines: string[]
  onAddLine: (line: string) => void
  onRemoveLine: (line: string) => void
  totalBuses: number
  selectedBus: BusPosition | null
  onClearBus: () => void
  isLoading: boolean
  isFetching: boolean
  lastUpdate: Date | null
  isError: boolean
  onRefresh: () => void
  collapsed: boolean
  onToggleCollapse: () => void
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
}

type NavItem = { label: string; icon: React.ReactNode }

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Mapa Principal',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4" />
      </svg>
    ),
  },
  {
    label: 'Meu Perfil',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function Sidebar({
  activeNav, onNavChange, activeLines, onAddLine, onRemoveLine,
  totalBuses, selectedBus, onClearBus, isLoading, isFetching, lastUpdate,
  isError, onRefresh, collapsed, onToggleCollapse, theme, onToggleTheme,
}: SidebarProps) {
  const [addInput, setAddInput] = useState('')

  const handleAdd = useCallback(() => {
    const line = addInput.trim().toUpperCase()
    if (!line) return
    onAddLine(line)
    setAddInput('')
  }, [addInput, onAddLine])

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd()
  }

  if (collapsed) {
    return (
      <aside style={{
        width: 52, flexShrink: 0, background: 'var(--bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '12px 0', gap: 6,
      }}>
        <button onClick={onToggleCollapse} title="Expandir" style={btnIcon()}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M7 4l5 5-5 5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '4px 0' }} />
        {NAV_ITEMS.map(item => (
          <button
            key={item.label}
            title={item.label}
            onClick={() => onNavChange(item.label)}
            style={{
              ...btnIcon(),
              color: activeNav === item.label ? 'var(--accent)' : 'var(--text-muted)',
              background: activeNav === item.label ? 'var(--accent-light)' : 'transparent',
              border: `1px solid ${activeNav === item.label ? 'var(--accent)' : 'transparent'}`,
            }}
          >
            {item.icon}
          </button>
        ))}
        {onToggleTheme && (
          <>
            <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '4px 0' }} />
            <button onClick={onToggleTheme} title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`} style={btnIcon()}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </>
        )}
      </aside>
    )
  }

  return (
    <aside style={{
      width: 260, flexShrink: 0, background: 'var(--bg)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 14px 12px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="12" rx="2" fill="white" />
              <circle cx="7" cy="18" r="1.5" fill="white" />
              <circle cx="17" cy="18" r="1.5" fill="white" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            CadeÔnibus
          </span>
        </div>
        <button onClick={onToggleCollapse} title="Recolher" style={{
          width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
            <path d="M11 14l-5-5 5-5" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <div style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map(item => {
          const active = activeNav === item.label
          return (
            <button
              key={item.label}
              onClick={() => onNavChange(item.label)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', height: 38, padding: '0 12px',
                borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                transition: 'all 0.15s',
                background: active ? 'var(--accent-light)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', opacity: active ? 1 : 0.7 }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          )
        })}
      </div>

      <div style={{ width: '100%', height: 1, background: 'var(--border)' }} />

      {/* Control Area */}
      <div style={{ padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Input Add Line */}
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            placeholder="Adicionar linha (ex: 485)"
            value={addInput}
            onChange={e => setAddInput(e.target.value)}
            onKeyDown={handleKey}
            style={{
              flex: 1, height: 36, padding: '0 10px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg-subtle)',
              color: 'var(--text)', fontSize: 12, fontWeight: 500, outline: 'none',
            }}
          />
          <button
            onClick={handleAdd}
            style={{
              height: 36, padding: '0 12px', borderRadius: 8,
              background: 'var(--accent)', color: 'white', border: 'none',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>

        {/* Active Lines Chips */}
        {activeLines.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {activeLines.map(line => {
              const color = lineColor(line, activeLines)
              return (
                <span
                  key={line}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 20,
                    background: `${color}15`, border: `1px solid ${color}30`,
                    color: color, fontSize: 11, fontWeight: 700,
                  }}
                >
                  {line}
                  <button
                    onClick={() => onRemoveLine(line)}
                    style={{
                      border: 'none', background: 'transparent', color: color,
                      cursor: 'pointer', padding: '0 2px', fontSize: 13,
                      lineHeight: 1, display: 'flex', alignItems: 'center',
                    }}
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Info Status / Stats */}
      <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatCard label="Filtrados" value={totalBuses} color="var(--accent)" />
          <StatCard label="Status API" value={isError ? 500 : 200} color={isError ? 'var(--danger)' : 'var(--success)'} />
        </div>

        {/* Sync Info */}
        <div style={{
          background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 8,
          padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Sincronização</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginTop: 1 }}>
              {lastUpdate ? lastUpdate.toLocaleTimeString('pt-BR') : '--:--:--'}
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading || isFetching}
            title="Atualizar agora"
            style={{
              width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)',
              background: 'transparent', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                animation: isLoading || isFetching ? 'spin 1s linear infinite' : 'none',
                color: 'var(--text-muted)',
              }}
            >
              <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9l1.6 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M13.5 2v3.5H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Selected Bus Panel */}
      {selectedBus && (
        <div className="animate-fade-in" style={{
          margin: '8px 10px', background: 'var(--accent-light)',
          border: '1px solid var(--accent)', borderRadius: 8, padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{
                display: 'inline-block', background: 'var(--accent)', color: 'white',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700,
                padding: '2px 8px', borderRadius: 6, marginBottom: 4,
              }}>
                {selectedBus.linha}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {selectedBus.trajeto ?? 'Trajeto não informado'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>
                Ord: {selectedBus.ordem} · {selectedBus.velocidade.toFixed(0)} km/h
              </div>
            </div>
            <button onClick={onClearBus} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-faint)', fontSize: 18, lineHeight: 1, padding: '0 2px',
            }}>×</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {onToggleTheme && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={onToggleTheme}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-subtle)',
              color: 'var(--text)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-subtle)' }}
          >
            <span>{theme === 'light' ? '🌙' : '☀️'}</span>
            <span>Tema {theme === 'light' ? 'Escuro' : 'Claro'}</span>
          </button>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </aside>
  )
}

function btnIcon(): React.CSSProperties {
  return {
    width: 32, height: 32, borderRadius: 8,
    border: '1px solid var(--border)', background: 'transparent',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 600, color, lineHeight: 1.2, marginTop: 2 }}>
        {value.toLocaleString('pt-BR')}
      </div>
    </div>
  )
}
