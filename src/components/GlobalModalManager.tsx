'use client'

import { useSearchParams, useRouter, usePathname } from'next/navigation'
import InlineActivityModal from'./InlineActivityModal'
import TripDetailModal from'./TripDetailModal'
import { format } from'date-fns'

export default function GlobalModalManager({ students, subjects, activities }: { students: any[], subjects: any[], activities: any[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const quickAdd = searchParams.get('quickAdd') ==='true'
  const viewTrip = searchParams.get('viewTrip')
  const editActivity = searchParams.get('editActivity')
  const tab = searchParams.get('tab') as'Task'|'Activity'|'Trip'| null
  const dateParam = searchParams.get('date')
  
  const defaultDate = dateParam || format(new Date(),'yyyy-MM-dd')

  if (!quickAdd && !viewTrip && !editActivity) return null

  function handleClose() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('quickAdd')
    params.delete('viewTrip')
    params.delete('editActivity')
    params.delete('tab')
    params.delete('date')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      {(quickAdd || editActivity) && (
        <InlineActivityModal 
          isOpen={true}
          onClose={handleClose}
          defaultDate={defaultDate}
          students={students}
          subjects={subjects}
          activities={activities}
          initialTab={editActivity ? (tab ==='Trip'?'Trip':'Activity') : ((tab ==='Task'?'Activity': tab) ||'Course') as any}
          editId={editActivity}
        />
      )}
      {viewTrip && (
        <TripDetailModal 
          tripId={viewTrip}
          onClose={handleClose}
        />
      )}
    </>
  )
}
