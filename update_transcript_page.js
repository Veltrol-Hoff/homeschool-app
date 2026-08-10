const fs = require('fs');

const filePath = 'src/app/transcript/[student_id]/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldFetch = `  // 2. Fetch Academic Years for the student
  const { data: academicYears } = await supabase
    .from('academic_years')
    .select('*')
    .eq('student_id', student_id)
    .order('start_date', { ascending: true })`;

const newFetch = `  // 2. Fetch Academic Years for the student via mapping table
  const { data: mappings } = await supabase
    .from('student_academic_years')
    .select('*, academic_years(*)')
    .eq('student_id', student_id)
    
  // Flatten to match the old shape expected by TranscriptGenerator
  const academicYears = mappings?.map(m => ({
    id: m.academic_year_id,
    year_label: m.academic_years.name,
    grade_level: m.grade_level,
    start_date: m.academic_years.start_date,
    end_date: m.academic_years.end_date,
    student_id: m.student_id,
    mapping_id: m.id // just in case
  })).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()) || [];`;

content = content.replace(oldFetch, newFetch);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated transcript page');
