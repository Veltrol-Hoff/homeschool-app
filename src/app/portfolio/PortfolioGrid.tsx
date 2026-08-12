'use client'

import { useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { format } from 'date-fns'
import PortfolioLightbox from '@/components/PortfolioLightbox'
import MediaActions from './MediaActions'

export default function PortfolioGrid({ 
  samples, 
  students, 
  canEdit 
}: { 
  samples: any[], 
  students: any[],
  canEdit: boolean
}) {
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null)

  if (!samples || samples.length === 0) return null

  return (
    <>
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
        {samples.map((sample: any) => {
          const isImage = sample.file_url.match(/\.(jpeg|jpg|gif|png|webp)$/i)
          const date = sample.daily_logs?.date || sample.trips?.start_date || sample.created_at
          const title = sample.daily_logs ? (sample.daily_logs.notes || sample.daily_logs.subjects?.name || 'Daily Log') : (sample.trips?.title || 'Trip')
          
          let studentName = ''
          if (sample.daily_logs?.student_id) {
            const st = students?.find(s => s.id === sample.daily_logs.student_id)
            if (st) studentName = st.name
          } else if (sample.trips?.trip_students?.length > 0) {
            const tripSt = sample.trips.trip_students
            const names = tripSt.map((ts: any) => students?.find(s => s.id === ts.student_id)?.name).filter(Boolean)
            if (names.length > 0) studentName = names.join(', ')
          }
          
          const mediaWithContext = { ...sample, studentName }

          return (
            <div key={sample.id} className="relative break-inside-avoid bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden group hover:shadow-md transition-shadow">
              
              <MediaActions 
                mediaId={sample.id} 
                isPortfolioSample={sample.is_portfolio_sample} 
                fileUrl={sample.file_url} 
              />

              {isImage ? (
                <button 
                  onClick={() => setSelectedMedia(mediaWithContext)}
                  className="block relative w-full text-left"
                >
                  <img src={sample.file_url} alt="Portfolio item" className="w-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer" />
                </button>
              ) : (
                <button 
                  onClick={() => setSelectedMedia(mediaWithContext)}
                  className="w-full aspect-video bg-stone-100 flex flex-col items-center justify-center p-4 hover:bg-stone-200 transition-colors block relative"
                >
                  <LucideIcons.FileText size={48} className="text-stone-400 mb-2" />
                  <span className="text-sm font-medium text-stone-600 truncate w-full text-center">
                    Document
                  </span>
                </button>
              )}
              <div className="p-4 bg-white border-t border-stone-100 relative z-10 cursor-pointer" onClick={() => setSelectedMedia(mediaWithContext)}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-stone-800 text-sm line-clamp-1">{sample.caption || title}</h3>
                  {sample.is_portfolio_sample && (
                    <LucideIcons.Star size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-stone-500 font-medium">
                  {format(new Date(date), 'MMM d, yyyy')}
                </p>
                {sample.daily_logs?.subjects?.name && (
                  <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded mr-2">
                    {sample.daily_logs.subjects.name}
                  </span>
                )}
                {studentName && (
                  <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {studentName}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedMedia && (
        <PortfolioLightbox 
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          canEdit={canEdit}
        />
      )}
    </>
  )
}
