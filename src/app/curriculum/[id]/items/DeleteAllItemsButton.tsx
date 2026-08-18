'use client'

import { useState } from 'react'
import { deleteAllCurriculumItems } from './actions'

export default function DeleteAllItemsButton({ curriculumId, itemCount }: { curriculumId: string, itemCount: number }) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete all ${itemCount} items? This cannot be undone.`)) return
    setIsDeleting(true)
    try {
      await deleteAllCurriculumItems(curriculumId)
    } catch (err) {
      console.error(err)
      alert("Failed to delete all items")
    } finally {
      setIsDeleting(false)
    }
  }

  if (itemCount === 0) return null

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-sm px-3 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
    >
      {isDeleting ? 'Deleting...' : 'Delete All Items'}
    </button>
  )
}
