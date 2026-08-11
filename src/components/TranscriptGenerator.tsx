'use client'
import { useState } from'react'
import jsPDF from'jspdf'
import autoTable from'jspdf-autotable'
import { format } from'date-fns'

type TranscriptRecord = {
  id: string
  academic_year_id: string
  credit_earned: number
  grade_mark: string
  confirmed_date: string | null
  course_name?: string
  subjects: { name: string }
}

type AcademicYear = {
  id: string
  year_label: string
  grade_level: string
  start_date: string
  end_date: string
}

type Student = {
  id: string
  name: string
  birth_date: string
}

function calculateGPA(transcripts: TranscriptRecord[]): { gpa: number, totalCredits: number } {
  let totalPoints = 0
  let gradedCredits = 0
  let totalCredits = 0

  transcripts.forEach(t => {
    // Treat'IP'(In Progress) as no-impact on GPA, but if they earned credit, we could count it towards total.
    // Usually'IP'has 0 credits earned until complete. We'll count credit_earned towards totalCredits regardless if it's > 0.
    totalCredits += t.credit_earned

    if (t.grade_mark ==='IP'|| !t.confirmed_date) return

    let points = 0
    switch (t.grade_mark.charAt(0).toUpperCase()) {
      case'A': points = 4.0; break;
      case'B': points = 3.0; break;
      case'C': points = 2.0; break;
      case'D': points = 1.0; break;
      case'F': points = 0.0; break;
      default: return; // Unrecognized grades (like Pass/Fail) don't affect GPA
    }

    totalPoints += points * t.credit_earned
    gradedCredits += t.credit_earned
  })

  const gpa = gradedCredits > 0 ? (totalPoints / gradedCredits) : 0
  return { gpa: Math.round(gpa * 100) / 100, totalCredits }
}

