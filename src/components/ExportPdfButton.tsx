'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'

export default function ExportPdfButton() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Dynamically load html-to-image to bypass html2canvas lab() color limitations
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js'
      
      script.onload = async () => {
        const element = document.getElementById('compliance-report-content')
        const letterhead = document.getElementById('pdf-letterhead')
        
        if (element && (window as any).htmlToImage) {
          let controls: HTMLElement | null = null
          try {
            // Temporarily show the letterhead, hide the controls
            if (letterhead) letterhead.style.display = 'block'
            controls = element.querySelector('.print\\:hidden') as HTMLElement
            if (controls) controls.style.display = 'none'

            // Generate high-quality PNG using the browser's native rendering
            const dataUrl = await (window as any).htmlToImage.toPng(element, {
              quality: 1.0,
              pixelRatio: 2,
              backgroundColor: '#ffffff'
            })
            
            // Restore visibility immediately after capture
            if (letterhead) letterhead.style.display = 'none'
            if (controls) controls.style.display = 'flex'

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()
            
            const imgProps = pdf.getImageProperties(dataUrl)
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
            
            let heightLeft = pdfHeight
            let position = 0

            // Add first page
            pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight)
            heightLeft -= pageHeight

            // Add subsequent pages if the content is long
            while (heightLeft > 0) {
              position = heightLeft - pdfHeight
              pdf.addPage()
              pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight)
              heightLeft -= pageHeight
            }

            pdf.save('Compliance_Report.pdf')
            setIsExporting(false)
          } catch (e) {
            console.error("Error generating image:", e)
            if (letterhead) letterhead.style.display = 'none'
            if (controls) controls.style.display = 'flex'
            setIsExporting(false)
          }
        } else {
          setIsExporting(false)
        }
      }
      
      document.body.appendChild(script)
    } catch (err) {
      console.error(err)
      setIsExporting(false)
    }
  }

  return (
    <button 
      onClick={handleExport}
      disabled={isExporting}
      className="print:hidden px-4 py-2 bg-slate-600 text-white rounded-md shadow-sm hover:bg-slate-700 font-medium text-sm transition-colors disabled:opacity-50"
    >
      {isExporting ? 'Generating PDF...' : '⬇ Export Compliance PDF'}
    </button>
  )
}
