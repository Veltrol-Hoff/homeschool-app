'use client'

import { useState } from'react'
import { addCurriculumItem, bulkAddCurriculumItems, csvBulkAddCurriculumItems, generate36WeekSchedule } from'./actions'
import Papa from'papaparse'

export default function AddItemsClient({ curriculumId, nextSequence }: { curriculumId: string, nextSequence: number }) {
  const [mode, setMode] = useState<'single'|'bulk'|'csv'|'auto'>('single')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // CSV Preview State
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [csvErrors, setCsvErrors] = useState<string[]>([])

  async function handleSingleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    try {
      await addCurriculumItem(curriculumId, formData)
      ;(e.target as HTMLFormElement).reset()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleBulkSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    try {
      await bulkAddCurriculumItems(curriculumId, formData)
      ;(e.target as HTMLFormElement).reset()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDownloadTemplate() {
    const headers = ['sequence_order', 'day_number', 'title', 'item_type', 'external_url', 'estimated_minutes']
    const csvContent = headers.join(',') + '\n' + `1,1,Chapter 1 Reading,reading,https://example.com,30\n2,2,Chapter 1 Quiz,worksheet,,15`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'curriculum_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleCsvFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      setCsvPreview([])
      setCsvErrors([])
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []
        const data = results.data.map((row: any, i) => {
          // Validate required fields
          if (!row.title || !row.item_type) {
            errors.push(`Row ${i + 1}: Missing title or item_type`)
          }
          let sequence_order = parseInt(row.sequence_order, 10)
          if (isNaN(sequence_order)) sequence_order = nextSequence + i
          
          let day_number = parseInt(row.day_number, 10)
          
          let estimated_minutes = parseInt(row.estimated_minutes, 10)
          if (isNaN(estimated_minutes)) estimated_minutes = 30

          return {
            curriculum_id: curriculumId,
            sequence_order,
            day_number: isNaN(day_number) ? null : day_number,
            title: row.title || 'Untitled',
            item_type: row.item_type || 'reading',
            external_url: row.external_url || null,
            estimated_minutes
          }
        })
        
        setCsvPreview(data)
        setCsvErrors(errors)
      },
      error: (error) => {
        setCsvErrors([error.message])
        setCsvPreview([])
      }
    })
  }

  async function handleCsvUpload() {
    if (csvErrors.length > 0) {
      setError("Please fix CSV errors before uploading.")
      return
    }
    if (csvPreview.length === 0) {
      setError("No valid data to upload.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      await csvBulkAddCurriculumItems(curriculumId, csvPreview)
      setCsvPreview([])
      setCsvErrors([])
      setMode('single') // go back to single mode on success
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAutoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const daysPerWeek = parseInt(formData.get('daysPerWeek') as string, 10)
    
    try {
      await generate36WeekSchedule(curriculumId, nextSequence, daysPerWeek)
      setMode('single')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white  rounded-xl shadow-sm border border-stone-100  p-6">
      <div className="flex flex-wrap border-b border-stone-200  mb-6 gap-2">
        <button 
          onClick={() => setMode('single')}
          className={`px-4 py-2 font-medium ${mode ==='single'?'border-b-2 border-slate-600 text-slate-600':'text-stone-500 hover:text-stone-700'}`}
        >
          One by One
        </button>
        <button 
          onClick={() => setMode('bulk')}
          className={`px-4 py-2 font-medium ${mode ==='bulk'?'border-b-2 border-slate-600 text-slate-600':'text-stone-500 hover:text-stone-700'}`}
        >
          Bulk Paste
        </button>
        <button 
          onClick={() => setMode('csv')}
          className={`px-4 py-2 font-medium ${mode ==='csv'?'border-b-2 border-slate-600 text-slate-600':'text-stone-500 hover:text-stone-700'}`}
        >
          CSV Upload
        </button>
        <button 
          onClick={() => setMode('auto')}
          className={`px-4 py-2 font-medium ${mode ==='auto'?'border-b-2 border-purple-600 text-purple-600':'text-stone-500 hover:text-stone-700'}`}
        >
          Auto-Generate
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
          {error}
        </div>
      )}

      {mode ==='single'? (
        <form onSubmit={handleSingleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sequence #</label>
              <input type="number"name="sequence_order"required defaultValue={nextSequence} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Minutes</label>
              <input type="number"name="estimated_minutes"required defaultValue={30} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Item Title</label>
            <input type="text"name="title"required placeholder="e.g. Reader Chapter 1"className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Item Type</label>
            <select name="item_type"required className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border">
              <option value="reading">Reading</option>
              <option value="worksheet">Worksheet</option>
              <option value="video">Video</option>
              <option value="online_module">Online Module</option>
              <option value="project">Project</option>
            </select>
          </div>
          <button type="submit"disabled={isSubmitting} className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 mt-2">
            {isSubmitting ?'Adding...':'Add Item'}
          </button>
        </form>
      ) : mode ==='bulk'? (
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Paste items (one per line)</label>
            <textarea 
              name="bulkText"
              required 
              rows={6}
              placeholder="Lesson 1&#10;Lesson 2&#10;Lesson 3"
              className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"
            />
            <p className="text-xs text-stone-500 mt-1">Sequence order will auto-increment starting from the number below.</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Seq #</label>
              <input type="number"name="start_sequence"required defaultValue={nextSequence} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Default Mins</label>
              <input type="number"name="estimated_minutes"required defaultValue={30} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Default Type</label>
              <select name="item_type"required className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border">
                <option value="reading">Reading</option>
                <option value="worksheet">Worksheet</option>
                <option value="video">Video</option>
                <option value="online_module">Online Module</option>
                <option value="project">Project</option>
              </select>
            </div>
          </div>
          <button type="submit"disabled={isSubmitting} className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 mt-2">
            {isSubmitting ?'Processing...':'Bulk Add Items'}
          </button>
        </form>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center bg-stone-50  p-4 rounded-md border border-stone-200">
            <div>
              <h4 className="font-medium text-stone-900">Prepare your data</h4>
              <p className="text-sm text-stone-500  mt-1">Download our template and fill it out using Excel or Google Sheets.</p>
            </div>
            <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-white border border-stone-300  hover:bg-stone-50   rounded-md font-medium text-sm transition-colors shadow-sm">
              Download Template
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Upload CSV</label>
            <input 
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange} 
              className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2 border file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
            />
          </div>

          {csvErrors.length > 0 && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100   animate-in fade-in">
              <h4 className="font-bold mb-1">Validation Errors</h4>
              <ul className="list-disc pl-5">
                {csvErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {csvPreview.length > 0 && (
            <div className="mt-4 border border-stone-200  rounded-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-stone-100  px-4 py-2 text-sm font-bold border-b border-stone-200  flex justify-between items-center">
                <span>Preview ({csvPreview.length} items)</span>
                <span className="text-slate-600  text-xs font-normal px-2 py-1 bg-slate-50  rounded-full border border-slate-200">
                  Ready to import
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-stone-50  sticky top-0 border-b border-stone-200  shadow-sm">
                    <tr>
                      <th className="px-4 py-2 font-medium">Seq</th>
                      <th className="px-4 py-2 font-medium">Title</th>
                      <th className="px-4 py-2 font-medium">Type</th>
                      <th className="px-4 py-2 font-medium">Mins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((item, i) => (
                      <tr key={i} className="border-b border-stone-100  hover:bg-stone-50  transition-colors">
                        <td className="px-4 py-2 text-stone-500 font-mono text-xs">{item.sequence_order}</td>
                        <td className="px-4 py-2 font-medium">{item.title}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-stone-100  rounded-md text-xs">{item.item_type}</span>
                        </td>
                        <td className="px-4 py-2 text-stone-500">{item.estimated_minutes}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-stone-50  border-t border-stone-200">
                <button 
                  onClick={handleCsvUpload} 
                  disabled={isSubmitting || csvErrors.length > 0} 
                  className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ?'Uploading to Database...': `Confirm & Upload ${csvPreview.length} Items`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode ==='auto'&& (
        <form onSubmit={handleAutoSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-purple-50  p-4 rounded-lg border border-purple-100  mb-4">
            <h4 className="font-bold text-purple-800">Generate 36-Week Schedule</h4>
            <p className="text-sm text-purple-700  mt-1">
              Instantly create a 36-week schedule of placeholder curriculum items. Perfect for BookShark or full-year programs.
            </p>
          </div>
          
          <div>
            <label htmlFor="daysPerWeek"className="block text-sm font-medium mb-1">Days Per Week</label>
            <select 
              id="daysPerWeek"
              name="daysPerWeek"
              required
              defaultValue="4"
              className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500 focus:ring-slate-500    p-2.5 border"
            >
              <option value="3">3 Days (108 items)</option>
              <option value="4">4 Days (144 items) - BookShark Standard</option>
              <option value="5">5 Days (180 items) - Traditional School</option>
            </select>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting} 
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-bold transition-colors disabled:opacity-50 mt-4 shadow-sm"
          >
            {isSubmitting ?'Generating...':'Generate Schedule'}
          </button>
        </form>
      )}
    </div>
  )
}
