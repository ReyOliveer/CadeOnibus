// ╔══════════════════════════════════════════════════════════════════════╗
// ║  PAINEL DIREITO — AVISOS E NOVIDADES                                ║
// ║                                                                      ║
// ║  TODO: Integrar com fonte de dados real de avisos.                  ║
// ║  Sugestões de implementação futura:                                  ║
// ║                                                                      ║
// ║  1. ENDPOINT DE AVISOS                                               ║
// ║     Criar GET /api/notices no backend retornando lista de avisos.   ║
// ║     Campos sugeridos: id, tipo (alerta/aviso/info), título,         ║
// ║     mensagem, dataHora, linhasAfetadas[].                           ║
// ║                                                                      ║
// ║  2. POLLING / WEBSOCKET                                              ║
// ║     Usar useQuery com refetchInterval: 60_000 para buscar avisos.   ║
// ║     Futuramente migrar para SignalR (já no backend ASP.NET Core)    ║
// ║     para receber notificações em push sem polling.                  ║
// ║                                                                      ║
// ║  3. FONTE DOS DADOS                                                  ║
// ║     Opções: scraping do site da SMTR/Fetranspor, feed RSS,          ║
// ║     painel administrativo próprio, ou integração com a API          ║
// ║     de mobilidade do Rio se disponível.                             ║
// ║                                                                      ║
// ║  4. TIPOS SUGERIDOS (DTOs/BusDtos.cs no backend):                   ║
// ║     public record NoticeDto(                                         ║
// ║       string Id, string Tipo, string Titulo,                        ║
// ║       string Mensagem, DateTime DataHora,                           ║
// ║       string[] LinhasAfetadas                                        ║
// ║     );                                                               ║
// ║                                                                      ║
// ║  5. COMPONENTE DE AVISO                                              ║
// ║     Substituir os <NoticeCard> hardcoded abaixo por um .map()       ║
// ║     sobre os dados retornados pela API.                             ║
// ╚══════════════════════════════════════════════════════════════════════╝

interface RightPanelProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export function RightPanel({ collapsed, onToggleCollapse }: RightPanelProps) {

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
      width: 240, flexShrink: 0, background: 'var(--bg)',
      borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>

      {/* Header */}
      <div style={{
        padding: '14px 14px 12px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1a5 5 0 0 0-5 5v3L1.5 12h13L13 9V6a5 5 0 0 0-5-5z" stroke="var(--accent)" strokeWidth="1.5"/>
            <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" stroke="var(--accent)" strokeWidth="1.5"/>
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Avisos</span>
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

      {/* Avisos — hardcoded por enquanto */}
      {/* TODO: substituir por .map() sobre dados da API quando implementado */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>

        <NoticeCard
          tipo="alerta"
          titulo="Interdição na Av. Brasil"
          mensagem="Sentido Centro com desvio. Linhas 485, 309 e SP afetadas."
          tempo="há 8 min"
        />

        <NoticeCard
          tipo="aviso"
          titulo="Lentidão na Linha Amarela"
          mensagem="Atraso médio de 12 minutos nos ônibus da região."
          tempo="há 23 min"
        />

        <NoticeCard
          tipo="info"
          titulo="Nova linha BRT"
          mensagem="Transcarioca com horários ampliados a partir de segunda-feira."
          tempo="há 1h"
        />

        <NoticeCard
          tipo="info"
          titulo="Integração gratuita"
          mensagem="Metrô Rio com integração disponível até às 22h nos dias úteis."
          tempo="hoje"
        />

        {/* TODO: renderizar avisos dinâmicos aqui */}
        {/* {notices.map(n => <NoticeCard key={n.id} {...n} />)} */}

      </div>

      {/* Rodapé com hint de implementação */}
      <div style={{
        padding: '8px 12px', borderTop: '1px solid var(--border)',
        background: 'var(--bg-subtle)',
      }}>
        <p style={{ fontSize: 10, color: 'var(--text-faint)', lineHeight: 1.5, margin: 0 }}>
          {/* TODO: remover este aviso ao integrar a API de avisos */}
          Avisos estáticos. Integrar com endpoint <code style={{ fontSize: 10 }}>/api/notices</code> futuramente.
        </p>
      </div>

    </aside>
  )
}

// ── NoticeCard ────────────────────────────────────────────────────────────────

type NoticeTipo = 'alerta' | 'aviso' | 'info'

interface NoticeCardProps {
  tipo: NoticeTipo
  titulo: string
  mensagem: string
  tempo: string
}

const NOTICE_STYLES: Record<NoticeTipo, { bg: string; border: string; tag: string; tagBg: string; tagColor: string }> = {
  alerta: {
    bg: 'var(--danger-light)', border: '#fecaca',
    tag: 'Alerta', tagBg: '#fecaca', tagColor: '#991b1b',
  },
  aviso: {
    bg: 'var(--warn-light)', border: '#fde68a',
    tag: 'Atenção', tagBg: '#fde68a', tagColor: '#92400e',
  },
  info: {
    bg: 'var(--info-light)', border: '#bfdbfe',
    tag: 'Info', tagBg: '#bfdbfe', tagColor: '#1e40af',
  },
}

function NoticeCard({ tipo, titulo, mensagem, tempo }: NoticeCardProps) {
  const s = NOTICE_STYLES[tipo]
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 10, padding: '10px 12px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{
          fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
          background: s.tagBg, color: s.tagColor, padding: '2px 6px', borderRadius: 4,
        }}>
          {s.tag}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>{tempo}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{titulo}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{mensagem}</div>
    </div>
  )
}
