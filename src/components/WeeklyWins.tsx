'use client'

import * as LucideIcons from 'lucide-react'

interface WeeklyWinsProps {
  completedActivities: number;
  totalHours: number;
  standardsMastered: number;
}

export default function WeeklyWins({ completedActivities, totalHours, standardsMastered }: WeeklyWinsProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-emerald-800">
        <LucideIcons.Trophy size={20} className="text-emerald-600" />
        <h3 className="font-bold">Weekly Wins</h3>
      </div>
      
      <p className="text-sm text-emerald-700 mb-4">
        Great momentum over the last 7 days!
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white/60 backdrop-blur rounded-xl p-3 text-center border border-emerald-100/50">
          <div className="flex justify-center mb-1">
            <LucideIcons.CheckCircle2 size={24} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-900">{completedActivities}</p>
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Activities</p>
        </div>
        
        <div className="bg-white/60 backdrop-blur rounded-xl p-3 text-center border border-emerald-100/50">
          <div className="flex justify-center mb-1">
            <LucideIcons.Clock size={24} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-900">{totalHours}</p>
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Hours Logged</p>
        </div>

        <div className="bg-white/60 backdrop-blur rounded-xl p-3 text-center border border-emerald-100/50">
          <div className="flex justify-center mb-1">
            <LucideIcons.GraduationCap size={24} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-900">{standardsMastered}</p>
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Standards</p>
        </div>
      </div>
    </div>
  )
}
