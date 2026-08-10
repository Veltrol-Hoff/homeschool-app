import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import Link from'next/link'
import WorkSampleReviewCard from'@/components/WorkSampleReviewCard'

export default async function ReviewQueuePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
  if (profile?.household_role ==='student') {
    return (
      <div className="p-8 text-center text-red-600">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p>Students cannot access the Review Queue.</p>
        <Link href="/dashboard"className="text-slate-600 hover:underline mt-4 inline-block">&larr; Back to Dashboard</Link>
      </div>
    )
  }

  // Fetch pending work samples
  const { data: pendingSamples } = await supabase
    .from('work_samples')
    .select('*, daily_logs(date, student_id, subjects(name))')
    .eq('status','draft')
    .order('created_at', { ascending: true })

  // (Future Phase: Fetch pending daily_logs, curriculum_item_standards, narrations here too)

  return (
    <div className="min-h-screen bg-transparent  text-stone-900  p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard"className="text-sm text-slate-600 hover:underline">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Review Queue</h1>
        </div>

        <p className="text-stone-600">
          Items needing your review before they are permanently added to a student's portfolio or progress record.
        </p>

        {(!pendingSamples || pendingSamples.length === 0) ? (
          <div className="bg-white  p-12 rounded-xl border border-stone-100  text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold mb-2">All caught up!</h2>
            <p className="text-stone-500">There are no work samples waiting for review right now.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {pendingSamples.map(sample => (
              <WorkSampleReviewCard key={sample.id} sample={sample} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
