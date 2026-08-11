import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import WorkSampleReviewCard from '@/components/WorkSampleReviewCard'
import DailyLogReviewCard from '@/components/DailyLogReviewCard'
import NarrationReviewCard from '@/components/NarrationReviewCard'
import StandardReviewCard from '@/components/StandardReviewCard'

export default async function ReviewQueuePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
  if (profile?.household_role === 'student') {
    return (
      <div className="p-8 text-center text-red-600">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p>Students cannot access the Review Queue.</p>
        <Link href="/dashboard" className="text-slate-600 hover:underline mt-4 inline-block">&larr; Back to Dashboard</Link>
      </div>
    )
  }

  // Fetch pending work samples
  const { data: pendingSamples } = await supabase
    .from('work_samples')
    .select('*, daily_logs(date, student_id, subjects(name), curriculum_items(curricula(pacing_type)))')
    .eq('status', 'draft')

  // Fetch pending daily logs
  const { data: pendingLogs } = await supabase
    .from('daily_logs')
    .select('*, students(name), subjects(name)')
    .eq('pending_parent_approval', true)

  // Fetch pending narrations
  const { data: pendingNarrations } = await supabase
    .from('narrations')
    .select('*, students(name)')
    .eq('tag_confirmed', false)

  // Fetch pending standard links
  const { data: pendingStandards } = await supabase
    .from('curriculum_item_standards')
    .select('*, curriculum_items(title), standards(code, short_description, framework, subject, grade_level)')
    .eq('confirmed', false)

  // Combine and sort
  const allItems = [
    ...(pendingSamples || []).map(s => ({ ...s, queue_type: 'work_sample' })),
    ...(pendingLogs || []).map(l => ({ ...l, queue_type: 'daily_log' })),
    ...(pendingNarrations || []).map(n => ({ ...n, queue_type: 'narration' })),
    ...(pendingStandards || []).map(st => ({ ...st, queue_type: 'standard' }))
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return (
    <div className="min-h-screen bg-transparent text-stone-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-slate-600 hover:underline">
              &larr; Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Review Queue</h1>
          </div>
          {allItems.length > 0 && (
            <span className="bg-slate-800 text-white text-sm font-bold px-3 py-1 rounded-full">
              {allItems.length} pending
            </span>
          )}
        </div>

        <p className="text-stone-600">
          Items needing your review before they are permanently added to a student's portfolio or progress record.
        </p>

        {allItems.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-stone-100 text-center shadow-sm">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold mb-2">All caught up!</h2>
            <p className="text-stone-500">There are no items waiting for review right now.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {allItems.map(item => {
              if (item.queue_type === 'work_sample') {
                return <WorkSampleReviewCard key={`ws-${item.id}`} sample={item} />
              } else if (item.queue_type === 'daily_log') {
                return <DailyLogReviewCard key={`dl-${item.id}`} log={item} />
              } else if (item.queue_type === 'narration') {
                return <NarrationReviewCard key={`na-${item.id}`} narration={item} />
              } else if (item.queue_type === 'standard') {
                return <StandardReviewCard key={`st-${item.curriculum_item_id}-${item.standard_id}`} suggestion={item} />
              }
              return null
            })}
          </div>
        )}

      </div>
    </div>
  )
}
