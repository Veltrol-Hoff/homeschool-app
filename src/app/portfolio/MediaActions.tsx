'use client'

import { useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { togglePortfolioSample, deleteMediaAttachment } from '@/app/actions/media'

export default function MediaActions({ 
  mediaId, 
  isPortfolioSample,
  fileUrl
}: { 
  mediaId: string
  isPortfolioSample: boolean
  fileUrl: string
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsToggling(true)
    try {
      await togglePortfolioSample(mediaId, isPortfolioSample)
    } catch (err) {
      alert("Failed to update status")
    } finally {
      setIsToggling(false)
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("Are you sure you want to permanently delete this media?")) return
    setIsDeleting(true)
    try {
      await deleteMediaAttachment(mediaId, fileUrl)
    } catch (err) {
      alert("Failed to delete media")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <button 
        onClick={handleToggle}
        disabled={isToggling}
        className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors disabled:opacity-50"
        title={isPortfolioSample ? "Remove from portfolio" : "Add to portfolio"}
      >
        {isPortfolioSample ? (
          <LucideIcons.Star size={18} className="text-yellow-400 fill-yellow-400" />
        ) : (
          <LucideIcons.Star size={18} className="text-white" />
        )}
      </button>
      
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-1.5 rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
        title="Delete media"
      >
        <LucideIcons.Trash2 size={18} />
      </button>
    </div>
  )
}
