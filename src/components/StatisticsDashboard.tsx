'use client'

import React from 'react'
import * as LucideIcons from 'lucide-react'
import { subDays, format } from 'date-fns'

export default function StatisticsDashboard({ logs }: { logs: any[] }) {
  // --- Data Processing ---
  
  const completedLogs = logs.filter(l => l.log_type === 'Completed')
  
  // 1. On-Time Completion Rate
  const onTimeLogs = completedLogs.filter(l => !l.original_date || l.date === l.original_date)
  const onTimeRate = completedLogs.length > 0 ? Math.round((onTimeLogs.length / completedLogs.length) * 100) : 100

  // 2. Average Days Delayed
  const bumpedLogs = logs.filter(l => l.original_date && l.date !== l.original_date)
  let totalDaysDelayed = 0
  bumpedLogs.forEach(l => {
    const diff = new Date(l.date).getTime() - new Date(l.original_date!).getTime()
    totalDaysDelayed += diff / (1000 * 3600 * 24)
  })
  const avgDaysDelayed = bumpedLogs.length > 0 ? (totalDaysDelayed / bumpedLogs.length).toFixed(1) : "0"

  // 3. Most Bumped Subjects
  const bumpedSubjectCounts: Record<string, { count: number, name: string, color: string, icon: string }> = {}
  bumpedLogs.forEach(l => {
    if (l.subjects) {
      if (!bumpedSubjectCounts[l.subjects.name]) {
        bumpedSubjectCounts[l.subjects.name] = { 
          count: 0, 
          name: l.subjects.name, 
          color: l.subjects.color_hex || '#64748b',
          icon: l.subjects.icon_name || 'BookOpen'
        }
      }
      bumpedSubjectCounts[l.subjects.name].count += 1
    }
  })
  const mostBumpedSubjects = Object.values(bumpedSubjectCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  // 4. Late Check-offs
  const lateCheckoffs = completedLogs.filter(l => {
    if (!l.completed_date) return false
    // Skip if it was actually rescheduled (bumped)
    if (l.original_date && l.original_date !== l.date) return false
    
    // Parse midnight UTC correctly
    const [y, m, d] = l.date.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    
    const completedObj = new Date(l.completed_date)
    const diff = completedObj.getTime() - dateObj.getTime()
    return diff > (1000 * 3600 * 24 * 1.5) // ~36 hours after 00:00 of the scheduled day
  })
  const lateCheckoffCount = lateCheckoffs.length

  // 5. Completion Velocity (Last 7 Days)
  const velocityData = []
  
  let localMax = 1
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i)
    const [yy, mm, dd] = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')]
    const dateStr = `${yy}-${mm}-${dd}`
    const dayLogs = logs.filter(l => l.date === dateStr)
    const planned = dayLogs.filter(l => l.log_type === 'Planned').length
    const completed = dayLogs.filter(l => l.log_type === 'Completed').length
    
    if (planned + completed > localMax) localMax = planned + completed
    
    velocityData.push({ label: format(d, 'EEE'), planned, completed })
  }

  const renderIcon = (iconName: string, className = "w-4 h-4") => {
    const Icon = (LucideIcons as any)[iconName]
    return Icon ? <Icon className={className} /> : <LucideIcons.BookOpen className={className} />
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <LucideIcons.BarChart2 className="w-5 h-5 text-slate-500" />
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Statistics & Insights</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: On-Time Rate */}
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-100 flex items-start gap-4">
          <div className="p-3 bg-white rounded-full shadow-sm">
            <LucideIcons.CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500 mb-1">On-Time Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-stone-900">{onTimeRate}%</span>
            </div>
            <p className="text-xs text-stone-400 mt-1">Tasks completed without bumping</p>
          </div>
        </div>

        {/* Metric 2: Avg Days Delayed */}
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-100 flex items-start gap-4">
          <div className="p-3 bg-white rounded-full shadow-sm">
            <LucideIcons.Clock className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500 mb-1">Avg Delay</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-stone-900">{avgDaysDelayed}</span>
              <span className="text-sm font-medium text-stone-500">days</span>
            </div>
            <p className="text-xs text-stone-400 mt-1">When tasks get bumped</p>
          </div>
        </div>

        {/* Metric 4: Late Check-offs */}
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-100 flex items-start gap-4">
          <div className="p-3 bg-white rounded-full shadow-sm">
            <LucideIcons.History className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500 mb-1">Late Check-offs</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-stone-900">{lateCheckoffCount}</span>
            </div>
            <p className="text-xs text-stone-400 mt-1">Checked off late (unbumped)</p>
          </div>
        </div>
        
        {/* Metric 3: Most Bumped Subjects */}
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-100 col-span-1 md:col-span-1 lg:col-span-1 flex flex-col justify-center">
          <p className="text-sm font-medium text-stone-500 mb-3">Most Bumped Subjects</p>
          {mostBumpedSubjects.length > 0 ? (
            <div className="space-y-2">
              {mostBumpedSubjects.map((sub, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-stone-700">
                    <span style={{ color: sub.color }}>{renderIcon(sub.icon, "w-4 h-4")}</span>
                    <span className="truncate max-w-[100px]" title={sub.name}>{sub.name}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white shadow-sm border border-stone-200">
                    {sub.count}x
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 italic">No bumped subjects yet.</p>
          )}
        </div>

      </div>

      {/* Metric 5: Velocity Chart */}
      <div className="mt-6 border-t border-stone-100 pt-6">
        <p className="text-sm font-medium text-stone-500 mb-4">Completion Velocity (Last 7 Days)</p>
        <div className="flex items-end justify-between h-32 gap-2">
          {velocityData.map((day, i) => {
            const hPlanned = Math.max(0, (day.planned / localMax) * 100)
            const hCompleted = Math.max(0, (day.completed / localMax) * 100)
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-default">
                <div className="w-full flex justify-center items-end h-full gap-1 relative">
                  
                  {/* Tooltip */}
                  <div className="absolute -top-10 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                    {day.completed} completed, {day.planned} planned
                  </div>

                  {/* Planned Bar */}
                  {day.planned > 0 && (
                    <div 
                      className="w-1/3 max-w-[12px] bg-stone-200 rounded-t-sm transition-all hover:bg-stone-300"
                      style={{ height: `${hPlanned}%` }}
                    />
                  )}
                  {/* Completed Bar */}
                  {day.completed > 0 && (
                    <div 
                      className="w-1/3 max-w-[12px] bg-emerald-400 rounded-t-sm transition-all hover:bg-emerald-500"
                      style={{ height: `${hCompleted}%` }}
                    />
                  )}
                </div>
                <span className="text-xs text-stone-400 font-medium">{day.label}</span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 justify-center text-xs text-stone-500 font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-stone-200 rounded-sm"></div>
            <span>Planned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-emerald-400 rounded-sm"></div>
            <span>Completed</span>
          </div>
        </div>
      </div>

    </div>
  )
}
