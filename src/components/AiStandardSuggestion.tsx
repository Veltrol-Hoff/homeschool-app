'use client'

import { useState } from'react'
import { confirmStandardSuggestion } from'@/app/curriculum/items/standards_actions'

export default function AiStandardSuggestion({ 
  curriculumItemId, 
  itemTitle, 
  subjectName,
  existingSuggestion 
}: { 
  curriculumItemId: string,
  itemTitle: string,
  subjectName: string,
  existingSuggestion: { standard_id: string, code: string, description: string, confirmed: boolean } | null 
}) {
  const [suggestion, setSuggestion] = useState(existingSuggestion)
  const [isRequesting, setIsRequesting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hidden, setHidden] = useState(false)

  async function requestSuggestion() {
    setIsRequesting(true)
    try {
      const res = await fetch('/api/suggest-standards', {
        method:'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ itemId: curriculumItemId, description: itemTitle, subjectName })
      })
      const data = await res.json()
      if (data.success) {
        setSuggestion({ ...data.suggestion, confirmed: false })
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert("Failed to get suggestion")
    } finally {
      setIsRequesting(false)
    }
  }

  async function handleAction(confirm: boolean) {
    if (!suggestion) return
    setIsProcessing(true)
    try {
      await confirmStandardSuggestion(curriculumItemId, suggestion.standard_id, confirm)
      if (confirm) {
        setSuggestion({ ...suggestion, confirmed: true })
      } else {
        setHidden(true)
      }
    } catch (err) {
      alert("Failed to process")
    } finally {
      setIsProcessing(false)
    }
  }

  if (hidden) return null

  if (!suggestion) {
    return (
      <button 
        onClick={requestSuggestion}
        disabled={isRequesting}
        className="text-xs px-2 py-1 bg-purple-100 text-purple-700   rounded hover:bg-purple-200 transition-colors flex items-center gap-1 disabled:opacity-50"
      >
        ✨ {isRequesting ?'Analyzing...':'Auto-tag standard'}
      </button>
    )
  }

  if (suggestion.confirmed) {
    return (
      <span className="text-xs px-2 py-1 bg-green-100 text-green-800   rounded flex items-center gap-1 border border-green-200">
        ✓ {suggestion.code}
      </span>
    )
  }

  return (
    <div className="mt-2 text-sm bg-purple-50  border border-purple-100  p-3 rounded-md flex flex-col gap-2">
      <div className="flex gap-2 items-start">
        <span className="text-purple-500 mt-0.5">✨</span>
        <div>
          <p className="font-semibold text-purple-900  text-xs uppercase tracking-wide">Suggested Standard</p>
          <p className="font-medium text-stone-900">{suggestion.code}</p>
          <p className="text-stone-600  text-xs mt-0.5">{suggestion.description}</p>
        </div>
      </div>
      
      <div className="flex gap-2 justify-end mt-1">
        <button 
          onClick={() => handleAction(false)}
          disabled={isProcessing}
          className="text-xs px-3 py-1.5 text-stone-600 hover:bg-stone-200   rounded transition-colors disabled:opacity-50"
        >
          Reject
        </button>
        <button 
          onClick={() => handleAction(true)}
          disabled={isProcessing}
          className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          Confirm Tag
        </button>
      </div>
    </div>
  )
}
