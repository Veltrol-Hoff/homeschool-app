import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import Link from'next/link'
import AddCurriculumButton from'@/components/AddCurriculumButton'
import EditCurriculumButton from'@/components/EditCurriculumButton'

export default async function CurriculumLibraryPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const sp = await searchParams
  const activeTab = sp.tab ||'curricula'

  // Fetch curricula
  const { data: curricula } = await supabase
    .from('curricula')
    .select('*, subjects(name), student_curricula(student_id)')
    .order('created_at', { ascending: false })

  // Fetch items to count them per curriculum (simplest way for MVP)
  const { data: items } = await supabase
    .from('curriculum_items')
    .select('curriculum_id, id')

  // Fetch subjects for the add form
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .order('name')

  // Fetch students for the add form
  const { data: students } = await supabase
    .from('students')
    .select('id, name')
    .order('name')

  // Fetch standards if needed
  let standards: any[] = []
  if (activeTab ==='standards') {
    const { data: stds } = await supabase.from('standards').select('*').order('grade_level').order('subject')
    standards = stds || []
  }

  return (
    <div className="min-h-screen bg-transparent  text-stone-900  p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard"className="text-sm text-slate-600 hover:underline">
              &larr; Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Curriculum & Standards Library</h1>
          </div>
        </div>

        <div className="bg-white  rounded-xl shadow-sm border border-stone-100  overflow-hidden">
          <div className="flex border-b border-stone-200">
            <Link 
              href="/curriculum?tab=curricula"
              className={`px-6 py-3 font-medium ${activeTab ==='curricula'?'border-b-2 border-slate-600 text-slate-600  bg-stone-50':'text-stone-500 hover:text-stone-700'}`}
            >
              My curricula
            </Link>
            <Link 
              href="/curriculum?tab=standards"
              className={`px-6 py-3 font-medium ${activeTab ==='standards'?'border-b-2 border-slate-600 text-slate-600  bg-stone-50':'text-stone-500 hover:text-stone-700'}`}
            >
              Standards reference
            </Link>
          </div>
          
          <div className="p-6 space-y-4">
            {activeTab ==='standards'? (
              <div className="space-y-6">
                {standards.length === 0 ? (
                  <div className="text-center py-12 text-stone-500">No standards found. Please run the seed script.</div>
                ) : (
                  <div className="grid gap-4">
                    {standards.map(s => (
                      <div key={s.id} className="border p-4 rounded-lg bg-stone-50">
                        <div className="flex gap-2 items-center mb-1">
                          <span className="font-bold text-slate-600">{s.code}</span>
                          <span className="text-sm px-2 py-0.5 bg-stone-200  rounded-full">{s.subject} - Grade {s.grade_level}</span>
                        </div>
                        <p className="text-sm">{s.short_description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {!curricula || curricula.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-stone-500  mb-4">No curricula in your library yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {curricula.map(c => {
                      const itemCount = items?.filter(i => i.curriculum_id === c.id).length || 0
                      
                      return (
                        <div key={c.id} className="border border-stone-200  rounded-lg p-4 flex justify-between items-center hover:bg-stone-50  transition-colors">
                          <div>
                            <h3 className="font-bold text-lg">{c.title}</h3>
                            <p className="text-sm text-stone-600  flex gap-2 mt-1">
                              <span>{c.subjects?.name}</span>
                              <span>&bull;</span>
                              <span>{c.pacing_type}-paced</span>
                              <span>&bull;</span>
                              <span>{itemCount} items</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <EditCurriculumButton 
                              curriculum={c}
                              subjects={subjects || []}
                              students={students || []}
                            />
                            <Link 
                              href={`/curriculum/${c.id}/items`}
                              className="px-4 py-2 bg-stone-100 text-stone-800   rounded-md font-medium text-sm hover:bg-stone-200  transition-colors"
                            >
                              Manage Items &gt;
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
    
                <div className="pt-4 border-t border-stone-100  flex justify-center">
                  <AddCurriculumButton subjects={subjects || []} students={students || []} />
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
