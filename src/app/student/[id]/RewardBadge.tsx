'use client'

import { useState } from'react'
import { unlockReward } from'./actions'
import { Unlock, Lock, Sparkles } from'lucide-react'

export default function RewardBadge({ 
  reward, 
  studentId, 
  currentPoints 
}: { 
  reward: any, 
  studentId: string, 
  currentPoints: number 
}) {
  const [isUnlocking, setIsUnlocking] = useState(false)
  const canUnlock = !reward.is_unlocked && currentPoints >= reward.points_required

  async function handleUnlock() {
    if (!canUnlock) return
    setIsUnlocking(true)
    try {
      await unlockReward(reward.id, studentId, reward.points_required)
    } catch (err) {
      alert("Error unlocking reward")
    } finally {
      setIsUnlocking(false)
    }
  }

  if (reward.is_unlocked) {
    return (
      <div className="bg-slate-50  p-4 rounded-xl border border-slate-200  shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
        <Sparkles className="absolute top-2 right-2 text-slate-600  opacity-20"size={16} />
        <div className="bg-white  p-2 rounded-full mb-2 border border-slate-100">
          <Unlock size={24} className="text-slate-500"/>
        </div>
        <p className="font-bold text-slate-900  text-sm">{reward.title}</p>
        <p className="text-[10px] text-slate-600  font-bold uppercase mt-1 tracking-wider">Unlocked</p>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-xl border transition-colors flex flex-col items-center justify-center text-center ${canUnlock ?'bg-stone-50  border-slate-200':'bg-stone-50  border-stone-200  opacity-70'}`}>
      <div className={`p-2 rounded-full mb-2 ${canUnlock ?'bg-slate-100 text-slate-600':'bg-stone-200 text-stone-400'}`}>
        <Lock size={24} />
      </div>
      <p className={`font-bold text-sm ${canUnlock ?'text-stone-900':'text-stone-500'}`}>{reward.title}</p>
      <p className="text-xs text-stone-500 font-medium mt-1">{reward.points_required} Points</p>
      
      {canUnlock && (
        <button 
          onClick={handleUnlock}
          disabled={isUnlocking}
          className="mt-3 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg w-full shadow-sm transition-colors disabled:opacity-50"
        >
          {isUnlocking ?'Unlocking...':'Unlock Now'}
        </button>
      )}
    </div>
  )
}
