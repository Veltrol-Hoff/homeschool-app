'use client'

import { useState, useTransition } from 'react'
import * as LucideIcons from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { uploadPI1206Url, removePI1206Url } from '@/app/compliance/actions'

export default function PI1206Uploader({ 
  year, 
  existingUrl 
}: { 
  year: number,
  existingUrl?: string | null 
}) {
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setErrorMsg('')
    
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `pi_1206_${year}_${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage.from('media').upload(`compliance/${fileName}`, file)
      if (uploadError) throw new Error(uploadError.message)
      
      const { data } = supabase.storage.from('media').getPublicUrl(`compliance/${fileName}`)
      
      startTransition(async () => {
        try {
          await uploadPI1206Url(year, data.publicUrl)
        } catch (err: any) {
          setErrorMsg(err.message)
        }
      })
      
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    if (!confirm('Are you sure you want to remove the PI-1206 form?')) return
    startTransition(async () => {
      try {
        await removePI1206Url(year)
      } catch (err: any) {
        setErrorMsg(err.message)
      }
    })
  }

  return (
    <div className="border border-stone-200 rounded-lg p-3 bg-white">
      <h4 className="text-sm font-semibold text-stone-800 mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <LucideIcons.FileCheck size={16} className="text-blue-500" />
          PI-1206 Form: {year}
        </span>
      </h4>
      
      {errorMsg && (
        <div className="text-red-500 text-xs mb-2">{errorMsg}</div>
      )}

      {existingUrl ? (
        <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-lg border border-stone-200">
          <LucideIcons.FileText size={24} className="text-stone-400" />
          <div className="flex-1">
            <a 
              href={existingUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
            >
              View Uploaded Form <LucideIcons.ExternalLink size={12} />
            </a>
            <p className="text-xs text-stone-500 mt-1">Saved for {year}</p>
          </div>
          <button 
            onClick={handleRemove}
            disabled={isPending}
            className="text-stone-400 hover:text-red-500 transition-colors p-2"
            title="Remove form"
          >
            <LucideIcons.Trash2 size={16} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center border-2 border-dashed border-stone-300 rounded-lg p-6 bg-stone-50 hover:bg-stone-100 transition-colors">
          <label className="flex flex-col items-center cursor-pointer text-center">
            {uploading || isPending ? (
              <LucideIcons.Loader2 className="animate-spin text-stone-400 mb-2" size={24} />
            ) : (
              <LucideIcons.UploadCloud className="text-stone-400 mb-2" size={24} />
            )}
            <span className="text-sm font-medium text-stone-700">
              {uploading || isPending ? 'Uploading...' : 'Upload PI-1206 PDF'}
            </span>
            <span className="text-xs text-stone-500 mt-1">PDF or Image up to 5MB</span>
            <input 
              type="file" 
              accept=".pdf,image/*" 
              className="hidden" 
              onChange={handleFileChange}
              disabled={uploading || isPending}
            />
          </label>
        </div>
      )}
    </div>
  )
}
