'use client'

import { useState } from 'react'
import { pdf, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { fontSize: 24, marginBottom: 5, textAlign: 'center', fontWeight: 'bold' },
  subHeader: { fontSize: 12, marginBottom: 20, textAlign: 'center', color: '#4b5563' },
  section: { marginTop: 15, marginBottom: 10 },
  title: { fontSize: 16, marginBottom: 8, borderBottom: '1 solid #ccc', paddingBottom: 4, fontWeight: 'bold' },
  text: { fontSize: 10, marginBottom: 4, lineHeight: 1.5 },
  row: { flexDirection: 'row', borderBottom: '1 solid #eee', paddingVertical: 4 },
  cellLeft: { width: '70%', fontSize: 10 },
  cellRight: { width: '30%', fontSize: 10, textAlign: 'right' },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 150, height: 150, objectFit: 'contain', marginBottom: 10 },
  studentInfo: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '50%', paddingRight: 10, marginBottom: 10 },
  standardCode: { fontSize: 10, fontWeight: 'bold' },
  standardDesc: { fontSize: 8, color: '#666' }
})

const CompliancePDFDocument = ({ reports, logoUrl }: any) => (
  <Document>
    {reports.map((report: any, index: number) => (
      <Page key={index} size="A4" style={styles.page}>
        <View style={styles.logoContainer}>
          {logoUrl && <Image src={logoUrl} style={styles.logo} />}
          <Text style={styles.subHeader}>1713 Daily Dr. Waunakee, WI 53597 | info@hoffmannhomeschool.com</Text>
        </View>

        <View style={{ marginBottom: 20, borderBottom: '2 solid #000', paddingBottom: 10 }}>
          <Text style={styles.studentInfo}>{report.student.name}</Text>
          <Text style={styles.text}>Academic Year: {report.currentYear?.year_label || 'N/A'} • Grade: {report.currentYear?.grade_level || 'N/A'}</Text>
          <Text style={styles.text}>Total Logged Hours: {report.totalHoursAll}</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.title}>Wisconsin Required Subjects</Text>
            {report.requiredSubjectStatus.map((req: any, i: number) => (
              <View key={i} style={styles.row}>
                <Text style={styles.cellLeft}>{req.name}</Text>
                <Text style={styles.cellRight}>{req.completed ? '✓ Completed' : 'Pending'}</Text>
              </View>
            ))}
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.title}>Hours by Subject</Text>
            {report.subjectStats.map((stat: any, i: number) => (
              <View key={i} style={styles.row}>
                <Text style={styles.cellLeft}>{stat.name}</Text>
                <Text style={styles.cellRight}>{stat.totalHours} hrs</Text>
              </View>
            ))}
          </View>
        </View>

        {report.standardsCoverage && report.standardsCoverage.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.title}>Standards Coverage</Text>
            {report.standardsCoverage.map((std: any, i: number) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={styles.standardCode}>
                  {std.isCovered ? '[X] ' : '[ ] '}{std.code}
                </Text>
                <Text style={styles.standardDesc}>{std.short_description}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    ))}
  </Document>
)

export default function ComplianceExportAllButton({ reports, logoBase64 }: { reports: any[], logoBase64?: string }) {
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerate() {
    setIsGenerating(true)
    try {
      // Use the provided base64 logo if available, fallback to api route
      const logoUrl = logoBase64 || (window.location.origin + '/api/logo')
      const blob = await pdf(
        <CompliancePDFDocument reports={reports} logoUrl={logoUrl} />
      ).toBlob()
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Hoffmann_Compliance_Report.pdf`
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
      disabled={isGenerating}
      className="print:hidden px-4 py-2 bg-slate-600 text-white rounded-md shadow-sm hover:bg-slate-700 font-medium text-sm transition-colors disabled:opacity-50"
    >
      {isGenerating ? 'Generating PDF...' : '⬇ Download Official PDF'}
    </button>
  )
}
