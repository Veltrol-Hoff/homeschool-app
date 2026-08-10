'use client'

import { useState } from'react'
import { generateBioSummary, confirmBioSummary } from'@/app/actions/anthropic'
import { useRouter } from'next/navigation'

export default function ReviewBioModal({
  studentId,
  academicYearId,
  isOpen,
  onClose
}: {
  studentId: string
  academicYearId: string
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [draft, setDraft] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleGenerate() {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await generateBioSummary(studentId, academicYearId)
      setDraft(res.draft)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleConfirm() {
    setIsSaving(true)
    try {
      await confirmBioSummary(academicYearId, draft)
      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white  rounded-xl shadow-lg w-full max-w-2xl overflow-hidden">
        <div className="p-4 border-b border-stone-200  bg-stone-50  flex justify-between items-center">
          <h3 className="font-bold text-lg">AI Living Bio Synthesis</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-700">✕</button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-stone-600">
            Generate an AI draft summarizing the student's living bio entries for this year. You must explicitly review and confirm the text before it is included in the End-of-Year PDF Portfolio.
          </p>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50  rounded-md">
              {error}
            </div>
          )}

          {!draft ? (
            <div className="flex justify-center py-8">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ?'Synthesizing...':'✨ Generate AI Draft'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-medium">Review and Edit Draft:</label>
              <textarea 
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={6}
                className="w-full rounded-md border-stone-300 shadow-sm focus:border-purple-500  p-3 border text-sm"
              />
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setDraft('')}
                  className="px-4 py-2 text-stone-600  hover:bg-stone-100  rounded-md transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={handleConfirm}
                  disabled={isSaving}
                  className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSaving ?'Saving...':'Confirm & Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
