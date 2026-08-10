const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function seed() {
  // 1. Get a student
  let { data: students } = await supabase.from('students').select('*').limit(1)
  if (!students || students.length === 0) {
    console.log('No students found. Creating one...')
    const { data: newStudent } = await supabase.from('students').insert({
      name: 'Alice Learner',
      birth_date: '2010-05-15',
      grade_level: '10th Grade'
    }).select('*').single()
    students = [newStudent]
  }
  const student = students[0]

  // 2. Get subjects
  let { data: subjects } = await supabase.from('subjects').select('*').limit(4)
  if (!subjects || subjects.length < 4) {
    console.log('Not enough subjects found. Creating some...')
    await supabase.from('subjects').insert([
      { name: 'Algebra I', color: '#3B82F6', icon: 'Calculator' },
      { name: 'Biology', color: '#10B981', icon: 'Microscope' },
      { name: 'World History', color: '#F59E0B', icon: 'Globe' },
      { name: 'English Lit', color: '#8B5CF6', icon: 'BookOpen' }
    ])
    const res = await supabase.from('subjects').select('*').limit(4)
    subjects = res.data
  }

  // 3. Ensure we have two academic years for this student
  // Year 1 (Past)
  let { data: pastYear } = await supabase.from('academic_years').insert({
    student_id: student.id,
    year_label: '2023-2024',
    grade_level: '9th Grade',
    start_date: '2023-09-01',
    end_date: '2024-06-01'
  }).select('*').single()
  
  if (!pastYear) {
    const { data: existingPast } = await supabase.from('academic_years').select('*').eq('student_id', student.id).eq('year_label', '2023-2024').single()
    pastYear = existingPast
  }

  // Year 2 (Current)
  let { data: currentYear } = await supabase.from('academic_years').insert({
    student_id: student.id,
    year_label: '2024-2025',
    grade_level: '10th Grade',
    start_date: '2024-09-01',
    end_date: '2025-06-01'
  }).select('*').single()

  if (!currentYear) {
    const { data: existingCurrent } = await supabase.from('academic_years').select('*').eq('student_id', student.id).eq('year_label', '2024-2025').single()
    currentYear = existingCurrent
  }

  // 4. Insert Transcripts
  // 3 Confirmed for Past Year
  await supabase.from('transcripts').insert([
    {
      student_id: student.id,
      academic_year_id: pastYear.id,
      subject_id: subjects[0].id,
      credit_earned: 1.0,
      grade_mark: 'A',
      confirmed_date: new Date().toISOString()
    },
    {
      student_id: student.id,
      academic_year_id: pastYear.id,
      subject_id: subjects[1].id,
      credit_earned: 1.0,
      grade_mark: 'B',
      confirmed_date: new Date().toISOString()
    },
    {
      student_id: student.id,
      academic_year_id: pastYear.id,
      subject_id: subjects[2].id,
      credit_earned: 0.5,
      grade_mark: 'A',
      confirmed_date: new Date().toISOString()
    }
  ])

  // 1 In-Progress for Current Year
  await supabase.from('transcripts').insert([
    {
      student_id: student.id,
      academic_year_id: currentYear.id,
      subject_id: subjects[3].id,
      credit_earned: 1.0,
      grade_mark: 'IP', // Handled by our UI
      confirmed_date: null
    }
  ])

  console.log('Seeded transcript records successfully for student:', student.id)
}

seed()
