import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api'
import type { BusPosition } from '../../types'
import { velocidadeCor, sentidoLabel, formatDataHora } from '../../types'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string || ''

const MAP_CENTER = { lat: -22.9068, lng: -43.1729 }
const MAP_OPTIONS_LIGHT: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  gestureHandling: 'greedy',
  styles: [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ],
}

const MAP_OPTIONS_DARK: google.maps.MapOptions = {
  ...MAP_OPTIONS_LIGHT,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#64779e' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
  ],
}

interface BusMapProps {
  buses: BusPosition[]
  selectedBus: BusPosition | null
  onSelectBus: (bus: BusPosition | null) => void
  theme?: 'light' | 'dark'
}

export interface BusMapHandle {
  locateUser: () => void
}

// ── Componente de marcador SVG de ônibus ─────────────────────────────────────
function BusMarkerIcon({ bus, zoom }: { bus: BusPosition; zoom: number }) {
  const cor = velocidadeCor(bus.velocidade)
  const size = bus.emMovimento ? 30 : 24
  const showLabel = zoom >= 14

  return (
    <div style={{ position: 'relative', cursor: 'pointer' }}>
      {zoom >= 14 ? (
        // Ícone detalhado com SVG do ônibus
        <div style={{ position: 'relative', width: size, height: size, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
          <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
            <rect x="3" y="5" width="24" height="16" rx="4" fill={cor} />
            <rect x="5" y="7" width="5" height="4" rx="1" fill="rgba(255,255,255,0.5)" />
            <rect x="12" y="7" width="5" height="4" rx="1" fill="rgba(255,255,255,0.5)" />
            <rect x="19" y="7" width="5" height="4" rx="1" fill="rgba(255,255,255,0.5)" />
            <rect x="4" y="13" width="22" height="1.5" fill="rgba(255,255,255,0.25)" />
            <circle cx="8" cy="23" r="3" fill="white" stroke={cor} strokeWidth="1.5" />
            <circle cx="22" cy="23" r="3" fill="white" stroke={cor} strokeWidth="1.5" />
          </svg>
          {bus.emMovimento && (
            <div style={{
              position: 'absolute', top: -2, right: -2,
              width: 8, height: 8, borderRadius: '50%',
              background: '#16a34a', border: '1.5px solid white',
            }} />
          )}
        </div>
      ) : (
        // Ponto simples para zoom baixo
        <div style={{
          width: bus.emMovimento ? 14 : 10,
          height: bus.emMovimento ? 14 : 10,
          borderRadius: '50%',
          background: cor,
          border: '2px solid white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      )}
      {showLabel && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '100%',
          transform: 'translateY(-50%)',
          marginLeft: 6,
          background: 'var(--bg, #fff)',
          border: '1px solid var(--border, #e2e8f0)',
          color: 'var(--text, #0f172a)',
          fontWeight: 700,
          borderRadius: 6,
          padding: '2px 6px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          fontFamily: 'monospace',
          fontSize: 11,
          whiteSpace: 'nowrap',
        }}>
          {bus.linha}
        </div>
      )}
    </div>
  )
}

// ── InfoWindow personalizada ─────────────────────────────────────────────────
function BusInfoWindow({ bus, onClose }: { bus: BusPosition; onClose: () => void }) {
  const cor = velocidadeCor(bus.velocidade)
  const sentido = sentidoLabel(bus.sentido)

  return (
    <div style={{
      position: 'absolute',
      bottom: 42,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10,
      background: 'var(--bg, #fff)',
      border: '1px solid var(--border, #e2e8f0)',
      borderRadius: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      minWidth: 240,
      animation: 'fadeIn 0.2s ease',
    }}>
      {/* Seta apontando para baixo */}
      <div style={{
        position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
        borderTop: '8px solid var(--bg, #fff)',
      }} />
      {/* Botão fechar */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose() }}
        style={{
          position: 'absolute', top: 6, right: 8, background: 'none',
          border: 'none', cursor: 'pointer', fontSize: 18,
          color: 'var(--text-faint, #94a3b8)', lineHeight: 1, padding: 0,
        }}
      >×</button>
      {/* Conteúdo */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            color: 'white', fontSize: 18, fontWeight: 700,
            background: cor, padding: '4px 10px', borderRadius: 8,
            fontFamily: 'monospace', letterSpacing: 1,
          }}>{bus.linha}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text, #0f172a)' }}>
              {bus.trajeto ?? 'Trajeto não informado'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', marginTop: 1 }}>
              Ordem: {bus.ordem}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div style={{ background: 'var(--bg-panel, #f0f4f8)', borderRadius: 8, padding: 8 }}>
            <div style={{ fontSize: 9, color: 'var(--text-faint, #94a3b8)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Velocidade</div>
            <div style={{ color: cor, fontSize: 16, fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>
              {bus.velocidade.toFixed(0)}<span style={{ fontSize: 10, color: 'var(--text-faint, #94a3b8)', fontWeight: 400 }}> km/h</span>
            </div>
          </div>
          <div style={{ background: 'var(--bg-panel, #f0f4f8)', borderRadius: 8, padding: 8 }}>
            <div style={{ fontSize: 9, color: 'var(--text-faint, #94a3b8)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sentido</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #0f172a)', marginTop: 2 }}>{sentido}</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border, #e2e8f0)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-faint, #94a3b8)' }}>Última posição</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', fontFamily: 'monospace' }}>{formatDataHora(bus.dataHora)}</span>
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: bus.emMovimento ? '#16a34a' : '#94a3b8' }} />
          <span style={{ fontSize: 11, color: bus.emMovimento ? '#16a34a' : 'var(--text-faint, #94a3b8)', fontWeight: 500 }}>
            {bus.emMovimento ? 'Em movimento' : 'Parado'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Componente Principal do Mapa ─────────────────────────────────────────────
export const BusMap = forwardRef<BusMapHandle, BusMapProps>(function BusMap(
  { buses, selectedBus, onSelectBus, theme = 'light' },
  ref
) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  })

  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const userMarkerRef = useRef<google.maps.Marker | null>(null)
  const [zoom, setZoom] = useState(12)

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapInstanceRef.current = map
  }, [])

  const onZoomChanged = useCallback(() => {
    const map = mapInstanceRef.current
    if (map) {
      setZoom(map.getZoom() ?? 12)
    }
  }, [])

  // Atualiza o estilo do mapa quando o tema muda
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    const options = theme === 'dark' ? MAP_OPTIONS_DARK : MAP_OPTIONS_LIGHT
    map.setOptions({ styles: options.styles })
  }, [theme])

  // Voa para o ônibus selecionado
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !selectedBus) return
    const lat = typeof selectedBus.latitude === 'string' ? parseFloat(selectedBus.latitude) : selectedBus.latitude
    const lng = typeof selectedBus.longitude === 'string' ? parseFloat(selectedBus.longitude) : selectedBus.longitude
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return

    map.panTo({ lat, lng })
    map.setZoom(16)
  }, [selectedBus])

  // Expor locateUser
  useImperativeHandle(ref, () => ({
    locateUser() {
      if (!navigator.geolocation) return

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const map = mapInstanceRef.current
          if (!map) return
          const pos = { lat: coords.latitude, lng: coords.longitude }

          // Remove marcador anterior
          if (userMarkerRef.current) {
            userMarkerRef.current.setMap(null)
          }

          userMarkerRef.current = new google.maps.Marker({
            position: pos,
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
            zIndex: 9999,
          })

          map.panTo(pos)
          const currentZoom = map.getZoom() ?? 12
          if (currentZoom < 15) map.setZoom(15)
        },
        () => undefined,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      )
    },
  }))

  if (loadError) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--text-muted)',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🗺️</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Erro ao carregar o Google Maps</div>
          <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-faint)' }}>
            Verifique a chave da API (VITE_GOOGLE_MAPS_KEY) e tente novamente.
          </div>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--text-muted)',
      }}>
        <div style={{ fontSize: 14 }}>Carregando mapa…</div>
      </div>
    )
  }

  const mapOptions = theme === 'dark' ? MAP_OPTIONS_DARK : MAP_OPTIONS_LIGHT

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={MAP_CENTER}
        zoom={12}
        options={mapOptions}
        onLoad={onMapLoad}
        onZoomChanged={onZoomChanged}
      >
        {buses.map((bus) => {
          const lat = typeof bus.latitude === 'string' ? parseFloat(bus.latitude) : bus.latitude
          const lng = typeof bus.longitude === 'string' ? parseFloat(bus.longitude) : bus.longitude
          if (!lat || !lng || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null

          const isSelected = selectedBus?.ordem === bus.ordem

          return (
            <OverlayView
              key={bus.ordem}
              position={{ lat, lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div onClick={() => onSelectBus(bus)} style={{ position: 'relative' }}>
                <BusMarkerIcon bus={bus} zoom={zoom} />
                {isSelected && (
                  <BusInfoWindow bus={bus} onClose={() => onSelectBus(null)} />
                )}
              </div>
            </OverlayView>
          )
        })}
      </GoogleMap>
    </div>
  )
})
