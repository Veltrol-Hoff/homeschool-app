'use client'

import { useState } from'react'
import { createClient } from'@/utils/supabase/client'
import { addMediaAttachment, togglePortfolioSample } from'@/app/actions/media'

export default function MediaUpload({ 
  logId, 
  tripId, 
  existingMedia = [] 
}: { 
  logId?: string, 
  tripId?: string, 
  existingMedia?: any[] 
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('media').getPublicUrl(filePath)
      
      await addMediaAttachment(data.publicUrl, logId, tripId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {/* Grid of existing media */}
      {existingMedia.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {existingMedia.map(media => (
            <div key={media.id} className="relative group aspect-square rounded-lg overflow-hidden border border-stone-200  bg-stone-100">
              {/* Note: Ideally we use Next/Image but plain img is fine for this MVP */}
              <img src={media.file_url} alt="Attached media"className="object-cover w-full h-full"/>
              
              <button 
                onClick={() => togglePortfolioSample(media.id, media.is_portfolio_sample)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                title={media.is_portfolio_sample ?"Remove from portfolio":"Add to portfolio"}
              >
                {media.is_portfolio_sample ? (
                  <span className="text-yellow-400">★</span>
                ) : (
                  <span className="text-white opacity-50 group-hover:opacity-100">☆</span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <div>
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200   text-sm font-medium rounded-lg transition-colors">
          {uploading ?'Uploading...':'📷 Add Photo/Video'}
          <input 
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  )
}
