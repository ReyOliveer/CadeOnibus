import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { BusPosition } from '../../types'
import { velocidadeCor, sentidoLabel, formatDataHora } from '../../types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
mapboxgl.accessToken = MAPBOX_TOKEN || ''

interface BusMapProps {
  buses: BusPosition[]
  selectedBus: BusPosition | null
  onSelectBus: (bus: BusPosition | null) => void
  theme?: 'light' | 'dark'
}

export interface BusMapHandle {
  locateUser: () => void
}

function updateMarkerElement(el: HTMLDivElement, bus: BusPosition, isDetailed: boolean) {
  const cor = velocidadeCor(bus.velocidade)
  if (isDetailed) {
    const size = bus.emMovimento ? 30 : 24
    el.className = 'bus-marker-detailed'
    el.style.width = 'auto'
    el.style.height = 'auto'
    el.style.display = 'flex'
    el.style.alignItems = 'center'
    el.style.cursor = 'pointer'
    el.innerHTML = `
      <div style="position:relative;width:${size}px;height:${size}px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2))">
        <svg width="${size}" height="${size}" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="5" width="24" height="16" rx="4" fill="${cor}"/>
          <rect x="5" y="7" width="5" height="4" rx="1" fill="rgba(255,255,255,0.5)"/>
          <rect x="12" y="7" width="5" height="4" rx="1" fill="rgba(255,255,255,0.5)"/>
          <rect x="19" y="7" width="5" height="4" rx="1" fill="rgba(255,255,255,0.5)"/>
          <rect x="4" y="13" width="22" height="1.5" fill="rgba(255,255,255,0.25)"/>
          <circle cx="8" cy="23" r="3" fill="white" stroke="${cor}" stroke-width="1.5"/>
          <circle cx="22" cy="23" r="3" fill="white" stroke="${cor}" stroke-width="1.5"/>
        </svg>
        ${bus.emMovimento ? `<div style="
          position:absolute;top:-2px;right:-2px;
          width:8px;height:8px;border-radius:50%;
          background:#16a34a;border:1.5px solid white;
        "></div>` : ''}
      </div>
      <div class="bus-label animate-fade-in" style="margin-left: 6px; pointer-events: none;">${bus.linha}</div>
    `
  } else {
    const size = bus.emMovimento ? 12 : 9
    el.className = 'bus-marker-dot'
    el.style.width = `${size}px`
    el.style.height = `${size}px`
    el.style.borderRadius = '50%'
    el.style.backgroundColor = cor
    el.style.border = '1.5px solid #ffffff'
    el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'
    el.style.cursor = 'pointer'
    el.innerHTML = ''
  }
}

function createPopupContent(bus: BusPosition): string {
  const cor = velocidadeCor(bus.velocidade)
  const sentido = sentidoLabel(bus.sentido)
  return `
    <div style="font-family:'DM Sans',sans-serif;padding:14px 16px;min-width:210px;color:var(--text);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="
          color:white;font-size:18px;font-weight:700;
          background:${cor};padding:4px 10px;border-radius:8px;
          font-family:monospace;letter-spacing:1px;
        ">${bus.linha}</div>
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text);">${bus.trajeto ?? 'Trajeto não informado'}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:1px;">Ordem: ${bus.ordem}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        <div style="background:var(--bg-subtle);border:1px solid var(--border);border-radius:8px;padding:8px;">
          <div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.5px;">Velocidade</div>
          <div style="color:${cor};font-size:16px;font-weight:700;font-family:monospace;margin-top:2px;">
            ${bus.velocidade.toFixed(0)}<span style="font-size:10px;color:var(--text-faint);font-weight:400"> km/h</span>
          </div>
        </div>
        <div style="background:var(--bg-subtle);border:1px solid var(--border);border-radius:8px;padding:8px;">
          <div style="font-size:9px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.5px;">Sentido</div>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-top:2px;">${sentido}</div>
        </div>
      </div>
      <div style="border-top:1px solid var(--border);padding-top:8px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:11px;color:var(--text-faint);">Última posição</span>
        <span style="font-size:11px;color:var(--text-muted);font-family:monospace;">${formatDataHora(bus.dataHora)}</span>
      </div>
      <div style="margin-top:8px;display:flex;align-items:center;gap:6px;">
        <div style="width:7px;height:7px;border-radius:50%;background:${bus.emMovimento ? '#16a34a' : '#94a3b8'};"></div>
        <span style="font-size:11px;color:${bus.emMovimento ? '#16a34a' : '#94a3b8'};font-weight:500;">
          ${bus.emMovimento ? 'Em movimento' : 'Parado'}
        </span>
      </div>
    </div>
  `
}

export const BusMap = forwardRef<BusMapHandle, BusMapProps>(function BusMap(
  { buses, selectedBus, onSelectBus, theme = 'light' },
  ref
) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  
  const [mapState, setMapState] = useState<{ zoom: number; bounds: mapboxgl.LngLatBounds | null }>({
    zoom: 12,
    bounds: null,
  })

  const onSelectBusRef = useRef(onSelectBus)
  useEffect(() => {
    onSelectBusRef.current = onSelectBus
  }, [onSelectBus])

  // Expor locateUser para o componente pai
  useImperativeHandle(ref, () => ({
    locateUser() {
      if (!navigator.geolocation) return

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const map = mapRef.current
          if (!map) return
          const pos: [number, number] = [coords.longitude, coords.latitude]

          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat(pos)
          } else {
            const el = document.createElement('div')
            el.className = 'user-location-marker'
            el.style.width = '18px'
            el.style.height = '18px'
            el.style.borderRadius = '50%'
            el.style.backgroundColor = '#2563eb'
            el.style.border = '3px solid #ffffff'
            el.style.boxShadow = '0 0 10px rgba(37, 99, 235, 0.5)'

            userMarkerRef.current = new mapboxgl.Marker({ element: el })
              .setLngLat(pos)
              .addTo(map)
          }

          map.flyTo({
            center: pos,
            zoom: Math.max(map.getZoom(), 15),
            duration: 1200,
            essential: true
          })
        },
        () => undefined,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        },
      )
    },
  }))

  // 1. Inicializar o mapa
  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current) return

    const mapStyle = theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12'
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-43.1729, -22.9068], // Rio de Janeiro [lng, lat]
      zoom: 12,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    mapRef.current = map

    const updateMapState = () => {
      setMapState({
        zoom: map.getZoom(),
        bounds: map.getBounds(),
      })
    }

    map.on('load', updateMapState)
    map.on('zoomend', updateMapState)
    map.on('moveend', updateMapState)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        userMarkerRef.current = null
        markersRef.current.clear()
      }
    }
  }, [])

  // Atualizar tema do mapa dinamicamente
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const mapStyle = theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12'
    map.setStyle(mapStyle)
  }, [theme])

  // 2. Reconciliação dos marcadores de ônibus
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const { zoom: currentZoom, bounds } = mapState
    const needsMarkerIcon = currentZoom >= 14
    const currentBuses = new Set<string>()

    buses.forEach((bus) => {
      const lat = typeof bus.latitude === 'string' ? parseFloat(bus.latitude) : bus.latitude
      const lng = typeof bus.longitude === 'string' ? parseFloat(bus.longitude) : bus.longitude
      if (!lat || !lng || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return

      const order = bus.ordem

      // Viewport bounds culling
      if (needsMarkerIcon && bounds && !bounds.contains([lng, lat])) {
        const existingMarker = markersRef.current.get(order)
        if (existingMarker) {
          existingMarker.remove()
          markersRef.current.delete(order)
        }
        return
      }

      currentBuses.add(order)
      const position: [number, number] = [lng, lat]
      const popupContent = createPopupContent(bus)

      let marker = markersRef.current.get(order)

      if (marker) {
        marker.setLngLat(position)
        
        const popup = marker.getPopup()
        if (popup) {
          popup.setHTML(popupContent)
        }

        const el = marker.getElement() as HTMLDivElement
        updateMarkerElement(el, bus, needsMarkerIcon)
        ;(el as any)._bus = bus
      } else {
        const el = document.createElement('div')
        updateMarkerElement(el, bus, needsMarkerIcon)
        ;(el as any)._bus = bus

        el.addEventListener('click', (e) => {
          e.stopPropagation()
          const currentBus = (el as any)._bus
          if (currentBus) {
            onSelectBusRef.current(currentBus)
          }
        })

        const popup = new mapboxgl.Popup({ offset: 25, className: 'bus-popup' })
          .setHTML(popupContent)

        marker = new mapboxgl.Marker({ element: el })
          .setLngLat(position)
          .setPopup(popup)
          .addTo(map)

        markersRef.current.set(order, marker)
      }
    })

    markersRef.current.forEach((marker, order) => {
      if (!currentBuses.has(order)) {
        marker.remove()
        markersRef.current.delete(order)
      }
    })
  }, [buses, mapState])

  // 3. Foco no ônibus selecionado
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedBus) return
    const lat = typeof selectedBus.latitude === 'string' ? parseFloat(selectedBus.latitude) : selectedBus.latitude
    const lng = typeof selectedBus.longitude === 'string' ? parseFloat(selectedBus.longitude) : selectedBus.longitude
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return
    
    map.flyTo({
      center: [lng, lat],
      zoom: 16,
      duration: 1200,
      essential: true
    })

    const marker = markersRef.current.get(selectedBus.ordem)
    if (marker) {
      const popup = marker.getPopup()
      if (popup && !popup.isOpen()) {
        marker.togglePopup()
      }
    }
  }, [selectedBus])

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--text-muted)', padding: 20, textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--danger)' }}>
            Token do Mapbox Ausente
          </div>
          <div style={{ fontSize: 14 }}>
            Verifique se a variável <strong>VITE_MAPBOX_TOKEN</strong> está configurada no seu arquivo <code>.env</code>.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
})
