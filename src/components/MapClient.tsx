'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

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
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer)
      }
    })

    // Add new markers
    validTrips.forEach(trip => {
      if (trip.latitude && trip.longitude) {
        const marker = L.marker([trip.latitude, trip.longitude]).addTo(mapRef.current!)
        
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
            <strong style="color: ${color}">${title}</strong>
            ${dateDisplay ? `<div class="text-xs text-stone-500 font-medium mt-1 mb-1">${dateDisplay}</div>` : ''}
            <p class="text-stone-600 mt-1">${loc}</p>
            ${theme ? `<p class="text-xs text-stone-400 mt-1 italic">${theme}</p>` : ''}
          </div>
        `)
      }
    })

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
