const fs = require('fs');

const filePath = 'src/app/transcripts/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldFetch = `  // Fetch academic years
  const { data: academicYears } = await supabase
    .from('academic_years')
    .select('*')
    .order('start_date', { ascending: false })`;

const newFetch = `  // Fetch academic years via mapping
  const { data: mappings } = await supabase
    .from('student_academic_years')
    .select('*, academic_years(*)')
    
  const academicYears = mappings?.map(m => ({
    id: m.academic_year_id,
    year_label: m.academic_years.name,
    grade_level: m.grade_level,
    start_date: m.academic_years.start_date,
    end_date: m.academic_years.end_date,
    student_id: m.student_id,
    mapping_id: m.id
  })).sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()) || [];`;

content = content.replace(oldFetch, newFetch);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated transcripts page');
