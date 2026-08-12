'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns'
import DailyChecklist from '@/components/DailyChecklist'
import { bumpDay, toggleLogCompletion } from '@/app/calendar/actions'
import * as LucideIcons from 'lucide-react'

// Simple helper to render a lucide icon from string name
function renderIcon(iconName: string, className ="w-4 h-4") {
  const Icon = (LucideIcons as any)[iconName]
  if (!Icon) return <LucideIcons.BookOpen className={className} />
  return <Icon className={className} />
}

export default function CalendarView({ 
  view, 
  students, 
  selectedStudentIds, 
  logs, 
  trips, 
  dueItems,
  holidays
}: { 
  view: string, 
  students: any[], 
  selectedStudentIds: string[], 
  logs: any[], 
  trips: any[], 
  dueItems: any[],
  holidays?: any[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isPending, startTransition] = useTransition()
  const [bumpingDate, setBumpingDate] = useState<string | null>(null)
  
  // We no longer manage the modal locally. GlobalModalManager handles it.

  const handleBump = (dateStr: string) => {
    if (!students || students.length === 0) return

    if (!confirm(`Are you sure you want to bump all planned coursework for ALL students starting from ${dateStr} by one day?`)) return
    
    setBumpingDate(dateStr)
    startTransition(async () => {
      try {
        for (const s of students) {
          await bumpDay(s.id, dateStr)
        }
        alert("Bump completed successfully for all students.")
      } catch (err: any) {
        alert("Error: " + err.message)
      }
      setBumpingDate(null)
    })
  }

  function handleToggleCompletion(id: string, currentlyCompleted: boolean, logDate: string) {
    if (!currentlyCompleted && logDate !== format(new Date(), 'yyyy-MM-dd')) {
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

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate })

  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

  function getDayData(date: Date) {
    const dateStr = format(date,'yyyy-MM-dd')
    const dayLogsRaw = logs.filter(l => l.date === dateStr)
    const groupedLogs: any[] = []
    const groupMap = new Map()
    
    dayLogsRaw.forEach(log => {
      if (log.shared_activity_group_id) {
        if (!groupMap.has(log.shared_activity_group_id)) {
          groupMap.set(log.shared_activity_group_id, { ...log, studentsInGroup: [log.students] })
          groupedLogs.push(groupMap.get(log.shared_activity_group_id))
        } else {
          groupMap.get(log.shared_activity_group_id).studentsInGroup.push(log.students)
        }
      } else {
        groupedLogs.push({ ...log, studentsInGroup: [log.students] })
      }
    })

    const dayTrips = trips.filter(t => {
      if (!t.start_date) return false;
      
      const tripStartStr = t.start_date;
      const tripEndStr = t.end_date || t.start_date;
      
      return dateStr >= tripStartStr && dateStr <= tripEndStr;
    })
    
    const dayHolidays = holidays ? holidays.filter(h => h.date === dateStr) : []
    
    return { dayLogs: groupedLogs, dayTrips, dayHolidays }
  }

  function updateUrl(newSelectedIds: string[], newView: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', newView)
    if (newSelectedIds.length > 0) {
      params.set('student', newSelectedIds.join(','))
    } else {
      params.delete('student')
    }
    router.push(`/calendar?${params.toString()}`)
  }

  function toggleStudent(id: string) {
    let newIds = [...selectedStudentIds]
    if (newIds.includes(id)) {
      newIds = newIds.filter(sId => sId !== id)
    } else {
      newIds.push(id)
    }
    updateUrl(newIds, view)
  }

  function handleCellClick(date: Date) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('quickAdd','true')
    params.set('tab','Activity')
    params.set('date', format(date,'yyyy-MM-dd'))
    router.push(`/calendar?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="bg-white  rounded-xl shadow-sm border border-stone-100  overflow-hidden">
      
      {/* Calendar Header Controls */}
      <div className="p-4 border-b border-stone-100  flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* Multi-Student Filter Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {students.map(s => {
            const isSelected = selectedStudentIds.includes(s.id)
            const accentColor = s.display_color ||'#10B981'
            return (
              <button 
                key={s.id} 
                onClick={() => toggleStudent(s.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-1.5`}
                style={{
                  backgroundColor: isSelected ? accentColor +'20':'transparent',
                  borderColor: isSelected ? accentColor :'var(--border-color)',
                  color: isSelected ? accentColor :'inherit'
                }}
              >
                <span className="w-2 h-2 rounded-full"style={{ backgroundColor: accentColor }}></span>
                {s.name}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (view ==='month') setCurrentDate(subMonths(currentDate, 1))
              else if (view ==='week') setCurrentDate(subWeeks(currentDate, 1))
              else if (view ==='day') setCurrentDate(subDays(currentDate, 1))
            }}
            className="p-1 hover:bg-stone-100  rounded transition-colors"
          >
            <LucideIcons.ChevronLeft size={20} />
          </button>
          
          <h2 className="text-xl font-bold min-w-[200px] text-center">
            {view ==='day'? format(currentDate,'MMMM d, yyyy') : format(currentDate,'MMMM yyyy')}
          </h2>

          <button 
            onClick={() => {
              if (view ==='month') setCurrentDate(addMonths(currentDate, 1))
              else if (view ==='week') setCurrentDate(addWeeks(currentDate, 1))
              else if (view ==='day') setCurrentDate(addDays(currentDate, 1))
            }}
            className="p-1 hover:bg-stone-100  rounded transition-colors"
          >
            <LucideIcons.ChevronRight size={20} />
          </button>
        </div>

        <div className="flex bg-stone-100  p-1 rounded-lg">
          {['month','week','day'].map(v => (
            <button
              key={v}
              onClick={() => updateUrl(selectedStudentIds, v)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                view === v 
                  ?'bg-white  shadow text-stone-900'
                  :'text-stone-500 hover:text-stone-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <button 
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('quickAdd','true')
            params.set('tab','Activity')
            router.push(`/calendar?${params.toString()}`, { scroll: false })
          }}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <LucideIcons.Plus size={16} /> Add Activity
        </button>
      </div>

      {/* View Rendering */}
      <div className="p-4">
        {view ==='month'&& (
          <div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center text-xs font-bold text-stone-500 uppercase tracking-wider">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-stone-200  rounded-lg overflow-hidden border border-stone-200">
              {daysInMonth.map((day, i) => {
                const { dayLogs, dayTrips, dayHolidays } = getDayData(day)
                const isCurrentMonth = isSameMonth(day, monthStart)
                const isToday = isSameDay(day, new Date())

                return (
                  <div 
                    key={i} 
                    onClick={() => handleCellClick(day)}
                    className={`min-h-[120px] p-2 bg-white  cursor-pointer hover:bg-stone-50  transition-colors ${!isCurrentMonth ?'opacity-50 bg-stone-50':''}`}
                  >
                    <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ?'bg-slate-600 text-white':'text-stone-700'}`}>
                      {format(day,'d')}
                    </div>
                    
                    <div className="mt-1">
                      {/* DESKTOP VIEW */}
                      <div className="hidden sm:block space-y-1.5">
                      {dayHolidays.map((h: any, idx: number) => (
                        <div 
                          key={`holiday-${idx}`} 
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push('/settings/holidays')
                          }}
                          className="text-[10px] leading-tight px-1.5 py-0.5 rounded overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:opacity-80 text-white shadow-sm"
                          style={{ backgroundColor: '#EF4444' }}
                        >
                          🎉 {h.name}
                        </div>
                      ))}
                      {dayTrips.map((t, idx) => (
                        <div 
                          key={`trip-${idx}`} 
                          onClick={(e) => {
                            e.stopPropagation()
                            const params = new URLSearchParams(searchParams.toString())
                            params.set('viewTrip', t.id ||'mock-id')
                            router.push(`/calendar?${params.toString()}`, { scroll: false })
                          }}
                          className="text-[10px] leading-tight px-1.5 py-0.5 rounded overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:opacity-80 text-white shadow-sm"
                          style={{ backgroundColor: t.display_color ||'#F59E0B'}}
                        >
                          ✈️ {t.title}
                        </div>
                      ))}
                      {dayLogs.map((l, idx) => {
                        const subjColor = l.subjects?.color_hex || l.activities?.color ||'#10B981'
                        const subjIcon = l.subjects?.icon_name || l.activities?.icon ||'BookOpen'
                        const isCompleted = l.log_type ==='Completed'
                        const studentColors = l.studentsInGroup.map((s: any) => s?.display_color ||'#10B981')
                        
                        let bgStyle = studentColors[0]
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
                          return `🕒 ${t} (${duration || 30}m) `;
                        }
                        const timeStr = formatTime(l.time_of_day, l.duration_minutes)

                        return (
                          <div 
                            key={`log-${l.id || idx}`} 
                            className="text-xs rounded shadow-sm flex overflow-hidden transition-opacity border border-stone-200/50  group cursor-pointer hover:opacity-80"
                            onClick={(e) => {
                              e.stopPropagation()
                              const params = new URLSearchParams(searchParams.toString())
                              params.set('editActivity', l.id ||'mock-log-id')
                              router.push(`/calendar?${params.toString()}`, { scroll: false })
                            }}
                          >
                            <div className="w-1.5 flex-shrink-0"style={{ background: bgStyle }} />
                            <div 
                              className="flex-1 px-1.5 py-1 flex items-center gap-1.5"
                              style={{
                                backgroundColor: isCompleted ? subjColor +'10': subjColor +'20',
                                color: isCompleted ?'gray':'inherit',
                              }}
                            >
                              <div onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="checkbox"
                                  checked={isCompleted}
                                  onChange={() => handleToggleCompletion(l.id, isCompleted, l.date)}
                                  className="rounded-sm border-stone-300 text-slate-600 focus:ring-slate-500 cursor-pointer w-3 h-3 flex-shrink-0"
                                />
                              </div>
                              <div className={`flex-1 flex items-center overflow-hidden whitespace-nowrap text-ellipsis ${isCompleted ?'line-through opacity-70':''}`}>
                                <span style={{ color: subjColor }} className="mr-1 inline-block flex-shrink-0">{renderIcon(subjIcon,"w-3 h-3")}</span>
                                <span className="font-semibold flex items-center gap-1">
                                  {l.is_starred && <LucideIcons.Star size={12} className="fill-amber-500 text-amber-500 flex-shrink-0" />}
                                  {timeStr}{l.subjects?.name || l.activities?.name ||'Log'}
                                </span>
                                {l.notes && <span className="opacity-80 ml-1 truncate"> - {l.notes}</span>}
                                {studentColors.length > 1 && (
                                  <span className="ml-2 flex items-center gap-0.5 flex-shrink-0">
                                    {studentColors.map((c: string, idx: number) => (
                                      <span key={idx} className="w-1.5 h-1.5 rounded-full"style={{ backgroundColor: c }}></span>
                                    ))}
                                  </span>
                                )}
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const params = new URLSearchParams(searchParams.toString())
                                  params.set('editActivity', l.id ||'mock-log-id')
                                  router.push(`/calendar?${params.toString()}`, { scroll: false })
                                }}
                                className="text-stone-400 hover:text-stone-700  p-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              >
                                <LucideIcons.Edit2 size={10} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      </div>
                      
                      {/* MOBILE VIEW (Dots) */}
                      <div className="sm:hidden flex flex-wrap gap-1 mt-1 pb-2">
                        {dayHolidays.map((h: any, idx: number) => (
                          <div key={`mob-h-${idx}`} className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: '#EF4444' }} title={h.name} />
                        ))}
                        {dayTrips.map((t, idx) => (
                          <div key={`mob-t-${idx}`} className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: t.display_color || '#F59E0B' }} title={t.title} />
                        ))}
                        {dayLogs.map((l, idx) => {
                          const isCompleted = l.log_type === 'Completed'
                          const studentColors = l.studentsInGroup.map((s: any) => s?.display_color || '#10B981')
                          let bgStyle = studentColors[0]
                          if (studentColors.length > 1) {
                            const step = 100 / studentColors.length
                            const stops = studentColors.map((c: string, i: number) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`).join(',')
                            bgStyle = `linear-gradient(to bottom, ${stops})`
                          }
                          return (
                            <div 
                              key={`mob-l-${idx}`} 
                              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-sm ${isCompleted ? 'opacity-30' : 'opacity-100'} ${l.is_starred ? 'ring-2 ring-amber-400' : ''}`} 
                              style={{ background: bgStyle }} 
                              title={l.subjects?.name || l.activities?.name} 
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {view ==='week'&& (
          <div className="space-y-4">
            {daysInWeek.map((day, i) => {
              const { dayLogs, dayTrips, dayHolidays } = getDayData(day)
              const isToday = isSameDay(day, new Date())

              return (
                <div key={i} className={`flex flex-col sm:flex-row gap-4 p-4 rounded-lg border ${isToday ?'border-slate-200 bg-slate-50/50':'border-stone-100  bg-stone-50'}`}>
                  <div className="sm:w-32 flex-shrink-0 cursor-pointer"onClick={() => handleCellClick(day)}>
                    <p className={`font-bold hover:underline ${isToday ?'text-slate-600':''}`}>{format(day,'EEEE')}</p>
                    <p className="text-sm text-stone-500 mb-2">{format(day,'MMM d')}</p>
                    {dayLogs.some(l => l.log_type ==='Planned' && l.subject_id) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleBump(format(day,'yyyy-MM-dd')) }}
                        disabled={isPending && bumpingDate === format(day,'yyyy-MM-dd')}
                        className="text-xs font-medium px-2 py-1 bg-stone-200 hover:bg-stone-300   text-stone-800  rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {isPending && bumpingDate === format(day,'yyyy-MM-dd') ?'Bumping...':'Bump ➡️'}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    {dayTrips.length === 0 && dayLogs.length === 0 && dayHolidays.length === 0 && (
                      <div 
                        onClick={() => handleCellClick(day)}
                        className="text-sm text-stone-400 italic p-4 border border-dashed border-stone-200  rounded-lg text-center cursor-pointer hover:bg-stone-100  transition-colors"
                      >
                        + Schedule Activity
                      </div>
                    )}
                    {dayHolidays.map((h: any, idx: number) => (
                      <div 
                        key={`holiday-${idx}`} 
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push('/settings/holidays')
                        }}
                        className="text-sm px-3 py-2 bg-red-100 text-red-800 rounded-md shadow-sm border border-red-200 cursor-pointer hover:opacity-80"
                      >
                        <strong>🎉 Holiday:</strong> {h.name}
                      </div>
                    ))}
                    {dayTrips.map((t, idx) => (
                      <div 
                        key={`trip-${idx}`} 
                        onClick={(e) => {
                          e.stopPropagation()
                          const params = new URLSearchParams(searchParams.toString())
                          params.set('viewTrip', t.id ||'mock-id')
                          router.push(`/calendar?${params.toString()}`, { scroll: false })
                        }}
                        className="text-sm px-3 py-2 rounded-md shadow-sm border cursor-pointer hover:opacity-80 text-white"
                        style={{ backgroundColor: t.display_color || '#F59E0B', borderColor: t.display_color || '#F59E0B' }}
                      >
                        <strong>✈️ Field Trip / Vacation:</strong> {t.title} {t.location && `- ${t.location}`}
                        {t.subjects?.name && <span className="ml-1 opacity-90">({t.subjects.name})</span>}
                      </div>
                    ))}
                    {dayLogs.map((l, idx) => {
                      const subjColor = l.subjects?.color_hex || l.activities?.color ||'#10B981'
                      const subjIcon = l.subjects?.icon_name || l.activities?.icon ||'BookOpen'
                      const isCompleted = l.log_type ==='Completed'
                      const studentColors = l.studentsInGroup.map((s: any) => s?.display_color ||'#10B981')
                      
                      let bgStyle = studentColors[0]
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
                          className="text-sm rounded-md shadow-sm flex overflow-hidden group cursor-pointer hover:opacity-80"
                          onClick={(e) => {
                            e.stopPropagation()
                            const params = new URLSearchParams(searchParams.toString())
                            params.set('editActivity', l.id ||'mock-log-id')
                            router.push(`/calendar?${params.toString()}`, { scroll: false })
                          }}
                        >
                          <div className="w-1.5 flex-shrink-0"style={{ background: bgStyle }} />
                          <div 
                            className="flex-1 px-3 py-2 flex items-center justify-between"
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
                                  className="rounded border-stone-300 text-slate-600 focus:ring-slate-500 cursor-pointer w-4 h-4 flex-shrink-0"
                                />
                              </div>
                              <span className={`flex items-center gap-2 ${isCompleted ?'line-through opacity-70':''}`}>
                                <span style={{ color: subjColor }}>{renderIcon(subjIcon,"w-4 h-4")}</span>
                                <strong className="flex items-center gap-1">
                                  {l.is_starred && <LucideIcons.Star size={14} className="fill-amber-500 text-amber-500 flex-shrink-0" />}
                                  {timeStr}{l.subjects?.name || l.activities?.name ||'Log'}:
                                </strong> {l.notes || l.log_type}
                                {studentColors.length > 1 && (
                                  <span className="ml-1 flex items-center gap-1 flex-shrink-0">
                                    {studentColors.map((c: string, idx: number) => (
                                      <span key={idx} className="w-2 h-2 rounded-full"style={{ backgroundColor: c }}></span>
                                    ))}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-stone-500 text-xs">{l.duration_minutes}m</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const params = new URLSearchParams(searchParams.toString())
                                  params.set('editActivity', l.id ||'mock-log-id')
                                  router.push(`/calendar?${params.toString()}`, { scroll: false })
                                }}
                                className="text-stone-400 hover:text-stone-700  p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <LucideIcons.Edit2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {view ==='day'&& (() => {
          const { dayLogs, dayTrips, dayHolidays } = getDayData(currentDate)
          return (
            <div className="max-w-2xl mx-auto py-6 space-y-8">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl text-stone-900">
                    {isSameDay(currentDate, new Date()) ?"Today's Plan": `${format(currentDate,'EEEE')} Plan`}
                  </h3>
                </div>
                <DailyChecklist dayLogs={dayLogs.filter(l => l.log_type ==='Planned')} />
              </div>

              <div>
                <h3 className="font-bold text-lg text-stone-900  mb-4 border-b pb-2">Scheduled Activities & Logs</h3>
                {dayTrips.length === 0 && dayLogs.length === 0 && dayHolidays.length === 0 && (
                  <p className="text-sm text-stone-400 italic">No scheduled activities or trips for this day.</p>
                )}
                <div className="space-y-2 mb-4">
                  {dayHolidays.map((h: any, idx: number) => (
                    <div 
                      key={`holiday-${idx}`} 
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push('/settings/holidays')
                      }}
                      className="text-sm px-4 py-3 bg-red-100 text-red-800 rounded-lg shadow-sm border border-red-200 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <strong>🎉 Holiday:</strong> {h.name}
                    </div>
                  ))}
                  {dayTrips.map((t, idx) => (
                    <div 
                      key={`trip-${idx}`} 
                      onClick={(e) => {
                        e.stopPropagation()
                        const params = new URLSearchParams(searchParams.toString())
                        params.set('viewTrip', t.id ||'mock-id')
                        router.push(`/calendar?${params.toString()}`, { scroll: false })
                      }}
                      className="p-3 rounded-xl shadow-sm border cursor-pointer hover:opacity-80 flex items-center justify-between text-white"
                      style={{ backgroundColor: t.display_color || '#F59E0B', borderColor: t.display_color || '#F59E0B' }}
                    >
                      <div className="flex flex-col">
                        <strong>✈️ Field Trip / Vacation: {t.title} {t.subjects?.name && <span className="font-normal opacity-90">({t.subjects.name})</span>}</strong>
                        {t.location && <span className="text-sm opacity-80">{t.location}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <DailyChecklist dayLogs={dayLogs.filter(l => l.log_type !=='Planned')} />
              </div>
            </div>
          )
        })()}
      </div>

      {/* Local modal removed in favor of GlobalModalManager in layout.tsx */}
    </div>
  )
}
