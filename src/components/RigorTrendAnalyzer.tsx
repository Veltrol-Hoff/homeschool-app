'use client'

import { useState, useEffect } from 'react'
import * as LucideIcons from 'lucide-react'

export default function RigorTrendAnalyzer({ studentId }: { studentId: string }) {
  const [data, setData] = useState<{ flagged: boolean; message: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalysis() {
      setLoading(true)
      try {
        const res = await fetch(`/api/analyze-rigor?studentId=${studentId}`)
        if (res.ok) {
          const json = await res.json()
          setData({ flagged: json.flagged, message: json.message })
        }
      } catch (err) {
        console.error("Failed to fetch rigor analysis", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalysis()
  }, [studentId])

  if (loading) {
    return (
      <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl shadow-sm flex items-center justify-center text-stone-500 gap-2">
        <LucideIcons.Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Analyzing Rigor Trend...</span>
      </div>
    )
  }

  if (!data?.flagged) return null // Hide if no alert

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl shadow-sm flex items-start gap-3">
      <LucideIcons.TrendingDown className="text-amber-600 shrink-0 mt-0.5" size={20} />
      <div>
        <h3 className="font-semibold text-amber-900 mb-1">Rigor Trend Alert</h3>
        <p className="text-sm text-amber-800 leading-relaxed">
          {data.message}
        </p>
      </div>
    </div>
  )
}
