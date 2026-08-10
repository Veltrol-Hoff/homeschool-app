'use client'

import { useState } from'react'
import { pdf, Document, Page, Text, View, StyleSheet, Image } from'@react-pdf/renderer'
import { fetchExportData } from'@/app/export/actions'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily:'Helvetica'},
  header: { fontSize: 24, marginBottom: 20, textAlign:'center', fontWeight:'bold'},
  section: { margin: 10, padding: 10 },
  title: { fontSize: 18, marginBottom: 10, borderBottom:'1 solid #ccc', paddingBottom: 5 },
  text: { fontSize: 12, marginBottom: 5, lineHeight: 1.5 },
  row: { flexDirection:'row', borderBottom:'1 solid #eee', paddingVertical: 5 },
  cellLeft: { width:'70%', fontSize: 12 },
  cellRight: { width:'30%', fontSize: 12, textAlign:'right'},
  imageGrid: { flexDirection:'row', flexWrap:'wrap', gap: 10, marginTop: 10 },
  image: { width: 150, height: 150, objectFit:'cover'}
})

const ExportPDFDocument = ({ student, options, data, logoUrl }: any) => (
  <Document>
    <Page size="A4"style={styles.page}>
      <View style={{ alignItems: 'center', marginBottom: 30 }}>
        <Image src={logoUrl} style={{ width: 150, height: 150, objectFit: 'contain', marginBottom: 10 }} />
        <Text style={{ fontSize: 12, color: '#4b5563', marginTop: 5 }}>1713 Daily Dr. Waunakee, WI 53597 | info@hoffmannhomeschool.com</Text>
      </View>
      
      <Text style={styles.header}>Homeschool Portfolio: {student?.name}</Text>
      
      {options.hoursSummary && (
        <View style={styles.section}>
          <Text style={styles.title}>Hours Summary</Text>
          <Text style={styles.text}>Total Logged Hours: {data.totalHours || 0}</Text>
          <Text style={styles.text}>Required State Hours: 875</Text>
        </View>
      )}

      {options.subjectChecklist && (
        <View style={styles.section}>
          <Text style={styles.title}>6-Subject Checklist</Text>
          {(data.subjects || []).map((s: any) => (
            <View key={s.id} style={styles.row}>
              <Text style={styles.cellLeft}>{s.name}</Text>
              <Text style={styles.cellRight}>{s.hours > 0 ?'✓ Taught':'Pending'}</Text>
            </View>
          ))}
        </View>
      )}

      {options.curriculumCompletion && (
        <View style={styles.section}>
          <Text style={styles.title}>Curriculum Overview</Text>
          {(data.curricula || []).map((c: any) => (
            <View key={c.id} style={styles.row}>
              <Text style={styles.cellLeft}>{c.curricula?.title} ({c.curricula?.subjects?.name})</Text>
              <Text style={styles.cellRight}>{c.curricula?.pacing_type}</Text>
            </View>
          ))}
        </View>
      )}
      {options.transcript && (
        <View style={styles.section}>
          <Text style={styles.title}>Official Transcript</Text>
          {(data.transcripts || []).map((t: any) => (
            <View key={t.id} style={styles.row}>
              <Text style={styles.cellLeft}>{t.subjects?.name}</Text>
              <Text style={styles.cellRight}>{t.credit_earned} Cr / {t.grade_mark}</Text>
            </View>
          ))}
        </View>
      )}
    </Page>

    {options.portfolioPhotos && data.photos && data.photos.length > 0 && (
      <Page size="A4"style={styles.page}>
        <Text style={styles.title}>Portfolio Work Samples</Text>
        <View style={styles.imageGrid}>
          {data.photos.map((url: string, i: number) => (
            // react-pdf can fetch standard public URLs
            <Image key={i} src={url} style={styles.image} />
          ))}
        </View>
      </Page>
    )}
  </Document>
)

export default function GeneratePDFButton({ student, yearId, options }: any) {
  const [isGenerating, setIsGenerating] = useState(false)


  async function handleGenerate() {
    if (!student || !yearId) return
    setIsGenerating(true)
    
    try {
      // 1. Fetch data required for PDF
      const data = await fetchExportData(student.id, yearId)
      
      const logoUrl = window.location.origin + '/api/logo'

      // 2. Generate PDF Blob
      const blob = await pdf(<ExportPDFDocument student={student} options={options} data={data} logoUrl={logoUrl} />).toBlob()
      
      // 3. Trigger Download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Portfolio_${student.name.replace(/\s+/g,'_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (e) {
      console.error(e)
      alert("Failed to generate PDF. Check console.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating || !yearId}
      className="bg-slate-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-700 disabled:opacity-50 transition-colors w-full"
    >
      {isGenerating ?'Generating PDF...':'Generate PDF'}
    </button>
  )
}
