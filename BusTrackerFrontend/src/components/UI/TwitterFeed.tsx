import { useEffect, useRef, useState } from 'react'

interface TwitterFeedProps {
  username: string
  theme: 'light' | 'dark'
  height?: number
}

// Declara o objeto global injetado pelo script do Twitter/X
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => Promise<void>
      }
    }
  }
}

export function TwitterFeed({ username = "COR_Rio", theme, height = 500 }: TwitterFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    setStatus('loading')

    // Limpa o embed anterior (necessário para re-renderizar com novo tema)
    container.innerHTML = ''

    // Cria o elemento âncora que o widget do Twitter transforma em iframe
    const anchor = document.createElement('a')
    anchor.className = 'twitter-timeline'
    anchor.href = `https://twitter.com/${username}`
    anchor.setAttribute('data-theme', theme)
    anchor.setAttribute('data-height', String(height))
    anchor.setAttribute('data-chrome', 'noheader nofooter noborders transparent')
    anchor.setAttribute('data-tweet-limit', '8')
    anchor.setAttribute('data-dnt', 'true') // Do Not Track
    anchor.setAttribute('lang', 'pt')
    anchor.textContent = `Tweets by @${username}`
    container.appendChild(anchor)

    const safetyTimeout = setTimeout(() => {
      setStatus(current => {
        if (current === 'loading') {
          console.warn("Twitter widget load timed out.");
          return 'error';
        }
        return current;
      });
    }, 6000);

    const checkAndLoad = () => {
      if (window.twttr?.widgets) {
        window.twttr.widgets.load(container)
          .then(() => {
            clearTimeout(safetyTimeout);
            setStatus('ready');
          })
          .catch((err) => {
            console.error("Erro ao processar widget do Twitter:", err);
            setStatus('error');
          });
        return true;
      }
      return false;
    };

    if (checkAndLoad()) return;

    let intervalId: any;
    let fallbackTimeoutId: any;

    // Se o script já existe mas o objeto twttr ainda não está pronto, fazemos polling rápido
    const existing = document.querySelector('script[src*="platform.twitter.com"]')
    if (existing) {
      intervalId = setInterval(() => {
        if (checkAndLoad()) {
          clearInterval(intervalId);
        }
      }, 100);

      fallbackTimeoutId = setTimeout(() => {
        clearInterval(intervalId);
        if (!window.twttr?.widgets) {
          setStatus('error');
        }
      }, 5000);

      return () => {
        clearTimeout(safetyTimeout);
        clearInterval(intervalId);
        clearTimeout(fallbackTimeoutId);
      }
    } else {
      // Primeira vez — injeta o script
      const script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.charset = 'utf-8'

      const onScriptLoad = () => {
        intervalId = setInterval(() => {
          if (checkAndLoad()) {
            clearInterval(intervalId);
          }
        }, 50);
        fallbackTimeoutId = setTimeout(() => {
          clearInterval(intervalId);
          if (!window.twttr?.widgets) {
            setStatus('error');
          }
        }, 5000);
      }

      script.addEventListener('load', onScriptLoad, { once: true })
      script.addEventListener('error', () => setStatus('error'), { once: true })
      document.body.appendChild(script)

      return () => {
        clearTimeout(safetyTimeout);
        if (intervalId) clearInterval(intervalId);
        if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId);
        script.removeEventListener('load', onScriptLoad);
      }
    }
  }, [username, theme, height])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Skeleton enquanto o iframe do Twitter carrega */}
      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', gap: 10, padding: '12px 8px',
        }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              borderRadius: 10, padding: '12px',
              background: 'var(--bg-subtle)', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--border)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 10, width: '60%', background: 'var(--border)', borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ height: 8, width: '40%', background: 'var(--border)', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ height: 8, width: '100%', background: 'var(--border)', borderRadius: 4, marginBottom: 5 }} />
              <div style={{ height: 8, width: '80%', background: 'var(--border)', borderRadius: 4 }} />
            </div>
          ))}
          <p style={{ fontSize: 10, color: 'var(--text-faint)', textAlign: 'center', margin: '4px 0 0' }}>
            Carregando tweets…
          </p>
        </div>
      )}

      {/* Mensagem de erro */}
      {status === 'error' && (
        <div style={{
          padding: '20px 12px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--danger)" strokeWidth="1.5" />
            <path d="M12 8v4M12 16h.01" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Não foi possível carregar o feed.<br />
            Verifique sua conexão ou extensões de bloqueio de anúncios.
          </p>
          <a
            href={`https://twitter.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}
          >
            Abrir no X →
          </a>
        </div>
      )}

      {/* Container onde o widget do Twitter injeta o iframe */}
      <div
        ref={containerRef}
        style={{
          opacity: status === 'ready' ? 1 : 0,
          transition: 'opacity 0.3s ease',
          height: '100%',
        }}
      />
    </div>
  )
}