export default function TranscriptGenerator({
  student,
  academicYears,
  transcripts
}: {
  student: Student
  academicYears: AcademicYear[]
  transcripts: TranscriptRecord[]
}) {
  const [exportYearId, setExportYearId] = useState<string>('all')

  // Filter years based on selection
  const filteredYears = exportYearId ==='all'
    ? academicYears 
    : academicYears.filter(y => y.id === exportYearId)

  // Only pass filtered transcripts to GPA calculation
  const filteredTranscripts = exportYearId ==='all'
    ? transcripts
    : transcripts.filter(t => t.academic_year_id === exportYearId)

  const { gpa, totalCredits } = calculateGPA(filteredTranscripts)

  // Group transcripts by academic year
  const grouped = filteredYears.map(ay => {
    const records = filteredTranscripts.filter(t => t.academic_year_id === ay.id)
    return { ...ay, records }
  }).filter(ay => ay.records.length > 0).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

  async function generatePDF() {
    const doc = new jsPDF()

    let currentY = 15;

    // Add Logo & Letterhead
    try {
      const response = await fetch('/api/logo')
      const blob = await response.blob()
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      
      doc.addImage(logoBase64, 'JPEG', 105 - 25, currentY, 50, 50)
      currentY += 55
      
      doc.setFontSize(10)
      doc.setFont("helvetica","normal")
      doc.text("1713 Daily Dr. Waunakee, WI 53597 | info@hoffmannhomeschool.com", 105, currentY, { align: "center" })
      currentY += 10
    } catch (e) {
      console.error("Failed to load logo", e)
      currentY = 20
    }

    // Header
    doc.setFont("helvetica","bold")
    doc.setFontSize(16)
    doc.text("OFFICIAL HIGH SCHOOL TRANSCRIPT", 105, currentY, { align:"center"})
    currentY += 10

    doc.setFontSize(12)
    doc.setFont("helvetica","normal")
    doc.text(`Student Name: ${student.name}`, 14, currentY)
    
    doc.text(`School: Hoffmann Home School`, 120, currentY)
    doc.text(`Print Date: ${format(new Date(),'MMMM d, yyyy')}`, 120, currentY + 7)

    currentY += 13
    doc.line(14, currentY, 196, currentY)

    // Body (Tables)
    currentY += 7

    grouped.forEach(year => {
      doc.setFontSize(11)
      doc.setFont("helvetica","bold")
      doc.text(`Academic Year: ${year.year_label} (Grade ${year.grade_level})`, 14, currentY)
      currentY += 6

      // Setup table columns for this year
      const tableData = year.records.map(r => [
        r.course_name || r.subjects?.name ||'Unknown Subject',
        r.credit_earned.toFixed(2),
        r.grade_mark ==='IP'?'In Progress': r.grade_mark
      ])

      autoTable(doc, {
        startY: currentY,
        head: [['Course Title','Credits','Final Grade']],
        body: tableData,
        theme:'grid',
        headStyles: { fillColor: [50, 60, 70] }, // Slate-800 to match theme
        margin: { left: 14, right: 14 },
      })

      currentY = (doc as any).lastAutoTable.finalY + 10
    })

    if (grouped.length === 0) {
      doc.setFont("helvetica","italic")
      doc.text("No confirmed transcript records found.", 14, currentY)
      currentY += 10
    }

    // Footer
    currentY += 5
    doc.setFontSize(12)
    doc.setFont("helvetica","bold")
    doc.text(`Cumulative GPA: ${gpa.toFixed(2)}`, 14, currentY)
    doc.text(`Total Credits Earned: ${totalCredits.toFixed(2)}`, 120, currentY)

    // Certification
    currentY += 30
    
    // Signature line
    doc.line(14, currentY, 80, currentY)
    doc.setFontSize(10)
    doc.setFont("helvetica","normal")
    doc.text("Signature of School Administrator", 14, currentY + 5)
    
    // Date line
    doc.text(format(new Date(),'MM/dd/yyyy'), 135, currentY - 2) // Print date above the line
    doc.line(120, currentY, 170, currentY)
    doc.text("Date", 120, currentY + 5) // Print "Date" label below the line

    doc.save(`${student.name.replace(/\s+/g,'_')}_Transcript.pdf`)
  }

  return (
    <div className="bg-white  p-6 rounded-2xl shadow-sm border border-stone-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Academic Transcript</h2>
          <p className="text-stone-500">{student.name}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={exportYearId}
            onChange={(e) => setExportYearId(e.target.value)}
            className="p-2 border border-stone-300  rounded-lg bg-stone-50  text-sm flex-1 md:flex-none"
          >
            <option value="all">All Academic Years</option>
            {academicYears.map(y => (
              <option key={y.id} value={y.id}>{y.year_label} (Grade {y.grade_level})</option>
            ))}
          </select>
          <button 
            onClick={generatePDF}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800   text-white  rounded-md font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            📄 Download Official PDF
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {grouped.map(year => (
          <div key={year.id} className="border border-stone-200  rounded-lg overflow-hidden">
            <div className="bg-stone-50  px-4 py-3 border-b border-stone-200">
              <h3 className="font-bold text-stone-800">{year.year_label} &bull; {year.grade_level}</h3>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-white  border-b border-stone-100">
                <tr>
                  <th className="px-4 py-3 font-medium text-stone-500 uppercase tracking-wider">Course Title</th>
                  <th className="px-4 py-3 font-medium text-stone-500 uppercase tracking-wider w-32">Credits</th>
                  <th className="px-4 py-3 font-medium text-stone-500 uppercase tracking-wider w-32">Final Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100  bg-white">
                {year.records.map(r => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium text-stone-800">{r.subjects?.name ||'Unknown Subject'}</td>
                    <td className="px-4 py-3 text-stone-600">{r.credit_earned.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {r.grade_mark ==='IP'? (
                        <span className="px-2 py-1 bg-stone-100  text-stone-600  text-xs font-medium rounded">In Progress</span>
                      ) : (
                        <span className="font-medium text-stone-900">{r.grade_mark}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {grouped.length === 0 && (
          <div className="p-8 text-center text-stone-500 border border-dashed border-stone-300  rounded-lg">
            No confirmed transcript records found for this student.
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-stone-200  flex flex-col sm:flex-row justify-between items-center gap-4 bg-stone-50  p-6 rounded-lg">
        <div>
          <p className="text-sm text-stone-500 uppercase tracking-wider font-bold mb-1">Total Credits Earned</p>
          <p className="text-3xl font-light text-stone-900">{totalCredits.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-stone-500 uppercase tracking-wider font-bold mb-1">Cumulative GPA</p>
          <p className="text-4xl font-bold text-slate-600">{gpa.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
