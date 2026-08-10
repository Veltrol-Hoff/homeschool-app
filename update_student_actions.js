const fs = require('fs');

const filePath = 'src/app/settings/students/actions.ts';
let content = fs.readFileSync(filePath, 'utf8');

const old_create = `export async function createAcademicYear(studentId: string, formData: FormData) {
  const supabase = await createClient()
  const year_label = formData.get('year_label') as string
  const grade_level = formData.get('grade_level') as string
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string

  const { error } = await supabase.from('academic_years').insert([{
    student_id: studentId,
    year_label,
    grade_level,
    start_date,
    end_date
  }])

  if (error) throw new Error(error.message)
    
  revalidatePath('/settings/students')
  revalidatePath(\`/student/\${studentId}\`)
  return { success: true }
}`;

const new_create = `export async function createAcademicYear(studentId: string, formData: FormData) {
  const supabase = await createClient()
  const academic_year_id = formData.get('academic_year_id') as string
  const grade_level = formData.get('grade_level') as string

  const { error } = await supabase.from('student_academic_years').insert([{
    student_id: studentId,
    academic_year_id,
    grade_level
  }])

  if (error) throw new Error(error.message)
    
  revalidatePath('/settings/students')
  revalidatePath(\`/student/\${studentId}\`)
  return { success: true }
}`;

const old_update = `export async function updateAcademicYear(yearId: string, studentId: string, formData: FormData) {
  const supabase = await createClient()
  const year_label = formData.get('year_label') as string
  const grade_level = formData.get('grade_level') as string
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string

  const { error } = await supabase.from('academic_years').update({
    year_label,
    grade_level,
    start_date,
    end_date
  }).eq('id', yearId)

  if (error) throw new Error(error.message)
    
  revalidatePath('/settings/students')
  revalidatePath(\`/student/\${studentId}\`)
  return { success: true }
}`;

const new_update = `export async function updateAcademicYear(mappingId: string, studentId: string, formData: FormData) {
  const supabase = await createClient()
  const academic_year_id = formData.get('academic_year_id') as string
  const grade_level = formData.get('grade_level') as string

  const { error } = await supabase.from('student_academic_years').update({
    academic_year_id,
    grade_level
  }).eq('id', mappingId)

  if (error) throw new Error(error.message)
    
  revalidatePath('/settings/students')
  revalidatePath(\`/student/\${studentId}\`)
  return { success: true }
}`;

const old_delete = `export async function deleteAcademicYear(yearId: string, studentId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('academic_years').delete().eq('id', yearId)
  if (error) throw new Error(error.message)
    
  revalidatePath('/settings/students')
  revalidatePath(\`/student/\${studentId}\`)
  return { success: true }
}`;

const new_delete = `export async function deleteAcademicYear(mappingId: string, studentId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('student_academic_years').delete().eq('id', mappingId)
  if (error) throw new Error(error.message)
    
  revalidatePath('/settings/students')
  revalidatePath(\`/student/\${studentId}\`)
  return { success: true }
}`;

content = content.replace(old_create, new_create);
content = content.replace(old_update, new_update);
content = content.replace(old_delete, new_delete);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated student actions.ts');
