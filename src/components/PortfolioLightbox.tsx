'use client'

import { useState, useTransition, useEffect } from 'react'
import * as LucideIcons from 'lucide-react'
import { format } from 'date-fns'
import { updateMediaCaption, togglePortfolioSample } from '@/app/actions/media'

export default function PortfolioLightbox({
  media,
  onClose,
  canEdit
}: {
  media: any
  onClose: () => void
  canEdit: boolean
}) {
  const [caption, setCaption] = useState(media.caption || '')
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isStarred, setIsStarred] = useState(media.is_portfolio_sample)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const date = media.daily_logs?.date || media.trips?.start_date || media.created_at
  const defaultTitle = media.daily_logs ? (media.daily_logs.notes || media.daily_logs.subjects?.name || 'Daily Log') : (media.trips?.title || 'Trip')
  const isImage = media.file_url.match(/\.(jpeg|jpg|gif|png|webp)$/i)

  const handleSaveCaption = () => {
    startTransition(async () => {
      try {
        await updateMediaCaption(media.id, caption)
        setIsEditing(false)
      } catch (err) {
        alert("Failed to save caption")
      }
    })
  }

  const handleToggleStar = () => {
    startTransition(async () => {
      try {
        await togglePortfolioSample(media.id, isStarred)
        setIsStarred(!isStarred)
      } catch (err) {
        alert("Failed to toggle star")
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors z-50"
      >
        <LucideIcons.X size={24} />
      </button>

      <div className="flex flex-col md:flex-row w-full max-w-6xl h-full max-h-[90vh] bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-stone-800">
        
        {/* Media Viewer */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden min-h-[40vh] md:min-h-0">
          {isImage ? (
            <img 
              src={media.file_url} 
              alt={caption || defaultTitle} 
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-center text-stone-500">
              <LucideIcons.FileText size={64} className="mx-auto mb-4 opacity-50" />
              <p>Document File</p>
              <a 
                href={media.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Open in new tab
              </a>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="w-full md:w-80 lg:w-96 bg-white flex flex-col shrink-0">
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-xl text-stone-900">{defaultTitle}</h3>
                <p className="text-stone-500 text-sm font-medium mt-1">
                  {format(new Date(date), 'MMMM d, yyyy')}
                </p>
              </div>
              {canEdit && (
                <button 
                  onClick={handleToggleStar}
                  disabled={isPending}
                  className="p-2 rounded-full hover:bg-stone-100 transition-colors"
                >
                  <LucideIcons.Star 
                    size={24} 
                    className={isStarred ? "text-yellow-500 fill-yellow-500" : "text-stone-300"} 
                  />
                </button>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Caption</h4>
                {canEdit && !isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-slate-600 hover:text-slate-800 font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    rows={4}
                    className="w-full text-sm rounded-lg border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 p-3 resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => {
                        setCaption(media.caption || '')
                        setIsEditing(false)
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveCaption}
                      disabled={isPending}
                      className="px-3 py-1.5 text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50"
                    >
                      {isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-stone-700 text-sm bg-stone-50 p-4 rounded-xl border border-stone-100 whitespace-pre-wrap">
                  {caption || <span className="text-stone-400 italic">No caption added yet.</span>}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Context</h4>
              <div className="space-y-2">
                {media.daily_logs?.subjects && (
                  <div className="flex items-center gap-2 text-sm text-stone-600 bg-stone-50 px-3 py-2 rounded-lg border border-stone-100">
                    <LucideIcons.BookOpen size={16} className="text-stone-400" />
                    <span className="font-medium">{media.daily_logs.subjects.name}</span>
                  </div>
                )}
                {media.studentName && (
                  <div className="flex items-center gap-2 text-sm text-stone-600 bg-stone-50 px-3 py-2 rounded-lg border border-stone-100">
                    <LucideIcons.User size={16} className="text-stone-400" />
                    <span className="font-medium">{media.studentName}</span>
                  </div>
                )}
                {media.trips && (
                  <div className="flex items-center gap-2 text-sm text-stone-600 bg-stone-50 px-3 py-2 rounded-lg border border-stone-100">
                    <LucideIcons.Plane size={16} className="text-stone-400" />
                    <span className="font-medium">Field Trip</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
