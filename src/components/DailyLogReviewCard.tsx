'use client'

import { useState } from 'react'
import { approveLog, rejectLog } from '@/app/review/actions'

export default function DailyLogReviewCard({ log }: { log: any }) {
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleApprove() {
    setIsProcessing(true)
    try {
      await approveLog(log.id)
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleReject() {
    if (!confirm("Are you sure you want to reject and delete this log?")) return
    setIsProcessing(true)
    try {
      await rejectLog(log.id)
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden flex flex-col md:flex-row">
      <div className="md:w-1/4 bg-blue-50 flex flex-col items-center justify-center p-6 text-blue-600 border-r border-blue-100">
        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span className="font-bold text-sm text-center">Student Log</span>
      </div>

      <div className="md:w-3/4 p-6 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg text-stone-900">{log.students?.name} logged an activity</h3>
              <p className="text-sm text-stone-500">{log.date} • {log.subjects?.name || 'General'} • {log.duration_minutes} min</p>
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              Needs Approval
            </span>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-md p-4 text-stone-700 text-sm italic">
            "{log.notes || 'No notes provided.'}"
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
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Approve & Credit'}
          </button>
        </div>
      </div>
    </div>
  )
}
