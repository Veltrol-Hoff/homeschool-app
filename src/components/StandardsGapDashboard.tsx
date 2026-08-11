'use client'

import React, { useState, useEffect } from 'react'
import * as LucideIcons from 'lucide-react'

interface Standard {
  id: string
  code: string
  short_description: string
  subject: string
  isCovered: boolean
  lessonCount: number
}

interface StandardsGapDashboardProps {
  gradeLevel: string
  standardsCoverage: Standard[]
  complianceYearStart: Date
  complianceYearEnd: Date
}

export default function StandardsGapDashboard({
  gradeLevel,
  standardsCoverage,
  complianceYearStart,
  complianceYearEnd
}: StandardsGapDashboardProps) {
  // Use state for elapsed calculation to avoid hydration mismatch
  const [elapsedPercentage, setElapsedPercentage] = useState<number>(0)
  
  useEffect(() => {
    const now = new Date()
    const start = new Date(complianceYearStart).getTime()
    const end = new Date(complianceYearEnd).getTime()
    const current = now.getTime()
    
    let percent = ((current - start) / (end - start)) * 100
    if (percent < 0) percent = 0
    if (percent > 100) percent = 100
    
    setElapsedPercentage(percent)
  }, [complianceYearStart, complianceYearEnd])

  const totalStandards = standardsCoverage.length
  
  if (totalStandards === 0) {
    return (
      <div className="mt-8 pt-6 border-t border-stone-100">
        <h3 className="font-semibold text-lg mb-4 text-stone-700">
          Standards Coverage (Grade {gradeLevel})
        </h3>
        <p className="text-stone-500 text-sm">No standards defined for this grade level.</p>
      </div>
    )
  }

  const coveredStandards = standardsCoverage.filter(s => s.isCovered).length
  const coveragePercent = Math.round((coveredStandards / totalStandards) * 100)
  
  const isPastHalfway = elapsedPercentage > 50
  const hasGaps = coveredStandards < totalStandards

  const uncoveredStandards = standardsCoverage.filter(s => !s.isCovered)
  // Get top 3 uncovered subjects to suggest
  const subjectGaps = uncoveredStandards.reduce((acc, curr) => {
    acc[curr.subject] = (acc[curr.subject] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const suggestedFocusAreas = Object.entries(subjectGaps)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0])

  return (
    <div className="mt-8 pt-6 border-t border-stone-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="font-semibold text-lg text-stone-700">
          Standards Coverage (Grade {gradeLevel})
        </h3>
        
        {/* Coverage Progress Bar */}
        <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-lg border border-stone-100 min-w-[250px]">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1 font-medium text-stone-600">
              <span>Coverage</span>
              <span>{coveragePercent}%</span>
            </div>
            <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-stone-500 font-medium text-right">
            {coveredStandards} / {totalStandards}
          </div>
        </div>
      </div>

      {/* Gap Suggestions (Dynamic trigger > 50% elapsed) */}
      {isPastHalfway && hasGaps && (
        <div className="mb-8 p-5 bg-amber-50 rounded-xl border border-amber-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 opacity-5 rounded-full -mr-10 -mt-10 blur-xl"></div>
          
          <div className="relative z-10 flex gap-4">
            <div className="mt-1 flex-shrink-0">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center border border-amber-200">
                <LucideIcons.Lightbulb className="text-amber-600 w-5 h-5" />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-amber-900 mb-1">Gap-Closing Suggestions</h4>
              <p className="text-sm text-amber-800 mb-3">
                You are over halfway through the academic year ({Math.round(elapsedPercentage)}% elapsed). 
                Consider planning activities for these uncovered standards.
              </p>
              
              {suggestedFocusAreas.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs font-semibold text-amber-900 flex items-center">Focus Areas:</span>
                  {suggestedFocusAreas.map(area => (
                    <span key={area} className="text-xs font-medium bg-white text-amber-700 px-2 py-1 rounded-md border border-amber-200 shadow-sm">
                      {area}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {uncoveredStandards.slice(0, 5).map(std => (
                  <div key={std.id} className="bg-white/60 p-2.5 rounded-md border border-amber-100 text-sm">
                    <span className="font-semibold text-amber-900 mr-2">{std.code}</span>
                    <span className="text-amber-800 line-clamp-1" title={std.short_description}>
                      {std.short_description}
                    </span>
                  </div>
                ))}
                {uncoveredStandards.length > 5 && (
                  <div className="text-xs text-amber-700 font-medium text-center pt-1">
                    + {uncoveredStandards.length - 5} more uncovered standards
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of all standards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {standardsCoverage.map((std) => (
          <div key={std.id} className={`flex items-start gap-3 p-3 rounded-lg border ${std.isCovered ? 'bg-stone-50 border-stone-100' : 'bg-white border-stone-200 opacity-80'}`}>
            <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center text-xs flex-shrink-0 transition-colors ${std.isCovered ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-stone-100 text-transparent border border-stone-300 shadow-inner'}`}>
              {std.isCovered ? '✓' : ''}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <span className={`font-semibold text-sm ${std.isCovered ? 'text-stone-900' : 'text-stone-600'}`}>
                  {std.code}
                </span>
                {std.isCovered && (
                  <span className="text-[10px] uppercase font-bold tracking-wide bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex-shrink-0">
                    {std.lessonCount} {std.lessonCount === 1 ? 'lesson' : 'lessons'}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-1 line-clamp-2" title={std.short_description}>
                {std.short_description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
