'use client'

import { useState } from'react'
import { createReward, deleteReward } from'./actions'

export default function RewardsManager({ 
  studentId, 
  rewards, 
  currentPoints 
}: { 
  studentId: string, 
  rewards: any[], 
  currentPoints: number 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setIsSubmitting(true)
    try {
      const res = await createReward(studentId, new FormData(form))
      if (res.error) {
        alert(res.error)
      } else {
        form.reset()
      }
    } catch (err: any) {
      console.error("Reward creation threw an error:", err)
      alert("Error creating reward:"+ (err.message || err.toString()))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this reward?')) return
    setIsSubmitting(true)
    try {
      await deleteReward(id)
    } catch (err) {
      alert("Error deleting reward")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-50  p-4 rounded-lg border border-slate-100  text-center">
        <p className="text-sm text-slate-800">Current Points</p>
        <p className="text-3xl font-bold text-slate-600">{currentPoints}</p>
      </div>

      <div className="space-y-3">
        {rewards && rewards.length > 0 ? rewards.map(r => (
          <div key={r.id} className="flex justify-between items-center p-3 bg-stone-50  rounded-lg border border-stone-200">
            <div>
              <p className="font-bold text-sm">{r.title}</p>
              <p className="text-xs text-stone-500">{r.points_required} pts to unlock {r.is_unlocked &&'(Unlocked)'}</p>
            </div>
            <button 
              onClick={() => handleDelete(r.id)}
              disabled={isSubmitting}
              className="text-xs text-red-500 hover:bg-red-50 p-2 rounded-md"
            >
              Delete
            </button>
          </div>
        )) : (
          <p className="text-sm text-stone-500">No rewards configured.</p>
        )}
      </div>

      <form onSubmit={handleCreate} className="pt-4 border-t border-stone-200  space-y-3">
        <h4 className="text-sm font-semibold">Add New Reward</h4>
        <div className="flex gap-2">
          <input 
            type="text"
            name="title"
            required 
            placeholder="Reward (e.g. Yes Day)"
            className="flex-1 rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 text-sm"
          />
          <input 
            type="number"
            name="points_required"
            required 
            defaultValue={10}
            className="w-20 rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 text-sm"
          />
        </div>
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md font-medium text-sm transition-colors disabled:opacity-50"
        >
          {isSubmitting ?'Adding...':'Add Reward'}
        </button>
      </form>
    </div>
  )
}
