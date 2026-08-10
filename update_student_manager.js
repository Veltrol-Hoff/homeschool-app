const fs = require('fs');

const filePath = 'src/components/StudentManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update editing map
content = content.replace(
  "setGradeLevel(student.academic_years?.[0]?.grade_level || '1')",
  "setGradeLevel(student.student_academic_years?.[0]?.grade_level || '1')"
);

// Update database queries for update
const oldUpdate = `        if (editingStudent.academic_years?.[0]) {
          await supabase
            .from('academic_years')
            .update({ grade_level: gradeLevel })
            .eq('id', editingStudent.academic_years[0].id)
        }`;
const newUpdate = `        if (editingStudent.student_academic_years?.[0]) {
          await supabase
            .from('student_academic_years')
            .update({ grade_level: gradeLevel })
            .eq('id', editingStudent.student_academic_years[0].id)
        }`;
content = content.replace(oldUpdate, newUpdate);

// Update database queries for insert
const oldInsert = `          if (newStudent && !error) {
            // Create initial academic year
            await supabase
              .from('academic_years')
              .insert([{
                student_id: newStudent.id,
                grade_level: gradeLevel,
                year_label: 'Initial Year',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
              }])
          }`;
const newInsert = `          if (newStudent && !error) {
            // Find global academic year
            const { data: ays } = await supabase.from('academic_years').select('id').order('start_date', { ascending: false }).limit(1);
            if (ays && ays.length > 0) {
              await supabase
                .from('student_academic_years')
                .insert([{
                  student_id: newStudent.id,
                  academic_year_id: ays[0].id,
                  grade_level: gradeLevel
                }])
            }
          }`;
content = content.replace(oldInsert, newInsert);

// Update rendering list
const oldRender = `Grade {student.academic_years?.[0]?.grade_level || 'Unknown'}`;
const newRender = `Grade {student.student_academic_years?.[0]?.grade_level || 'Unknown'}`;
content = content.replace(oldRender, newRender);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated StudentManager.tsx');
