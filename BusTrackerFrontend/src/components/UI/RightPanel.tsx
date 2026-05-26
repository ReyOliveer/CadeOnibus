import { TwitterFeed } from './TwitterFeed'

interface RightPanelProps {
  collapsed: boolean
  onToggleCollapse: () => void
  theme: 'light' | 'dark'
}

export function RightPanel({ collapsed, onToggleCollapse, theme }: RightPanelProps) {

  if (collapsed) {
    return (
      <aside style={{
        width: 44, flexShrink: 0, background: 'var(--bg)',
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 12,
      }}>
        <button onClick={onToggleCollapse} title="Expandir avisos" style={{
          width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M7 4l-5 5 5 5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ marginTop: 12, writingMode: 'vertical-rl', fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Avisos
        </div>
      </aside>
    )
  }

  return (
    <aside style={{
      width: 300, flexShrink: 0, background: 'var(--bg)',
      borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>

      {/* Header */}
      <div style={{
        padding: '14px 14px 12px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* X (Twitter) logo */}
          <svg width="15" height="15" viewBox="0 0 1200 1227" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.828Z" fill="var(--accent)"/>
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Avisos — @OperacoesRio</span>
        </div>
        <button onClick={onToggleCollapse} title="Ocultar" style={{
          width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
            <path d="M11 4l5 5-5 5" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Twitter/X Feed */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <TwitterFeed username="OperacoesRio" theme={theme} />
      </div>

      {/* Rodapé */}
      <div style={{
        padding: '6px 12px', borderTop: '1px solid var(--border)',
        background: 'var(--bg-subtle)', flexShrink: 0,
      }}>
        <p style={{ fontSize: 10, color: 'var(--text-faint)', lineHeight: 1.5, margin: 0, textAlign: 'center' }}>
          Operações Rio — Centro de Operações da Prefeitura do RJ
        </p>
      </div>

    </aside>
  )
}
