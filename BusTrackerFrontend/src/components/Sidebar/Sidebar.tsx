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
<<<<<<< Updated upstream
=======
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  activeNav, onNavChange, totalBuses, visibleBuses, lineFilter, onLineFilterChange, onClearSelection,
  selectedBus, onClearBus, isLoading, lastUpdate, isError, onRefresh,
  collapsed, onToggleCollapse,
=======
  activeNav, onNavChange, activeLines, onAddLine, onRemoveLine,
  totalBuses, selectedBus, onClearBus, isLoading, isFetching, lastUpdate,
  isError, onRefresh, collapsed, onToggleCollapse, theme, onToggleTheme,
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
        {onToggleTheme && (
          <>
            <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '4px 0' }} />
            <button onClick={onToggleTheme} title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`} style={btnIcon()}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </>
        )}
>>>>>>> Stashed changes
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="13" rx="3" fill="white" opacity=".9" />
              <rect x="4" y="7" width="4" height="3" rx="1" fill="var(--accent)" />
              <rect x="10" y="7" width="4" height="3" rx="1" fill="var(--accent)" />
              <rect x="16" y="7" width="4" height="3" rx="1" fill="var(--accent)" />
              <circle cx="7" cy="19" r="2" fill="var(--accent)" />
              <circle cx="17" cy="19" r="2" fill="var(--accent)" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--text)', lineHeight: 1.1 }}>
              Cade<span style={{ color: 'var(--accent)' }}>Onibus</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.4px', marginTop: 1 }}>
              Rio de Janeiro · SPPO
            </div>
          </div>
        </div>
        <button onClick={onToggleCollapse} title="Ocultar" style={btnIcon()}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 10px 8px', borderBottom: '1px solid var(--border)' }}>
        {NAV_ITEMS.map(item => {
          const isActive = activeNav === item.label
          return (
            <button
              key={item.label}
              onClick={() => onNavChange(item.label)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 11px', borderRadius: 8, marginBottom: 2,
                border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                background: isActive ? 'var(--accent-light)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{ flexShrink: 0, color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Status bar */}
      <div style={{
        padding: '8px 14px', background: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: isError ? 'var(--danger)' : isFetching ? 'var(--warning)' : 'var(--success)',
            animation: (!isError && !isFetching) ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {isError ? 'Erro de conexao' : isFetching ? 'Atualizando...' : 'Ao vivo'}
          </span>
          {lastUpdate && !isFetching && (
            <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
              {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}
        </div>
        <button onClick={onRefresh} disabled={isLoading} style={{
          background: 'transparent', border: '1px solid var(--border)', borderRadius: 6,
          padding: '3px 8px', cursor: isLoading ? 'wait' : 'pointer',
          color: 'var(--text-muted)', fontSize: 11,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ display: 'inline-block', animation: isFetching ? 'spin 1s linear infinite' : 'none' }}>↻</span>
          Atualizar
        </button>
      </div>

      {/* Stat */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
        <StatCard label="Ônibus no mapa" value={totalBuses} color="var(--accent)" />
      </div>

      {/* Active lines section */}
      <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'var(--text-faint)',
          textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>Linhas monitoradas</span>
          <span style={{ color: 'var(--accent)' }}>{activeLines.length}</span>
        </div>

        {/* Line chips */}
        {activeLines.length === 0 ? (
          <div style={{
            fontSize: 12, color: 'var(--text-faint)', textAlign: 'center',
            padding: '10px 0', fontStyle: 'italic',
          }}>
            Nenhuma linha ativa
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {activeLines.map((linha, i) => {
              const color = LINE_COLORS[i % LINE_COLORS.length]
              return (
                <div
                  key={linha}
                  className="animate-fade-in"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: `${color}18`, border: `1px solid ${color}55`,
                    borderRadius: 8, padding: '4px 8px',
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
                    fontWeight: 700, color,
                  }}>
                    {linha}
                  </span>
                  <button
                    onClick={() => onRemoveLine(linha)}
                    title={`Remover linha ${linha}`}
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color, fontSize: 14, lineHeight: 1, padding: '0 1px',
                      opacity: 0.7, transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.7' }}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add line input */}
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            placeholder="Adicionar linha..."
            value={addInput}
            onChange={e => setAddInput(e.target.value)}
            onKeyDown={handleKey}
            style={{
              flex: 1, background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 10px',
              color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 12,
              outline: 'none', minHeight: 32,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
          <button
            onClick={handleAdd}
            title="Adicionar linha"
            style={{
              background: 'var(--accent)', border: 'none', borderRadius: 8,
              width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 18, flexShrink: 0, transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Selected bus card */}
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
                {selectedBus.trajeto ?? 'Trajeto nao informado'}
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
