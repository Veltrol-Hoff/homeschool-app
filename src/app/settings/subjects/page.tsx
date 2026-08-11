import { createClient } from'@/utils/supabase/server'
import { redirect } from'next/navigation'
import Link from'next/link'
import SubjectForm from'./SubjectForm'
import { Book, Activity, Trees, Music, Palette, Code, GraduationCap, Microscope, Calculator, Users } from'lucide-react'

// Simple map for rendering icons dynamically
export const IconMap: Record<string, any> = {
  Book,
  Activity,
  Trees,
  Music,
  Palette,
  Code,
  GraduationCap,
  Microscope,
  Calculator,
  Users
}

export default async function SubjectsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Check if owner/co-owner
  const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
  if (!profile || (profile.household_role !=='owner'&& profile.household_role !=='co-owner')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-red-500 font-bold">Unauthorized. Only Parents can manage subjects.</p>
      </div>
    )
  }

  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-transparent  text-stone-900  p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard"className="text-sm text-slate-600 hover:underline">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Manage Subjects</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-bold">Current Subjects</h2>
            
            {subjects && subjects.length > 0 ? (
              <div className="bg-white  rounded-xl shadow-sm border border-stone-100  overflow-hidden">
                <ul className="divide-y divide-stone-100">
                  {subjects.map(subject => {
                    const IconComponent = subject.icon_name && IconMap[subject.icon_name] ? IconMap[subject.icon_name] : Book
                    return (
                      <li key={subject.id} className="p-4 flex items-center justify-between hover:bg-stone-50  transition-colors">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: subject.color_hex ||'#10B981'}}
                          >
                            <IconComponent size={20} />
                          </div>
                          <div>
                            <p className="font-bold">{subject.name}</p>
                            <div className="flex gap-2 items-center mt-1">
                              <p className="text-xs text-stone-500">
                                {subject.is_state_required ? 'State Required' : 'Elective'}
                              </p>
                              {subject.is_family_subject && (
                                <span className="bg-purple-100 text-purple-700 text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded">
                                  Family Subject
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <SubjectForm mode="edit"subject={subject} />
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-stone-500">No subjects found.</p>
            )}
          </div>

          <div>
            <div className="bg-white  rounded-xl shadow-sm border border-stone-100  p-6 sticky top-8">
              <h2 className="text-xl font-bold mb-4">Add New Subject</h2>
              <SubjectForm mode="create"/>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
