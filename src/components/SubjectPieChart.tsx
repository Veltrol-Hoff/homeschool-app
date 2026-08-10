export default function SubjectPieChart({ subjectStats }: { subjectStats: any[] }) {
  const totalHours = subjectStats.reduce((sum, stat) => sum + (stat.totalHours || 0), 0)
  
  if (totalHours === 0) {
    return <div className="text-stone-400 text-sm italic text-center p-4">No hours logged yet.</div>
  }

  // Aesthetic color palette for subjects
  const colors = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
    '#84cc16', // lime-500
    '#64748b'  // slate-500
  ]
  
  let currentPercentage = 0
  const activeStats = subjectStats
    .filter(s => s.totalHours > 0)
    .sort((a, b) => b.totalHours - a.totalHours)

  const stops = activeStats.map((stat, i) => {
    const percentage = (stat.totalHours / totalHours) * 100
    const start = currentPercentage
    const end = currentPercentage + percentage
    currentPercentage = end
    return `${colors[i % colors.length]} ${start}% ${end}%`
  })

  const gradient = `conic-gradient(${stops.join(', ')})`

  return (
    <div className="flex flex-col items-center">
      <div 
        className="w-48 h-48 rounded-full shadow-md border-2 border-white"
        style={{ background: gradient }}
      ></div>
      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 justify-center">
        {activeStats.map((stat, i) => (
          <div key={stat.id} className="flex items-center gap-1.5 text-sm text-stone-600">
            <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: colors[i % colors.length] }}></span>
            <span>{stat.name} ({Math.round((stat.totalHours / totalHours) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}
