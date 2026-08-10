'use client'

type IndicatorStatus ='green'|'yellow'|'red'

function StatusDot({ status, label, tooltip }: { status: IndicatorStatus, label: string, tooltip: string }) {
  const colors = {
    green:'bg-green-500 shadow-green-500/50',
    yellow:'bg-yellow-500 shadow-yellow-500/50',
    red:'bg-red-500 shadow-red-500/50'
  }
  
  return (
    <div className="flex items-center gap-2 group relative"title={tooltip}>
      <div className={`w-3 h-3 rounded-full shadow-sm ${colors[status]}`} />
      <span className="text-sm text-stone-700  font-medium">{label}</span>
      
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-stone-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
        {tooltip}
      </div>
    </div>
  )
}

export default function PacingRadar({ 
  hoursStatus, 
  curriculumStatus,
  hoursDetails,
  curriculumDetails
}: { 
  hoursStatus: IndicatorStatus, 
  curriculumStatus: IndicatorStatus,
  hoursDetails: string,
  curriculumDetails: string
}) {
  return (
    <div className="bg-white  rounded-xl shadow-sm border border-stone-100  p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500  mb-3">Pacing Radar</h3>
      <div className="flex flex-col gap-3">
        <StatusDot 
          status={hoursStatus} 
          label="State Hours (875)"
          tooltip={hoursDetails} 
        />
        <StatusDot 
          status={curriculumStatus} 
          label="Curriculum Progress"
          tooltip={curriculumDetails} 
        />
      </div>
    </div>
  )
}
