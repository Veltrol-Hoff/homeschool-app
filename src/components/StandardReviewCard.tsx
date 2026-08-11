'use client'

import { useState } from 'react'
import { approveStandardSuggestion, rejectStandardSuggestion } from '@/app/review/actions'

export default function StandardReviewCard({ suggestion }: { suggestion: any }) {
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleApprove() {
    setIsProcessing(true)
    try {
      await approveStandardSuggestion(suggestion.curriculum_item_id, suggestion.standard_id)
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleReject() {
    setIsProcessing(true)
    try {
      await rejectStandardSuggestion(suggestion.curriculum_item_id, suggestion.standard_id)
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden flex flex-col md:flex-row">
      <div className="md:w-1/4 bg-yellow-50 flex flex-col items-center justify-center p-6 text-yellow-600 border-r border-yellow-100">
        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
        <span className="font-bold text-sm text-center">AI Standard Match</span>
      </div>

      <div className="md:w-3/4 p-6 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg text-stone-900">Suggested Standard Link</h3>
              <p className="text-sm text-stone-500">For curriculum item: <strong>{suggestion.curriculum_items?.title}</strong></p>
            </div>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              Needs Confirmation
            </span>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-md p-4 text-stone-700 text-sm mt-3">
            <p className="font-bold text-stone-900 mb-1">{suggestion.standards?.code}</p>
            <p>{suggestion.standards?.short_description}</p>
            <p className="text-xs text-stone-500 mt-2 uppercase tracking-wider">{suggestion.standards?.framework} • {suggestion.standards?.subject} • Grade {suggestion.standards?.grade_level}</p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-stone-100 gap-3">
          <button 
            onClick={handleReject}
            disabled={isProcessing}
            className="px-4 py-2 rounded-md font-medium text-stone-500 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            Dismiss Link
          </button>
          <button 
            onClick={handleApprove}
            disabled={isProcessing}
            className="bg-yellow-600 text-white px-6 py-2 rounded-md font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Confirm Match'}
          </button>
        </div>
      </div>
    </div>
  )
}
