'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import L from 'leaflet'
import 'leaflet.markercluster'

export default function MapClient({ trips }: { trips: any[] }) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fix for default marker icons missing in Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }, [])

  const defaultCenter: [number, number] = [39.8283, -98.5795] // Center of US
  const validTrips = trips.filter(t => t.latitude && t.longitude)
  
  const center: [number, number] = validTrips.length > 0 
    ? [validTrips[0].latitude, validTrips[0].longitude] 
    : defaultCenter

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return

    // Only initialize the map if it doesn't already exist
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView(center, 4)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current)
    }

    // Clear existing markers (in case trips change)
    mapRef.current.eachLayer((layer) => {
      // Don't remove the tile layer, only remove marker clusters or markers
      if (layer instanceof L.Marker || (layer as any).addLayer) {
        if (!(layer instanceof L.TileLayer)) {
          mapRef.current?.removeLayer(layer)
        }
      }
    })

    // @ts-ignore
    const markerCluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40
    });

    // Add new markers
    validTrips.forEach(trip => {
      if (trip.latitude && trip.longitude) {
        
        const now = new Date().toISOString()
        let markerColor = '#9ca3af' // grey for future
        if (trip.start_date <= now) {
          const year = new Date(trip.start_date).getFullYear()
          const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e']
          markerColor = colors[year % colors.length]
        }

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="32">
          <path fill="${markerColor}" stroke="white" stroke-width="20" d="M172.3 501.7C27 291 0 269.4 0 192 0 86 86 0 192 0s192 86 192 192c0 77.4-27 99-172.3 309.7-9.5 13.8-29.9 13.8-39.5 0zM192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z"/>
        </svg>`;
        
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: svg,
          iconSize: [24, 32],
          iconAnchor: [12, 32],
          popupAnchor: [0, -32]
        });

        const marker = L.marker([trip.latitude, trip.longitude], { icon: customIcon })
        
        // Escape content safely
        const title = trip.title || 'Trip'
        const color = trip.display_color || '#000'
        const loc = trip.location || ''
        const theme = trip.theme || ''
        
        let dateDisplay = ''
        if (trip.start_date) {
          const dateStr = new Date(trip.start_date).toLocaleDateString()
          const endStr = trip.end_date ? new Date(trip.end_date).toLocaleDateString() : dateStr
          dateDisplay = dateStr === endStr ? dateStr : `${dateStr} - ${endStr}`
        }
        
        marker.bindPopup(`
          <div class="text-sm">
            <a href="/calendar?viewTrip=${trip.id}" style="color: ${color}" class="font-bold text-base hover:underline">${title}</a>
            ${dateDisplay ? `<div class="text-xs text-stone-500 font-medium mt-1 mb-1">${dateDisplay}</div>` : ''}
            <p class="text-stone-600 mt-1">${loc}</p>
            ${theme ? `<p class="text-xs text-stone-400 mt-1 italic">${theme}</p>` : ''}
          </div>
        `)
        
        markerCluster.addLayer(marker)
      }
    })
    
    mapRef.current.addLayer(markerCluster)

    // Cleanup function for Strict Mode
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [validTrips, center])

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-sm border border-stone-200 z-0 relative isolate">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
