import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import Link from'next/link'
import { addObjective } from'../actions'

export default async function UnitStudyDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: study } = await supabase
    .from('unit_studies')
    .select('*, subjects(name)')
    .eq('id', params.id)
    .single()

  if (!study) return redirect('/unit-studies')

  const { data: objectives } = await supabase
    .from('unit_study_objectives')
    .select('*, students(name), standards(code)')
    .eq('unit_study_id', params.id)

  const { data: students } = await supabase.from('students').select('id, name')

  return (
    <div className="min-h-screen bg-transparent  text-stone-900  p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4">
          <Link href="/unit-studies"className="text-sm text-slate-600 hover:underline">
            &larr; Back to Unit Studies
          </Link>
        </div>

        <div className="bg-white  p-6 rounded-xl shadow-sm border border-stone-100">
          <h1 className="text-2xl font-bold mb-2">{study.title}</h1>
          {study.subjects && <p className="text-sm text-slate-600  font-medium">{study.subjects.name}</p>}
          <p className="mt-4 text-stone-700">{study.topic_description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div>
            <h2 className="text-xl font-bold mb-4">Differentiated Objectives</h2>
            {!objectives || objectives.length === 0 ? (
              <p className="text-stone-500 italic">No objectives added yet.</p>
            ) : (
              <div className="space-y-3">
                {objectives.map(obj => (
                  <div key={obj.id} className="bg-white  p-4 rounded-lg shadow-sm border border-stone-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm">{obj.students?.name}</span>
                      {obj.standards && <span className="text-xs bg-purple-100 text-purple-700 px-2 rounded-full">{obj.standards.code}</span>}
                    </div>
                    <p className="text-stone-600  text-sm">{obj.objective_description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="bg-white  p-6 rounded-xl shadow-sm border border-stone-100">
              <h3 className="font-bold text-lg mb-4">Add Objective</h3>
              <form action={async (formData) => {"use server"; await addObjective(study.id, formData); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Student</label>
                  <select name="student_id"required className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2.5 border">
                    {students?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Objective Description</label>
                  <textarea name="objective_description"required rows={3} placeholder="What should this student learn?"className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2.5 border"/>
                </div>
                <button type="submit"className="w-full bg-slate-600 text-white py-2 rounded-md font-medium hover:bg-slate-700 transition-colors">
                  Save Objective
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
