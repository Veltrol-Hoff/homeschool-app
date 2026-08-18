import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AddItemsClient from './AddItemsClient'
import AiStandardSuggestion from '@/components/AiStandardSuggestion'
import ScheduleCurriculumButton from '@/components/ScheduleCurriculumButton'
import DeleteItemButton from './DeleteItemButton'
import DeleteAllItemsButton from './DeleteAllItemsButton'

export default async function CurriculumItemsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { id } = await params

  // Fetch curriculum details
  const { data: curriculum } = await supabase
    .from('curricula')
    .select('*, subjects(name)')
    .eq('id', id)
    .single()

  if (!curriculum) return redirect('/curriculum')

  // Fetch items with any existing standard suggestions
  const { data: items } = await supabase
    .from('curriculum_items')
    .select(`
      *,
      curriculum_item_standards(
        confirmed,
        standards(id, code, short_description)
      )
    `)
    .eq('curriculum_id', id)
    .order('sequence_order', { ascending: true })

  const nextSequence = items && items.length > 0 
    ? Math.max(...items.map(i => i.sequence_order)) + 1 
    : 1
    
  const { data: allStudents } = await supabase
    .from('students')
    .select('id, name')
    .order('name')
  
  const assignedStudents = allStudents || []

  return (
    <div className="min-h-screen bg-transparent text-stone-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4">
          <Link href="/curriculum" className="text-sm text-slate-600 hover:underline">
            &larr; Back to Library
          </Link>
          <h1 className="text-2xl font-bold">Manage Items</h1>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{curriculum.title}</h2>
            <p className="text-stone-500 mt-1">
              {curriculum.subjects?.name} &bull; {curriculum.pacing_type}-paced &bull; {curriculum.delivery_mode}
            </p>
          </div>
          <ScheduleCurriculumButton curriculumId={curriculum.id} students={assignedStudents} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Curriculum Items ({items?.length || 0})</h3>
              <DeleteAllItemsButton curriculumId={curriculum.id} itemCount={items?.length || 0} />
            </div>
            
            {!items || items.length === 0 ? (
              <div className="text-center py-12 bg-white  rounded-xl shadow-sm border border-stone-100">
                <p className="text-stone-500">No items added yet. Use the form to add some!</p>
              </div>
            ) : (
              <div className="bg-white  rounded-xl shadow-sm border border-stone-100  overflow-hidden divide-y divide-stone-100">
                {items.map(item => {
                  const itemStd = item.curriculum_item_standards?.[0]
                  const suggestion = itemStd ? {
                    standard_id: itemStd.standards.id,
                    code: itemStd.standards.code,
                    description: itemStd.standards.short_description,
                    confirmed: itemStd.confirmed
                  } : null

                  return (
                    <div key={item.id} className="p-4 hover:bg-stone-50  transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700   flex items-center justify-center font-bold text-sm shrink-0">
                          {item.sequence_order}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.title}</h4>
                          <p className="text-xs text-stone-500  mt-0.5">
                            {item.item_type} &bull; {item.estimated_minutes} mins
                          </p>
                        </div>
                        {curriculum.subjects && (
                          <AiStandardSuggestion 
                            curriculumItemId={item.id} 
                            itemTitle={item.title} 
                            subjectName={curriculum.subjects.name}
                            existingSuggestion={suggestion} 
                          />
                        )}
                        <DeleteItemButton curriculumId={curriculum.id} itemId={item.id} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-1 order-1 lg:order-2">
            <h3 className="font-bold text-lg mb-4">Add Items</h3>
            <AddItemsClient curriculumId={curriculum.id} nextSequence={nextSequence} />
          </div>

        </div>

      </div>
    </div>
  )
}
