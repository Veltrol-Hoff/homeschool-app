'use client'

import * as LucideIcons from'lucide-react'
import { useRouter, useSearchParams } from'next/navigation'
import { useTransition } from'react'
import { toggleLogCompletion } from'@/app/calendar/actions'

function renderIcon(iconName: string | undefined, className ="w-5 h-5") {
  if (!iconName) return <LucideIcons.BookOpen className={className} />
  const Icon = (LucideIcons as any)[iconName]
  return Icon ? <Icon className={className} /> : <LucideIcons.BookOpen className={className} />
}

export default function DailyChecklist({ dayLogs }: { dayLogs: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleToggleCompletion(id: string, currentlyCompleted: boolean, logDate: string) {
    if (!currentlyCompleted && logDate !== new Date().toISOString().split('T')[0]) {
      const moveToToday = confirm("Do you want to move this task to today before checking it off?")
      startTransition(async () => {
        await toggleLogCompletion(id, !currentlyCompleted, moveToToday)
      })
    } else {
      startTransition(async () => {
        await toggleLogCompletion(id, !currentlyCompleted, false)
      })
    }
  }

  if (!dayLogs || dayLogs.length === 0) {
    return (
      <div className="bg-white  rounded-xl shadow-sm border border-stone-100  p-6 text-center">
        <p className="text-stone-500 italic">No scheduled activities left for today.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {dayLogs.map((l, idx) => {
        const subjColor = l.subjects?.color_hex || l.activities?.color ||'#10B981'
        const subjIcon = l.subjects?.icon_name || l.activities?.icon ||'BookOpen'
        
        // Handle potentially missing students array gracefully
        const studentsInGroup = l.studentsInGroup || [l.students].filter(Boolean)
        const studentColors = studentsInGroup.map((s: any) => s?.display_color ||'#10B981')
        
        const isCompleted = !!l.completed_date
        
        let bgStyle = studentColors[0] ||'#10B981'
        if (studentColors.length > 1) {
          const step = 100 / studentColors.length
          const stops = studentColors.map((c: string, i: number) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`).join(',')
          bgStyle = `linear-gradient(to bottom, ${stops})`
        }
        if (isCompleted) {
          bgStyle ='repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)'
        }
        
        const formatTime = (time24?: string, duration?: number) => {
          if (!time24) return'';
          const [h, m] = time24.split(':');
          const d = new Date();
          d.setHours(parseInt(h), parseInt(m));
          const t = d.toLocaleTimeString([], { hour:'numeric', minute:'2-digit'});
          return `🕒 ${t} (${duration || 30}m) - `;
        }
        const timeStr = formatTime(l.time_of_day, l.duration_minutes)

        return (
          <div 
            key={`log-${l.id || idx}`} 
            className={`text-sm rounded-lg shadow-sm flex overflow-hidden group cursor-pointer hover:opacity-80 transition-opacity ${isPending ?'opacity-70 pointer-events-none':''}`}
            onClick={(e) => {
              e.stopPropagation()
              // If we are on dashboard, redirect to calendar edit
              const isDashboard = window.location.pathname ==='/dashboard'
              if (isDashboard) {
                router.push(`/calendar?view=day&date=${l.date}&editActivity=${l.id}`)
              } else {
                const params = new URLSearchParams(searchParams.toString())
                params.set('editActivity', l.id ||'mock-log-id')
                router.push(`/calendar?${params.toString()}`, { scroll: false })
              }
            }}
          >
            <div className="w-1.5 flex-shrink-0"style={{ background: bgStyle }} />
            <div 
              className="flex-1 px-4 py-3 flex items-center justify-between"
              style={{
                backgroundColor: isCompleted ? subjColor +'10': subjColor +'20',
                color: isCompleted ?'gray':'inherit',
              }}
            >
              <div className="flex items-center gap-3">
                <div onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => handleToggleCompletion(l.id, isCompleted, l.date)}
                    className="rounded border-stone-300 text-slate-600 focus:ring-slate-500 cursor-pointer w-5 h-5 flex-shrink-0"
                  />
                </div>
                <span className={`flex items-center gap-2 ${isCompleted ?'line-through opacity-70':''}`}>
                  <span style={{ color: subjColor }}>{renderIcon(subjIcon,"w-5 h-5")}</span>
                  <strong>{timeStr}{l.subjects?.name || l.activities?.name ||'Log'}:</strong> {l.notes || l.log_type}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {l.file_url && (
                  <a 
                    href={l.file_url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-slate-700  p-1 flex items-center"
                    title="View uploaded file"
                  >
                    <LucideIcons.Paperclip size={16} />
                  </a>
                )}
                <span className="text-stone-500 text-xs font-medium">{l.duration_minutes}m</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    const isDashboard = window.location.pathname ==='/dashboard'
                    if (isDashboard) {
                      router.push(`/calendar?view=day&date=${l.date}&editActivity=${l.id}`)
                    } else {
                      const params = new URLSearchParams(searchParams.toString())
                      params.set('editActivity', l.id ||'mock-log-id')
                      router.push(`/calendar?${params.toString()}`, { scroll: false })
                    }
                  }}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <LucideIcons.Edit3 size={16} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
