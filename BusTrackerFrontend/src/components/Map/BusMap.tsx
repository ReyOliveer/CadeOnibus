import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import L from 'leaflet'
import type { BusPosition } from '../../types'
import { velocidadeCor, sentidoLabel, formatDataHora } from '../../types'

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

const TILE_LIGHT = MAPBOX_TOKEN
  ? {
      url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
      attribution: '© <a href="https://mapbox.com/about/maps">Mapbox</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
    }
  : {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    }

const TILE_DARK = MAPBOX_TOKEN
  ? {
      url: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
      attribution: '© <a href="https://mapbox.com/about/maps">Mapbox</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
    }
  : {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> © <a href="https://carto.com">CARTO</a>',
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

function createBusIcon(bus: BusPosition): L.DivIcon {
  const cor = velocidadeCor(bus.velocidade)
  const size = bus.emMovimento ? 30 : 24
  return L.divIcon({
    html: `
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
    `,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  })
}

function createPopupContent(bus: BusPosition): string {
  const cor = velocidadeCor(bus.velocidade)
  const sentido = sentidoLabel(bus.sentido)
  return `
    <div style="font-family:'DM Sans',sans-serif;padding:14px 16px;min-width:210px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="
          color:white;font-size:18px;font-weight:700;
          background:${cor};padding:4px 10px;border-radius:8px;
          font-family:monospace;letter-spacing:1px;
        ">${bus.linha}</div>
        <div>
          <div style="font-size:13px;font-weight:600;color:#0f172a;">${bus.trajeto ?? 'Trajeto não informado'}</div>
          <div style="font-size:11px;color:#64748b;margin-top:1px;">Ordem: ${bus.ordem}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        <div style="background:#f0f4f8;border-radius:8px;padding:8px;">
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Velocidade</div>
          <div style="color:${cor};font-size:16px;font-weight:700;font-family:monospace;margin-top:2px;">
            ${bus.velocidade.toFixed(0)}<span style="font-size:10px;color:#94a3b8;font-weight:400"> km/h</span>
          </div>
        </div>
        <div style="background:#f0f4f8;border-radius:8px;padding:8px;">
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Sentido</div>
          <div style="font-size:14px;font-weight:600;color:#0f172a;margin-top:2px;">${sentido}</div>
        </div>
      </div>
      <div style="border-top:1px solid #e2e8f0;padding-top:8px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:11px;color:#94a3b8;">Última posição</span>
        <span style="font-size:11px;color:#64748b;font-family:monospace;">${formatDataHora(bus.dataHora)}</span>
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
  const leafletContainerRef = useRef<HTMLDivElement>(null)
  
  // Rastreia zoom e bounds do mapa para renderização condicional e filtro de viewport
  const [mapState, setMapState] = useState<{ zoom: number; bounds: L.LatLngBounds | null }>({
    zoom: 12,
    bounds: null,
  })

  // Leaflet Refs
  const mapRef = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const userMarkerRef = useRef<L.CircleMarker | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)

  // Cache de marcadores em memória para reconciliação (CircleMarker para visão macro, Marker com ícone para zoom)
  const leafletMarkersRef = useRef<Map<string, L.Layer>>(new Map())

  // Expor locateUser para o componente pai
  useImperativeHandle(ref, () => ({
    locateUser() {
      if (!navigator.geolocation) return

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const map = mapRef.current
          if (!map) return
          const leafletPos: L.LatLngExpression = [coords.latitude, coords.longitude]

          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(leafletPos)
          } else {
            userMarkerRef.current = L.circleMarker(leafletPos, {
              radius: 9,
              color: '#ffffff',
              weight: 3,
              fillColor: '#2563eb',
              fillOpacity: 1,
            }).addTo(map)
          }

          map.flyTo(leafletPos, Math.max(map.getZoom(), 15), {
            duration: 1.2,
            easeLinearity: 0.35,
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

  // 1. Efeito para inicializar o mapa com renderização preferencial por Canvas (GPU-accelerated)
  useEffect(() => {
    if (!leafletContainerRef.current) return

    // Limpar qualquer instância existente
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
      layerGroupRef.current = null
      userMarkerRef.current = null
      leafletMarkersRef.current.clear()
    }

    const map = L.map(leafletContainerRef.current, {
      center: [-22.9068, -43.1729],
      zoom: 12,
      preferCanvas: true,
    })

    const config = theme === 'dark' ? TILE_DARK : TILE_LIGHT
    const tile = L.tileLayer(config.url, { attribution: config.attribution, maxZoom: 19 })
    tile.addTo(map)
    tileLayerRef.current = tile

    const group = L.layerGroup().addTo(map)
    layerGroupRef.current = group
    mapRef.current = map

    const updateMapState = () => {
      setMapState({
        zoom: map.getZoom(),
        bounds: map.getBounds(),
      })
    }

    updateMapState()

    map.on('zoomend moveend', updateMapState)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        layerGroupRef.current = null
        userMarkerRef.current = null
        leafletMarkersRef.current.clear()
      }
    }
  }, [])

  // Troca o tile layer ao mudar o tema
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const config = theme === 'dark' ? TILE_DARK : TILE_LIGHT
    if (tileLayerRef.current) {
      tileLayerRef.current.remove()
    }
    tileLayerRef.current = L.tileLayer(config.url, { attribution: config.attribution, maxZoom: 19 })
    tileLayerRef.current.addTo(map)
  }, [theme])

  // 2. Efeito de reconciliação de marcadores sobre o Canvas/DOM
  useEffect(() => {
    const map = mapRef.current
    const group = layerGroupRef.current
    if (!map || !group) return

    const { zoom, bounds } = mapState
    const needsMarkerIcon = zoom >= 14
    const currentBuses = new Set<string>()

    buses.forEach((bus) => {
      const lat = typeof bus.latitude === 'string' ? parseFloat(bus.latitude) : bus.latitude
      const lng = typeof bus.longitude === 'string' ? parseFloat(bus.longitude) : bus.longitude
      if (!lat || !lng || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return

      const order = bus.ordem

      // Viewport bounds culling (para performance extrema)
      if (needsMarkerIcon && bounds && !bounds.contains([lat, lng])) {
        const existingMarker = leafletMarkersRef.current.get(order)
        if (existingMarker) {
          group.removeLayer(existingMarker)
          leafletMarkersRef.current.delete(order)
        }
        return
      }

      currentBuses.add(order)
      const position: L.LatLngExpression = [lat, lng]
      const cor = velocidadeCor(bus.velocidade)
      const popupContent = createPopupContent(bus)

      const existingMarker = leafletMarkersRef.current.get(order)

      if (existingMarker) {
        const isCircle = existingMarker instanceof L.CircleMarker
        const wantCircle = !needsMarkerIcon
        if (isCircle !== wantCircle) {
          group.removeLayer(existingMarker)
          leafletMarkersRef.current.delete(order)
        }
      }

      const updatedMarker = leafletMarkersRef.current.get(order)

      if (updatedMarker) {
        updatedMarker.setPopupContent(popupContent)

        if (updatedMarker instanceof L.CircleMarker) {
          const size = bus.emMovimento ? 7 : 5
          updatedMarker.setLatLng(position)
          updatedMarker.setStyle({
            fillColor: cor,
            radius: size,
          })
        } else if (updatedMarker instanceof L.Marker) {
          updatedMarker.setLatLng(position)
          updatedMarker.setIcon(createBusIcon(bus))
        }

        const hasTooltip = updatedMarker.getTooltip() !== undefined
        if (zoom >= 14) {
          if (!hasTooltip) {
            updatedMarker.bindTooltip(bus.linha, {
              permanent: true,
              direction: 'right',
              className: 'bus-label',
              offset: needsMarkerIcon ? [12, -4] : [6, 0],
            })
          } else {
            updatedMarker.setTooltipContent(bus.linha)
          }
        } else {
          if (hasTooltip) {
            updatedMarker.unbindTooltip()
          }
        }
      } else {
        if (needsMarkerIcon) {
          const marker = L.marker(position, {
            icon: createBusIcon(bus)
          })
          marker.bindPopup(popupContent, { maxWidth: 260, className: 'bus-popup' })
          marker.on('click', () => onSelectBus(bus))

          marker.bindTooltip(bus.linha, {
            permanent: true,
            direction: 'right',
            className: 'bus-label',
            offset: [12, -4],
          })

          group.addLayer(marker)
          leafletMarkersRef.current.set(order, marker)
        } else {
          const size = bus.emMovimento ? 7 : 5
          const marker = L.circleMarker(position, {
            radius: size,
            color: '#ffffff',
            weight: 1.5,
            fillColor: cor,
            fillOpacity: 0.95,
          })
          marker.bindPopup(popupContent, { maxWidth: 260, className: 'bus-popup' })
          marker.on('click', () => onSelectBus(bus))

          if (zoom >= 14) {
            marker.bindTooltip(bus.linha, {
              permanent: true,
              direction: 'right',
              className: 'bus-label',
              offset: [6, 0],
            })
          }

          group.addLayer(marker)
          leafletMarkersRef.current.set(order, marker)
        }
      }
    })

    leafletMarkersRef.current.forEach((marker, order) => {
      if (!currentBuses.has(order)) {
        group.removeLayer(marker)
        leafletMarkersRef.current.delete(order)
      }
    })
  }, [buses, onSelectBus, mapState])

  // 3. Efeito para voar para o ônibus selecionado
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedBus) return
    const lat = typeof selectedBus.latitude === 'string' ? parseFloat(selectedBus.latitude) : selectedBus.latitude
    const lng = typeof selectedBus.longitude === 'string' ? parseFloat(selectedBus.longitude) : selectedBus.longitude
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return
    
    map.flyTo([lat, lng], 16, { duration: 1.2, easeLinearity: 0.35 })

    const marker = leafletMarkersRef.current.get(selectedBus.ordem)
    if (marker) {
      marker.openPopup()
    }
  }, [selectedBus])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={leafletContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
})
