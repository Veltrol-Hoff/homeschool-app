'use client'

import { useState } from'react'
import DeleteStudentButton from'./DeleteStudentButton'
import { createClient } from'@/utils/supabase/client'
import { useRouter } from'next/navigation'

export default function StudentManager({ students }: { students: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form fields
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  
  const supabase = createClient()
  const router = useRouter()

  function openNewModal() {
    setEditingStudent(null)
    setName('')
    setBirthDate('')
    setGradeLevel('1')
    setAvatarUrl('')
    setIsModalOpen(true)
  }

  function openEditModal(student: any) {
    setEditingStudent(student)
    setName(student.name)
    setBirthDate(student.birth_date)
    setGradeLevel(student.academic_years?.[0]?.grade_level ||'1')
    setAvatarUrl(student.avatar_url ||'')
    setIsModalOpen(true)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    
    // Upload to'media'bucket
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file)
      
    if (uploadError) {
      alert("Error uploading photo")
      return
    }
    
    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath)
    setAvatarUrl(publicUrl)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingStudent) {
        // Update student
        await supabase
          .from('students')
          .update({ name, birth_date: birthDate, avatar_url: avatarUrl })
          .eq('id', editingStudent.id)
          
        if (editingStudent.student_academic_years?.[0]) {
          await supabase
            .from('student_academic_years')
            .update({ grade_level: gradeLevel })
            .eq('id', editingStudent.student_academic_years[0].id)
        }
      } else {
        // Create new student
        const { data: newStudent, error } = await supabase
          .from('students')
          .insert([{ name, birth_date: birthDate, avatar_url: avatarUrl }])
          .select()
          .single()
          
        if (newStudent && !error) {
          // Create initial academic year
          await supabase
            .from('academic_years')
            .insert([{
              student_id: newStudent.id,
              grade_level: gradeLevel,
              start_date: new Date().toISOString().split('T')[0],
              end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
            }])
        }
      }
      
      setIsModalOpen(false)
      router.refresh()
    } catch (err) {
      alert("Failed to save student")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white  rounded-xl shadow-sm border border-stone-100  overflow-hidden mt-8">
      <div className="p-4 border-b border-stone-100  flex justify-between items-center">
        <h2 className="font-bold text-lg">Students</h2>
        <button 
          onClick={openNewModal}
          className="text-sm bg-slate-600 text-white px-3 py-1.5 rounded hover:bg-slate-700"
        >
          + Add Student
        </button>
      </div>
      
      {(!students || students.length === 0) ? (
        <div className="p-4 text-stone-500 text-sm">No students added yet.</div>
      ) : (
        <ul className="divide-y divide-stone-100">
          {students.map(student => (
            <li key={student.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4 cursor-pointer"onClick={() => openEditModal(student)}>
                {student.avatar_url ? (
                  <img src={student.avatar_url} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-stone-200"/>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-bold">
                    {student.name[0]}
                  </div>
                )}
                <div>
                  <span className="font-medium hover:text-slate-600">{student.name}</span>
                  <p className="text-xs text-stone-500">Grade {student.academic_years?.[0]?.grade_level ||'Unknown'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <DeleteStudentButton studentId={student.id} studentName={student.name} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white  p-6 rounded-lg shadow-xl w-full max-w-md border border-stone-100">
            <h2 className="text-xl font-bold mb-4">{editingStudent ?'Edit Student':'Add Student'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center mb-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview"className="w-20 h-20 rounded-full object-cover border"/>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-bold mb-2">Photo</div>
                )}
                <label className="text-sm text-slate-600 hover:underline cursor-pointer mt-2">
                  Upload Photo
                  <input type="file"className="hidden"accept="image/*"onChange={handlePhotoUpload} />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input 
                  type="text"
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Birth Date</label>
                <input 
                  type="date"
                  value={birthDate} 
                  onChange={e => setBirthDate(e.target.value)} 
                  required
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Grade Level</label>
                <select 
                  value={gradeLevel} 
                  onChange={e => setGradeLevel(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="K">Kindergarten</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                    <option key={n} value={n.toString()}>Grade {n}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button"onClick={() => setIsModalOpen(false)} className="flex-1 p-2 bg-stone-100 rounded">Cancel</button>
                <button type="submit"disabled={isSubmitting} className="flex-1 p-2 bg-slate-600 text-white rounded">
                  {isSubmitting ?'Saving...':'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
