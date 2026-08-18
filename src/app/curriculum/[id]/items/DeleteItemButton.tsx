'use client'

import { useState } from 'react'
import { deleteCurriculumItem } from './actions'

export default function DeleteItemButton({ curriculumId, itemId }: { curriculumId: string, itemId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this item?')) return
    setIsDeleting(true)
    try {
      await deleteCurriculumItem(curriculumId, itemId)
    } catch (err) {
      console.error(err)
      alert("Failed to delete item")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-stone-400 hover:text-red-600 transition-colors disabled:opacity-50"
      title="Delete item"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
    </button>
  )
}
