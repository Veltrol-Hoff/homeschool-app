'use client'

import { useState } from'react'
import { createClient } from'@/utils/supabase/client'

export default function WorkSampleUploader({ 
  logId, 
  subjectId 
}: { 
  logId: string, 
  subjectId?: string 
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<{type:'success'|'error', text: string} | null>(null)
  
  const supabase = createClient()

  async function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setMessage(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${logId}/${fileName}`

      // Upload to'media'bucket (assuming it was created in Phase 2)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      setIsUploading(false)
      setIsProcessing(true)

      // Call API to analyze and save
      const res = await fetch('/api/work-sample', {
        method:'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ 
          imageUrl: publicUrl, 
          logId, 
          subjectId 
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ||'Failed to analyze work sample')

      setMessage({ type:'success', text:'Work sample saved and analyzed!'})

    } catch (err: any) {
      console.error(err)
      setMessage({ type:'error', text: err.message })
    } finally {
      setIsUploading(false)
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-stone-50  p-4 rounded-xl border border-stone-200">
      <h3 className="font-semibold text-stone-800  mb-2 flex items-center gap-2">
        <span>📸</span> Photograph Work Sample
      </h3>
      <p className="text-sm text-stone-500 mb-4">
        Snap a picture of a worksheet or project. AI will draft feedback and a suggested score.
      </p>

      {message ? (
        <div className={`p-3 rounded-md text-sm ${message.type ==='success'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      ) : (
        <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium text-white transition-colors ${
          (isUploading || isProcessing) ?'bg-stone-400 cursor-not-allowed':'bg-slate-600 hover:bg-slate-700'
        }`}>
          {isUploading ?'Uploading...': isProcessing ?'AI Analyzing...':'Take Photo'}
          <input 
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCapture}
            disabled={isUploading || isProcessing}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}
