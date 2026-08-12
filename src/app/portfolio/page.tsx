import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import PortfolioGrid from './PortfolioGrid'
import PortfolioFilters from './PortfolioFilters'

export default async function PortfolioPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ tab?: string, student?: string, year?: string, subject?: string }> 
}) {
  const params = await searchParams
  const activeTab = params.tab || 'portfolio'
  const filterStudentId = params.student
  const filterYearId = params.year
  const filterSubjectId = params.subject

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Check role to determine edit permissions
  const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
  const canEdit = profile?.household_role === 'owner' || profile?.household_role === 'co-owner'

  // Fetch reference data for filters
  const [
    { data: students },
    { data: academicYears },
    { data: subjects }
  ] = await Promise.all([
    supabase.from('students').select('*').order('name'),
    supabase.from('academic_years').select('*').order('start_date', { ascending: false }),
    supabase.from('subjects').select('*').order('name')
  ])
  
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
      is_portfolio_sample,
      caption,
      daily_logs!left (
        date,
        notes,
        student_id,
        academic_year_id,
        subject_id,
        subjects (name)
      ),
      trips!left (
        title,
        start_date,
        trip_students (student_id),
        trip_subjects (subject_id)
      )
    `)
    .order('created_at', { ascending: false })

  if (activeTab === 'portfolio') {
    query = query.eq('is_portfolio_sample', true)
  }

  // Client-side filtering logic below (Supabase deep OR/AND filtering with left joins is tricky, 
  // so we'll fetch then filter in JS since portfolios usually aren't tens of thousands of items, 
  // or we'd need complex PostgREST RPC)
  let { data: allSamples, error } = await query

  if (error) {
    // If the error is because the 'caption' column is missing, try a fallback query
    if (error.message?.includes('caption')) {
      console.log("Caption column missing, falling back to query without caption...")
      let fallbackQuery = supabase
        .from('media_attachments')
        .select(`
          id, 
          file_url, 
          created_at,
          log_id,
          trip_id,
          is_portfolio_sample,
          daily_logs!left (
            date,
            notes,
            student_id,
            academic_year_id,
            subject_id,
            subjects (name)
          ),
          trips!left (
            title,
            start_date,
            trip_students (student_id)
          )
        `)
        .order('created_at', { ascending: false })

      if (activeTab === 'portfolio') {
        fallbackQuery = fallbackQuery.eq('is_portfolio_sample', true)
      }

      const fallbackRes = await fallbackQuery
      allSamples = fallbackRes.data as any
      error = fallbackRes.error
      
      if (error) {
        console.error("Error fetching portfolio (fallback):", error)
      }
    } else {
      console.error("Error fetching portfolio:", error)
      // If it still failed, maybe it's trip_subjects missing? We can do one more ultra-safe fallback
      let safeQuery = supabase
        .from('media_attachments')
        .select(`
          id, 
          file_url, 
          created_at,
          log_id,
          trip_id,
          is_portfolio_sample,
          daily_logs!left (
            date,
            notes,
            student_id,
            academic_year_id,
            subject_id,
            subjects (name)
          ),
          trips!left (
            title,
            start_date,
            trip_students (student_id)
          )
        `)
        .order('created_at', { ascending: false })
        
      if (activeTab === 'portfolio') {
        safeQuery = safeQuery.eq('is_portfolio_sample', true)
      }
      
      const safeRes = await safeQuery
      allSamples = safeRes.data as any
    }
  }

  // Filter in memory based on params
  let portfolioSamples: any[] = allSamples || []

  if (filterStudentId) {
    portfolioSamples = portfolioSamples.filter(sample => {
      if (sample.daily_logs) {
        return sample.daily_logs.student_id === filterStudentId
      } else if (sample.trips?.trip_students) {
        return sample.trips.trip_students.some((ts: any) => ts.student_id === filterStudentId)
      }
      return false
    })
  }

  if (filterYearId) {
    const selectedYear = academicYears?.find(y => y.id === filterYearId)
    if (selectedYear) {
      portfolioSamples = portfolioSamples.filter(sample => {
        if (sample.daily_logs) {
          return sample.daily_logs.academic_year_id === filterYearId
        } else if (sample.trips?.start_date) {
          // Fallback to checking if trip date falls within academic year
          return sample.trips.start_date >= selectedYear.start_date && sample.trips.start_date <= selectedYear.end_date
        }
        return false
      })
    }
  }

  if (filterSubjectId) {
    portfolioSamples = portfolioSamples.filter(sample => {
      if (sample.daily_logs) {
        return sample.daily_logs.subject_id === filterSubjectId
      } else if (sample.trips?.trip_subjects) {
        return sample.trips.trip_subjects.some((ts: any) => ts.subject_id === filterSubjectId)
      }
      return false
    })
  }

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
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
          href={`/portfolio?tab=portfolio${filterStudentId ? `&student=${filterStudentId}` : ''}${filterYearId ? `&year=${filterYearId}` : ''}${filterSubjectId ? `&subject=${filterSubjectId}` : ''}`}
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
          href={`/portfolio?tab=all${filterStudentId ? `&student=${filterStudentId}` : ''}${filterYearId ? `&year=${filterYearId}` : ''}${filterSubjectId ? `&subject=${filterSubjectId}` : ''}`}
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

      <PortfolioFilters 
        students={students || []}
        academicYears={academicYears || []}
        subjects={subjects || []}
        activeTab={activeTab}
      />

      {!portfolioSamples || portfolioSamples.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-stone-200 p-12 text-center">
          <LucideIcons.Image size={48} className="mx-auto text-stone-300 mb-4" />
          <h3 className="text-xl font-bold text-stone-700 mb-2">No media found</h3>
          <p className="text-stone-500 max-w-md mx-auto">
            {activeTab === 'portfolio' 
              ? "No starred portfolio items match your filters. Click the star on media attached to daily logs to feature them here."
              : "No media uploads match your filters."}
          </p>
        </div>
      ) : (
        <PortfolioGrid 
          samples={portfolioSamples} 
          students={students || []} 
          canEdit={canEdit}
        />
      )}
    </div>
  )
}
