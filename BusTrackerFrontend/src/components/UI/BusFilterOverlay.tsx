import { useState } from 'react'

interface BusFilterOverlayProps {
  lineFilter: string
  onLineFilterChange: (value: string) => void
  onBypass: () => void
  totalBuses: number
}

export function BusFilterOverlay({
  lineFilter,
  onLineFilterChange,
  onBypass,
  totalBuses,
}: BusFilterOverlayProps) {
  const [searchValue, setSearchValue] = useState(lineFilter)

  const popularLines = [
    { number: '485', desc: 'Cascadura × Copacabana' },
    { number: '665', desc: 'Pavuna × Saens Peña' },
    { number: '483', desc: 'Penha × Copacabana' },
    { number: '309', desc: 'Alvorada × Central' },
    { number: '100', desc: 'Cosme Velho × Praça XV' },
    { number: '415', desc: 'Urca × Horto' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLineFilterChange(searchValue)
  }

  const handleSelectLine = (num: string) => {
    setSearchValue(num)
    onLineFilterChange(num)
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          borderRadius: 16,
          padding: '30px 24px',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.22), inset 0 0 0 1px rgba(255, 255, 255, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Bus Icon Header */}
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 14,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)',
            marginBottom: 20,
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="5" width="20" height="13" rx="3" fill="white" opacity=".95" />
            <rect x="4" y="7" width="4" height="3" rx="1" fill="var(--accent)" />
            <rect x="10" y="7" width="4" height="3" rx="1" fill="var(--accent)" />
            <rect x="16" y="7" width="4" height="3" rx="1" fill="var(--accent)" />
            <circle cx="7" cy="19" r="2" fill="white" />
            <circle cx="17" cy="19" r="2" fill="white" />
          </svg>
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--text)',
            margin: '0 0 8px',
            letterSpacing: '-0.3px',
          }}
        >
          Encontre seu Ônibus ao Vivo
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            margin: '0 0 24px',
            padding: '0 10px',
          }}
        >
          Atualmente há <strong style={{ color: 'var(--accent)' }}>{totalBuses}</strong> ônibus ativos no Rio. Para garantir o melhor desempenho e fluidez no mapa, filtre por uma linha para começar.
        </p>

        {/* Search Input Box */}
        <form onSubmit={handleSubmit} style={{ width: '100%', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Digite o número da linha (ex: 485)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{
                flex: 1,
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '0 16px',
                height: 48,
                color: 'var(--text)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                fontWeight: 500,
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
            <button
              type="submit"
              style={{
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '0 20px',
                height: 48,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Popular Shortcuts */}
        <div style={{ width: '100%', marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              textAlign: 'left',
              marginBottom: 10,
            }}
          >
            Linhas Populares
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            {popularLines.map((line) => (
              <button
                key={line.number}
                type="button"
                onClick={() => handleSelectLine(line.number)}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.background = 'var(--accent-light)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = 'var(--bg-subtle)'
                }}
              >
                <span
                  style={{
                    background: 'var(--accent)',
                    color: 'white',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  {line.number}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {line.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '100%', height: 1, background: 'var(--border)', margin: '4px 0 20px' }} />

        {/* Bypass Option */}
        <button
          type="button"
          onClick={onBypass}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 12,
            fontWeight: 500,
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          Mostrar todos os ônibus no mapa mesmo assim (pode travar)
        </button>
      </div>
    </div>
  )
}
