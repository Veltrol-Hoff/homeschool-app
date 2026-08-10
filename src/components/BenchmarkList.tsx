'use client'

import { updateBenchmarkProgress } from'@/app/benchmarks/actions'
import { useState } from'react'

export default function BenchmarkList({ 
  studentId, 
  benchmarks, 
  progress 
}: { 
  studentId: string
  benchmarks: any[]
  progress: any[] 
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function handleStatusChange(benchmarkId: string, status: string) {
    setUpdatingId(benchmarkId)
    try {
      await updateBenchmarkProgress(studentId, benchmarkId, status)
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatingId(null)
    }
  }

  const statuses = ['Not Yet','Emerging','Demonstrated']

  return (
    <div className="space-y-4">
      {benchmarks.map(benchmark => {
        const currentProgress = progress.find(p => p.benchmark_id === benchmark.id)
        const currentStatus = currentProgress?.status ||'Not Yet'
        const isUpdating = updatingId === benchmark.id

        return (
          <div key={benchmark.id} className="bg-white  p-5 rounded-xl border border-stone-100  shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600  bg-purple-50  px-2 py-1 rounded">
                {benchmark.subject}
              </span>
              <p className="mt-2 text-stone-900  font-medium">{benchmark.description}</p>
            </div>
            
            <div className={`flex bg-stone-100  rounded-lg p-1 transition-opacity ${isUpdating ?'opacity-50':''}`}>
              {statuses.map(status => {
                const isSelected = currentStatus === status
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(benchmark.id, status)}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      isSelected 
                        ?'bg-white  shadow text-stone-900'
                        :'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    {status}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
