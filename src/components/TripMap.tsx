'use client'
import dynamic from 'next/dynamic'

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-stone-100 animate-pulse rounded-2xl border border-stone-200 flex items-center justify-center text-stone-500">Loading Map...</div>
})

export default function TripMap({ trips }: { trips: any[] }) {
  return <MapClient trips={trips} />
}
