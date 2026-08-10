const fs = require('fs');

const filePath = 'src/app/curriculum/actions.ts';
let content = fs.readFileSync(filePath, 'utf8');

const oldFetch = `  // Fetch academic years for the student
  const { data: academicYears } = await supabase
    .from('academic_years')
    .select('id, start_date, end_date')
    .eq('student_id', student_id)`;

const newFetch = `  // Fetch academic years for the student via mapping
  const { data: mappings } = await supabase
    .from('student_academic_years')
    .select('academic_year_id, academic_years(start_date, end_date)')
    .eq('student_id', student_id)
    
  const academicYears = mappings?.map(m => ({
    id: m.academic_year_id,
    start_date: m.academic_years.start_date,
    end_date: m.academic_years.end_date
  })) || [];`;

content = content.replace(oldFetch, newFetch);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated curriculum actions');
