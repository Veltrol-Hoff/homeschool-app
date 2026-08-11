import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import { format } from 'date-fns'
import MediaActions from './MediaActions'

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams
  const activeTab = params.tab || 'portfolio'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: students } = await supabase.from('students').select('*')
  
  // Fetch media attachments
  // Left join to both daily_logs and trips
  let query = supabase
    .from('media_attachments')
    .select(`
      id, 
      file_url, 
      created_at,
      log_id,
      trip_id,
      daily_logs (
        date,
        notes,
        subjects (name)
      ),
      trips (
        title,
        start_date
      )
    `)
    .order('created_at', { ascending: false })

  if (activeTab === 'portfolio') {
    query = query.eq('is_portfolio_sample', true)
  }

  const { data: portfolioSamples, error } = await query

  if (error) {
    console.error("Error fetching portfolio:", error)
  }

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      
      <div className="flex justify-between items-center">
        <div>
          <Link href="/dashboard" className="text-sm text-slate-600 hover:underline mb-2 inline-block">
            &larr; Dashboard
          </Link>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight flex items-center gap-3">
            <LucideIcons.Star className="text-yellow-500 fill-yellow-500 w-8 h-8" />
            Student Portfolio
          </h1>
          <p className="text-stone-500 mt-2">A curated collection of your best work and memories.</p>
        </div>
      </div>

      <div className="flex border-b border-stone-200">
        <Link 
          href="/portfolio?tab=portfolio"
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'portfolio'
              ? 'border-slate-500 text-slate-600'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <LucideIcons.Star size={16} />
          Starred Portfolio
        </Link>
        <Link 
          href="/portfolio?tab=all"
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-slate-500 text-slate-600'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <LucideIcons.Images size={16} />
          All Uploads
        </Link>
      </div>

      {!portfolioSamples || portfolioSamples.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-stone-200 p-12 text-center">
          <LucideIcons.Image size={48} className="mx-auto text-stone-300 mb-4" />
          <h3 className="text-xl font-bold text-stone-700 mb-2">No media found</h3>
          <p className="text-stone-500 max-w-md mx-auto">
            {activeTab === 'portfolio' 
              ? "When you attach media to daily logs or trips, you can click the star icon to highlight it as a portfolio sample. It will appear here!"
              : "You haven't uploaded any media yet. Attach files to your daily logs or trips to see them here."}
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {portfolioSamples.map((sample: any) => {
            const isImage = sample.file_url.match(/\.(jpeg|jpg|gif|png|webp)$/i)
            const date = sample.daily_logs?.date || sample.trips?.start_date || sample.created_at
            const title = sample.daily_logs ? (sample.daily_logs.notes || sample.daily_logs.subjects?.name || 'Daily Log') : (sample.trips?.title || 'Trip')
            
            return (
              <div key={sample.id} className="relative break-inside-avoid bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden group hover:shadow-md transition-shadow">
                
                <MediaActions 
                  mediaId={sample.id} 
                  isPortfolioSample={sample.is_portfolio_sample} 
                  fileUrl={sample.file_url} 
                />

                {isImage ? (
                  <a href={sample.file_url} target="_blank" rel="noopener noreferrer" className="block relative">
                    <img src={sample.file_url} alt="Portfolio item" className="w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </a>
                ) : (
                  <a href={sample.file_url} target="_blank" rel="noopener noreferrer" className="w-full aspect-video bg-stone-100 flex flex-col items-center justify-center p-4 hover:bg-stone-200 transition-colors block relative">
                    <LucideIcons.FileText size={48} className="text-stone-400 mb-2" />
                    <span className="text-sm font-medium text-stone-600 truncate w-full text-center">
                      Document
                    </span>
                  </a>
                )}
                <div className="p-4 bg-white border-t border-stone-100 relative z-10">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-stone-800 text-sm line-clamp-1">{title}</h3>
                    {sample.is_portfolio_sample && (
                      <LucideIcons.Star size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-stone-500 font-medium">
                    {format(new Date(date), 'MMM d, yyyy')}
                  </p>
                  {sample.daily_logs?.subjects?.name && (
                    <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                      {sample.daily_logs.subjects.name}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
