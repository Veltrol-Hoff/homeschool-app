const fs = require('fs');

const filePath = 'src/app/student/[id]/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldYearLookup = `  const { data: currentYear } = await supabase
    .from('academic_years')
    .select('*')
    .eq('student_id', id)
    .order('start_date', { ascending: false })
    .limit(1)
    .single()`;

const newYearLookup = `  const { data: currentMapping } = await supabase
    .from('student_academic_years')
    .select('*, academic_years(*)')
    .eq('student_id', id)
    .limit(1)
    .single()
  
  const currentYear = currentMapping?.academic_years;
  const gradeLevel = currentMapping?.grade_level;`;

content = content.replace(oldYearLookup, newYearLookup);

// Wait, I need to check where `currentYear.grade_level` is used in this file.
// Let's replace `currentYear.grade_level` with `gradeLevel`.
content = content.replace(/currentYear\?\.grade_level/g, 'gradeLevel');
content = content.replace(/currentYear\.grade_level/g, 'gradeLevel');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated student page');
