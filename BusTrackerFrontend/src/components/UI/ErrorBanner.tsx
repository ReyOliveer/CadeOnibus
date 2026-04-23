interface ErrorBannerProps {
  message: string
  onRetry: () => void
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div style={{
      position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1000, background: 'white', border: '1px solid #fecaca',
      borderRadius: 10, padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 4px 16px rgba(220,38,38,0.12)',
    }}>
      <span style={{ color: 'var(--danger)', fontSize: 14 }}>⚠</span>
      <span style={{ fontSize: 13, color: 'var(--text)' }}>{message}</span>
      <button onClick={onRetry} style={{
        background: 'var(--danger-light)', border: '1px solid #fecaca',
        borderRadius: 6, padding: '3px 10px', color: 'var(--danger)',
        cursor: 'pointer', fontSize: 12,
      }}>
        Tentar novamente
      </button>
    </div>
  )
}
