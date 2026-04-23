import { useState } from 'react'
import type { BusPosition } from '../../types'

interface SidebarProps {
  activeNav: string
  onNavChange: (label: string) => void
  totalBuses: number
  visibleBuses: number
  lineFilter: string
  onLineFilterChange: (value: string) => void
  onClearSelection: () => void
  selectedBus: BusPosition | null
  onClearBus: () => void
  isLoading: boolean
  lastUpdate: Date | null
  isError: boolean
  onRefresh: () => void
  collapsed: boolean
  onToggleCollapse: () => void
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
    label: 'Buscar Linha',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
  {
    label: 'Configuracoes',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function Sidebar({
  activeNav, onNavChange, totalBuses, visibleBuses, lineFilter, onLineFilterChange, onClearSelection,
  selectedBus, onClearBus, isLoading, lastUpdate, isError, onRefresh,
  collapsed, onToggleCollapse,
}: SidebarProps) {
  const [isLineInputFocused, setIsLineInputFocused] = useState(false)
  const hasSelection = lineFilter.trim().length > 0

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
      </aside>
    )
  }

  return (
    <aside style={{
      width: 260, flexShrink: 0, background: 'var(--bg)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
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
              <span style={{ flexShrink: 0, color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          )
        })}
      </nav>

      <div style={{
        padding: '8px 14px', background: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: isError ? 'var(--danger)' : isLoading ? 'var(--warning)' : 'var(--success)',
            animation: (!isError && !isLoading) ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {isError ? 'Erro de conexao' : isLoading ? 'Atualizando...' : 'Ao vivo'}
          </span>
          {lastUpdate && !isLoading && (
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
          <span style={{ display: 'inline-block', animation: isLoading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
          Atualizar
        </button>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 6, padding: '10px 12px', borderBottom: '1px solid var(--border)',
      }}>
        <StatCard label="Total" value={totalBuses} color="var(--accent)" />
        <StatCard label="Visiveis" value={visibleBuses} color={hasSelection ? '#7c3aed' : 'var(--accent)'} />
      </div>

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

      <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Filtro de Linha
        </span>
        {hasSelection && (
          <button onClick={onClearSelection} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--accent)', fontSize: 11, textDecoration: 'underline', padding: 0,
          }}>Limpar</button>
        )}
      </div>

      <div style={{ padding: '0 10px 6px' }}>
        <input
          type="text"
          placeholder="Digite a linha desejada"
          value={lineFilter}
          onChange={e => onLineFilterChange(e.target.value)}
          style={{
            width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '7px 10px', color: 'var(--text)',
            fontFamily: 'DM Sans', fontSize: 13, outline: 'none', boxSizing: 'border-box', minHeight: 40,
          }}
          onFocus={() => setIsLineInputFocused(true)}
          onBlur={() => setIsLineInputFocused(false)}
        />
      </div>

      <div style={{ flex: 1, padding: '6px 10px 12px' }}>
        <div style={{
          height: '100%',
          border: `1px solid ${isLineInputFocused ? 'var(--accent)' : 'var(--border)'}`,
          background: isLineInputFocused ? 'var(--accent-light)' : 'var(--bg-subtle)',
          borderRadius: 8,
          padding: '14px 12px',
          transition: 'all 0.15s',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            Exibicao do mapa
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {hasSelection
              ? `Mostrando apenas onibus cuja linha contem "${lineFilter.trim()}".`
              : 'Digite o numero da linha para mostrar somente os onibus desejados no mapa.'}
          </div>
        </div>
      </div>

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
