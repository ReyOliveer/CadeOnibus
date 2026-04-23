import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import L from 'leaflet'
import type { BusPosition } from '../../types'
import { velocidadeCor, sentidoLabel, formatDataHora } from '../../types'

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface BusMapProps {
  buses: BusPosition[]
  selectedBus: BusPosition | null
  onSelectBus: (bus: BusPosition | null) => void
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

export const BusMap = forwardRef<BusMapHandle, BusMapProps>(function BusMap({ buses, selectedBus, onSelectBus }, ref) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const userMarkerRef = useRef<L.CircleMarker | null>(null)

  useImperativeHandle(ref, () => ({
    locateUser() {
      const map = mapRef.current
      if (!map || !navigator.geolocation) return

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const position: L.LatLngExpression = [coords.latitude, coords.longitude]

          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(position)
          } else {
            userMarkerRef.current = L.circleMarker(position, {
              radius: 9,
              color: '#ffffff',
              weight: 3,
              fillColor: '#2563eb',
              fillOpacity: 1,
            }).addTo(map)
          }

          map.flyTo(position, Math.max(map.getZoom(), 15), {
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
  }), [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { center: [-22.9068, -43.1729], zoom: 12 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    const group = L.layerGroup().addTo(map)
    layerGroupRef.current = group
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      layerGroupRef.current = null
      userMarkerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const group = layerGroupRef.current
    if (!map || !group) return
    group.clearLayers()
    buses.forEach((bus) => {
      const lat = typeof bus.latitude === 'string' ? parseFloat(bus.latitude) : bus.latitude
      const lng = typeof bus.longitude === 'string' ? parseFloat(bus.longitude) : bus.longitude
      if (!lat || !lng || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return
      const marker = L.marker([lat, lng], { icon: createBusIcon(bus) })
      marker.bindPopup(createPopupContent(bus), { maxWidth: 260, className: 'bus-popup' })
      marker.on('click', () => onSelectBus(bus))
      group.addLayer(marker)
    })
  }, [buses, onSelectBus])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedBus) return
    const lat = typeof selectedBus.latitude === 'string' ? parseFloat(selectedBus.latitude) : selectedBus.latitude
    const lng = typeof selectedBus.longitude === 'string' ? parseFloat(selectedBus.longitude) : selectedBus.longitude
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return
    map.flyTo([lat, lng], 16, { duration: 1.2, easeLinearity: 0.35 })
  }, [selectedBus])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
})
