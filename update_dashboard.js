const fs = require('fs');

const filePath = 'src/app/dashboard/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace academicYears query
const oldAcademic = `  const { data: academicYears } = await supabase
    .from('academic_years')
    .select('*')
    .order('start_date', { ascending: false })`;

const newAcademic = `  // Fetch current academic years mappings for these students
  const { data: studentAcademicYears } = await supabase
    .from('student_academic_years')
    .select('*, academic_years(*)')`;

content = content.replace(oldAcademic, newAcademic);

// Replace currentYear lookup
const oldLookup = `    const currentYear = academicYears?.find(ay => ay.student_id === student.id)`;
const newLookup = `    // Find current mapping
    const currentMapping = studentAcademicYears?.find(say => say.student_id === student.id);
    const currentYear = currentMapping?.academic_years;
    const gradeLevel = currentMapping?.grade_level || 'Unknown Grade';`;

content = content.replace(oldLookup, newLookup);

// Replace grade_level return
const oldGrade = `      grade_level: currentYear?.grade_level || 'Unknown Grade',`;
const newGrade = `      grade_level: gradeLevel,`;

content = content.replace(oldGrade, newGrade);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated dashboard');
