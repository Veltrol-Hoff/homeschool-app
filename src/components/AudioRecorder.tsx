'use client'

import { useState, useRef } from'react'
import { createClient } from'@/utils/supabase/client'
import { useRouter } from'next/navigation'

export default function AudioRecorder({ logId, studentId }: { logId: string, studentId: string }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [narration, setNarration] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  
  const supabase = createClient()
  const router = useRouter()

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type:'audio/webm'})
        await processAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setError(null)
    } catch (err: any) {
      setError("Microphone access denied or unavailable.")
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
      setIsRecording(false)
    }
  }

  async function processAudio(blob: Blob) {
    setIsProcessing(true)
    try {
      // 1. Upload to Supabase Storage
      const fileName = `narration_${Date.now()}.webm`
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, blob)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName)
      
      // 2. Call Transcription API
      const res = await fetch('/api/transcribe', {
        method:'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          audioUrl: urlData.publicUrl,
          logId,
          studentId
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setNarration(data.narration)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  async function confirmTag(tag: string) {
    // In a real app, we'd have a server action for this
    await supabase.from('narrations')
      .update({ tagged_skill: tag, tag_confirmed: true })
      .eq('id', narration.id)
    
    setNarration({ ...narration, tagged_skill: tag, tag_confirmed: true })
    router.refresh()
  }

  return (
    <div className="bg-slate-50  p-4 rounded-xl border border-slate-100">
      <h3 className="font-bold text-slate-900  mb-3 flex items-center gap-2">
        🎙 Narration Capture
      </h3>
      
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {!narration ? (
        <div className="flex items-center gap-4">
          {!isRecording ? (
            <button 
              onClick={startRecording}
              disabled={isProcessing}
              className="bg-red-100 text-red-600 hover:bg-red-200   px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <div className="w-3 h-3 rounded-full bg-red-500"/>
              {isProcessing ?'Processing...':'Record Narration'}
            </button>
          ) : (
            <button 
              onClick={stopRecording}
              className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-full font-medium transition-colors animate-pulse"
            >
              ⏹ Stop Recording
            </button>
          )}
          {isRecording && <span className="text-sm text-stone-500">Listening...</span>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white  p-3 rounded-lg text-sm border border-stone-200">
            <p className="italic text-stone-600">"{narration.transcript_text}"</p>
          </div>
          
          {!narration.tag_confirmed ? (
            <div className="bg-purple-50  p-3 rounded-lg border border-purple-100  text-sm">
              <p className="font-medium text-purple-900  mb-2">
                ✨ AI Suggests this demonstrates: <strong>{narration.tagged_skill}</strong>
              </p>
              <div className="flex gap-2">
                <button onClick={() => confirmTag(narration.tagged_skill)} className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded font-medium">
                  Confirm
                </button>
                <button onClick={() => confirmTag('Retelling')} className="bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 px-3 py-1 rounded">
                  Change to Retelling
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-green-600  font-medium flex items-center gap-1">
              ✓ Skill logged: {narration.tagged_skill}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
