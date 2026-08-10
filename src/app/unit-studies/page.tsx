import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import Link from'next/link'
import { createUnitStudy } from'./actions'

export default async function UnitStudiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Fetch unit studies
  const { data: unitStudies } = await supabase
    .from('unit_studies')
    .select('*, subjects(name)')
    .order('created_at', { ascending: false })

  // Fetch templates
  const { data: templates } = await supabase
    .from('unit_study_templates')
    .select('*')
    .order('title')

  // Fetch subjects for form
  const { data: subjects } = await supabase.from('subjects').select('id, name')

  return (
    <div className="min-h-screen bg-transparent  text-stone-900  p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
          <Link href="/dashboard"className="text-sm text-slate-600 hover:underline">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Unit Studies</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Active Unit Studies</h2>
            {(!unitStudies || unitStudies.length === 0) ? (
              <div className="bg-white  rounded-xl p-8 text-center shadow-sm border border-stone-100">
                <p className="text-stone-500">No unit studies yet. Create one from a template or start fresh!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {unitStudies.map(study => (
                  <Link href={`/unit-studies/${study.id}`} key={study.id} className="bg-white  rounded-xl p-5 shadow-sm border border-stone-100  hover:border-slate-300 transition-colors block">
                    <h3 className="font-bold text-lg">{study.title}</h3>
                    {study.subjects && <p className="text-xs text-slate-600  font-medium uppercase tracking-wide mt-1">{study.subjects.name}</p>}
                    <p className="text-sm text-stone-600  mt-2 line-clamp-2">{study.topic_description}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="bg-white  rounded-xl shadow-sm border border-stone-100  p-6">
              <h2 className="font-bold text-lg mb-4">Create Unit Study</h2>
              
              <form action={createUnitStudy} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start from Template (Optional)</label>
                  <select name="template_id"className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2.5 border text-sm">
                    <option value="">-- Custom --</option>
                    {templates?.map(t => <option key={t.id} value={t.id}>{t.title} ({t.grade_range})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input type="text"name="title"required className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2.5 border"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject Link (Optional)</label>
                  <select name="subject_id"className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2.5 border">
                    <option value="">None</option>
                    {subjects?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Topic Description</label>
                  <textarea name="topic_description"rows={3} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2.5 border"/>
                </div>
                <button type="submit"className="w-full bg-slate-600 text-white py-2 rounded-md font-medium hover:bg-slate-700 transition-colors">
                  Create
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
