'use client'

import { useState } from 'react'
import { approveNarrationTag, rejectNarrationTag } from '@/app/review/actions'

export default function NarrationReviewCard({ narration }: { narration: any }) {
  const [skill, setSkill] = useState(narration.tagged_skill || '')
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleApprove() {
    setIsProcessing(true)
    try {
      await approveNarrationTag(narration.id, skill)
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleReject() {
    if (!confirm("Are you sure you want to reject and delete this narration entirely?")) return
    setIsProcessing(true)
    try {
      await rejectNarrationTag(narration.id)
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden flex flex-col md:flex-row">
      <div className="md:w-1/4 bg-purple-50 flex flex-col items-center justify-center p-6 text-purple-600 border-r border-purple-100">
        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
        <span className="font-bold text-sm text-center">Narration Tag</span>
      </div>

      <div className="md:w-3/4 p-6 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg text-stone-900">{narration.students?.name} captured a narration</h3>
              <p className="text-sm text-stone-500">{new Date(narration.created_at).toLocaleDateString()}</p>
            </div>
            <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              Needs Approval
            </span>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-md p-4 text-stone-700 text-sm mb-4">
            <p className="font-bold text-xs text-stone-500 uppercase tracking-wider mb-1">Transcript</p>
            "{narration.transcript_text || 'No transcript available.'}"
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-stone-700">AI Suggested Skill Tag</label>
            <input 
              type="text"
              value={skill}
              onChange={e => setSkill(e.target.value)}
              className="w-full bg-white border-stone-300 rounded-md p-2 text-sm focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-stone-100 gap-3">
          <button 
            onClick={handleReject}
            disabled={isProcessing}
            className="px-4 py-2 rounded-md font-medium text-stone-500 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            Reject & Delete
          </button>
          <button 
            onClick={handleApprove}
            disabled={isProcessing}
            className="bg-purple-600 text-white px-6 py-2 rounded-md font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Confirm Tag'}
          </button>
        </div>
      </div>
    </div>
  )
}
