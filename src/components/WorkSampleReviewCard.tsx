'use client'

import { useState } from 'react'
import { confirmWorkSample } from '@/app/review/actions'
import * as LucideIcons from 'lucide-react'

export default function WorkSampleReviewCard({ sample }: { sample: any }) {
  const [feedback, setFeedback] = useState(sample.ai_feedback ||'')
  const [score, setScore] = useState(sample.ai_suggested_score ||'Emerging')
  const [isConfirming, setIsConfirming] = useState(false)

  async function handleConfirm() {
    setIsConfirming(true)
    try {
      await confirmWorkSample(sample.id, feedback, score)
    } catch (e) {
      console.error(e)
    } finally {
      setIsConfirming(false)
    }
  }

  const scores = ['Not Yet', 'Emerging', 'Demonstrated', 'Mastered']
  
  const pacingType = sample.daily_logs?.curriculum_items?.curricula?.pacing_type
  const isMasteryPaced = pacingType === 'mastery' || pacingType === 'mastery_paced'
  const isLowScore = score === 'Needs Practice' || score === 'Emerging' || score === 'Not Yet'
  const willShiftSchedule = isMasteryPaced && isLowScore

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden flex flex-col md:flex-row">
      <div className="md:w-1/3 bg-stone-100  flex items-center justify-center p-4">
        {/* We use standard img here instead of next/image since URLs are dynamic from supabase bucket */}
        <img src={sample.image_url} alt="Work sample"className="max-h-64 object-contain rounded-md shadow-sm"/>
      </div>

      <div className="md:w-2/3 p-6 flex flex-col justify-between space-y-6">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg text-stone-900">Work Sample Review</h3>
              <p className="text-sm text-stone-500">Student Log: {sample.daily_logs?.date}</p>
            </div>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              Needs Review
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-stone-700">AI Drafted Feedback</label>
              <textarea 
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={4}
                className="w-full bg-stone-50  border-stone-300  rounded-md p-3 text-sm focus:ring-slate-500 focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-stone-700">Confirmed Mastery Score</label>
              <div className="flex flex-wrap gap-2">
                {scores.map(s => (
                  <button
                    key={s}
                    onClick={() => setScore(s)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      score === s 
                        ?'bg-slate-600 text-white shadow-sm'
                        :'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            
            {willShiftSchedule && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md flex gap-2 text-sm">
                <LucideIcons.AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                <div>
                  <strong>Schedule Shift Warning:</strong> Confirming this low score for a Mastery-Paced curriculum will automatically insert a Review Day tomorrow and push back all future planned lessons by one day.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-stone-100">
          <button 
            onClick={handleConfirm}
            disabled={isConfirming}
            className="bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isConfirming ?'Confirming...':'Confirm & Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
