export function LoadingOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 2000,
      background: 'white',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
      }}>🚌</div>
      <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
        Cade<span style={{ color: 'var(--accent)' }}>Ônibus</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
            animation: `bounce 1.2s ease infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
      <p style={{ color: 'var(--text-faint)', fontSize: 13, margin: 0 }}>
        Carregando posições dos ônibus...
      </p>
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  )
}
