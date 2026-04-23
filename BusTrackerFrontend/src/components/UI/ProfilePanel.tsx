type ProfileRow = {
  label: string
  icon: string
  value?: string
}

type ProfileSection = {
  title: string
  rows: ProfileRow[]
}

const PROFILE_SECTIONS: ProfileSection[] = [
  {
    title: 'Perfil e Conta',
    rows: [
      { label: 'Meus Dados', icon: '👤' },
      { label: 'Notificações e Alertas', icon: '🔔' },
      { label: 'Segurança e Senha', icon: '🔒' },
    ],
  },
  {
    title: 'Preferências de Viagem',
    rows: [
      { label: 'Modos de Transporte', icon: '🚌' },
      { label: 'Rotas Preferidas', icon: '⭐' },
      { label: 'Alertas de Trânsito e Obras', icon: '🚧' },
      { label: 'Integração RioCard', icon: '💳', value: 'Bilhete Único / RioCard' },
    ],
  },
  {
    title: 'Mapa e Interface',
    rows: [
      { label: 'Aparência do Mapa', icon: '🗺️' },
      { label: 'Unidade de Distância', icon: '📏', value: 'Km' },
      { label: 'Tema', icon: '☀️', value: 'Claro' },
    ],
  },
  {
    title: 'Idioma e Suporte',
    rows: [
      { label: 'Idioma', icon: '🌐', value: 'Português' },
      { label: 'Sobre o App', icon: 'ℹ️', value: 'Versão 2.3.1' },
      { label: 'Fale Conosco', icon: '🗨️' },
    ],
  },
  {
    title: 'Legal',
    rows: [
      { label: 'Política de Privacidade', icon: '✅' },
    ],
  },
]

interface ProfilePanelProps {
  onClose: () => void
}

export function ProfilePanel({ onClose }: ProfilePanelProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(15, 23, 42, 0.28)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: 'min(540px, 100%)',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.7)',
          borderRadius: 8,
          boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)',
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 22px 16px',
            background: 'rgba(255,255,255,0.92)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>Meu Perfil</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Ajustes visuais e preferências da conta.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'white',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '18px 18px 22px' }}>
          {PROFILE_SECTIONS.map(section => (
            <section key={section.title} style={{ marginBottom: 18 }}>
              <div
                style={{
                  padding: '0 8px 8px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text)',
                }}
              >
                {section.title}
              </div>
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: 'white',
                }}
              >
                {section.rows.map((row, index) => (
                  <button
                    key={row.label}
                    type="button"
                    style={{
                      width: '100%',
                      minHeight: 52,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '0 14px',
                      border: 'none',
                      borderBottom: index === section.rows.length - 1 ? 'none' : '1px solid var(--border)',
                      background: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ width: 22, textAlign: 'center', fontSize: 18, flexShrink: 0 }}>{row.icon}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{row.label}</span>
                      {row.value && (
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>{row.value}</span>
                      )}
                    </span>
                    <span style={{ color: 'var(--text-faint)', fontSize: 20, lineHeight: 1 }}>›</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
