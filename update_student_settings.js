const fs = require('fs');

const filePath = 'src/app/settings/students/StudentSettingsForm.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update component signature
content = content.replace(
    'export default function StudentSettingsForm({ student }: { student: any }) {',
    'export default function StudentSettingsForm({ student, globalAcademicYears = [] }: { student: any, globalAcademicYears?: any[] }) {'
);

// Replace the years mapping
content = content.replace(
    'const years = student.academic_years || []',
    'const years = student.student_academic_years || []'
);

// Update form for adding year
const old_add_form = `<form onSubmit={handleAddYear} className="flex flex-wrap gap-2 mb-6 bg-stone-100  p-4 rounded-lg border border-stone-200">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-stone-500 mb-1">Year Label</label>
            <input type="text"name="year_label"required placeholder="e.g. 2025-2026"className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 border text-sm"/>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-semibold text-stone-500 mb-1">Grade Level</label>
            <select name="grade_level"required className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 border text-sm">
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[130px]">
            <label className="block text-xs font-semibold text-stone-500 mb-1">Start Date</label>
            <input type="date"name="start_date"required className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 border text-sm"/>
          </div>
          <div className="flex-1 min-w-[130px]">
            <label className="block text-xs font-semibold text-stone-500 mb-1">End Date</label>
            <input type="date"name="end_date"required className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 border text-sm"/>
          </div>
          <div className="flex items-end">
            <button type="submit"disabled={isAddingYear} className="w-full px-4 py-2 bg-slate-600 text-white rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50">
              {isAddingYear ?'Adding...':'Add Year'}
            </button>
          </div>
        </form>`;

const new_add_form = `<form onSubmit={handleAddYear} className="flex flex-wrap gap-2 mb-6 bg-stone-100 p-4 rounded-lg border border-stone-200">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-stone-500 mb-1">Academic Year</label>
            <select name="academic_year_id" required className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 p-2 border text-sm">
              <option value="">Select a year...</option>
              {globalAcademicYears.map(y => <option key={y.id} value={y.id}>{y.name} ({y.start_date} to {y.end_date})</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-stone-500 mb-1">Grade Level</label>
            <select name="grade_level" required className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 p-2 border text-sm">
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={isAddingYear} className="w-full px-4 py-2 bg-slate-600 text-white rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50">
              {isAddingYear ? 'Linking...' : 'Link to Year'}
            </button>
          </div>
        </form>`;

content = content.replace(old_add_form, new_add_form);

// Update map block
const old_map = `{editingYearId === year.id ? (
                <form onSubmit={(e) => handleUpdateYear(e, year.id)} className="flex flex-wrap gap-2">
                  <input type="text"name="year_label"defaultValue={year.year_label} required className="flex-1 min-w-[100px] rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 border text-sm"/>
                  <select name="grade_level"defaultValue={year.grade_level} required className="flex-1 min-w-[100px] rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 border text-sm">
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <input type="date"name="start_date"defaultValue={year.start_date} required className="flex-1 min-w-[120px] rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 border text-sm"/>
                  <input type="date"name="end_date"defaultValue={year.end_date} required className="flex-1 min-w-[120px] rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 border text-sm"/>
                  <div className="flex gap-2">
                    <button type="submit"className="px-3 py-2 bg-slate-600 text-white rounded-md text-sm hover:bg-slate-700"><LucideIcons.Check size={16} /></button>
                    <button type="button"onClick={() => setEditingYearId(null)} className="px-3 py-2 bg-stone-200  rounded-md text-sm"><LucideIcons.X size={16} /></button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{year.year_label} <span className="text-slate-600 ml-2 text-sm">{year.grade_level}</span></p>
                    <p className="text-xs text-stone-500">{year.start_date} to {year.end_date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingYearId(year.id)} className="p-2 text-stone-500 hover:text-slate-600 rounded-md hover:bg-stone-100"><LucideIcons.Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteYear(year.id)} className="p-2 text-stone-500 hover:text-red-600 rounded-md hover:bg-stone-100"><LucideIcons.Trash2 size={16} /></button>
                  </div>
                </div>
              )}`;

const new_map = `{editingYearId === year.id ? (
                <form onSubmit={(e) => handleUpdateYear(e, year.id)} className="flex flex-wrap gap-2">
                  <select name="academic_year_id" defaultValue={year.academic_year_id} required className="flex-1 min-w-[150px] rounded-md border-stone-300 shadow-sm focus:border-slate-500 p-2 border text-sm">
                    {globalAcademicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                  <select name="grade_level" defaultValue={year.grade_level} required className="flex-1 min-w-[100px] rounded-md border-stone-300 shadow-sm focus:border-slate-500 p-2 border text-sm">
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-2 bg-slate-600 text-white rounded-md text-sm hover:bg-slate-700"><LucideIcons.Check size={16} /></button>
                    <button type="button" onClick={() => setEditingYearId(null)} className="px-3 py-2 bg-stone-200 rounded-md text-sm"><LucideIcons.X size={16} /></button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{year.academic_years?.name} <span className="text-slate-600 ml-2 text-sm">{year.grade_level}</span></p>
                    <p className="text-xs text-stone-500">{year.academic_years?.start_date} to {year.academic_years?.end_date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingYearId(year.id)} className="p-2 text-stone-500 hover:text-slate-600 rounded-md hover:bg-stone-100"><LucideIcons.Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteYear(year.id)} className="p-2 text-stone-500 hover:text-red-600 rounded-md hover:bg-stone-100"><LucideIcons.Trash2 size={16} /></button>
                  </div>
                </div>
              )}`;

content = content.replace(old_map, new_map);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated StudentSettingsForm.tsx");
