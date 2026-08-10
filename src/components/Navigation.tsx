'use client'

import { useState } from'react'
import Link from'next/link'
import { usePathname } from'next/navigation'
import * as LucideIcons from'lucide-react'

export default function Navigation({ children, students = [], userRole }: { children: React.ReactNode, students?: any[], userRole?: string | null }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  if (pathname ==='/login') {
    return <>{children}</>
  }

  const mainLinks = [
    { href:'/dashboard', label:'Dashboard', icon: <LucideIcons.LayoutDashboard size={20} /> },
    { href:'/calendar', label:'Calendar', icon: <LucideIcons.CalendarDays size={20} /> },
    { href:'/transcripts', label:'Transcripts', icon: <LucideIcons.GraduationCap size={20} /> },
    { href:'/export', label:'Portfolio', icon: <LucideIcons.FileText size={20} /> },
  ]

  const settingsLinks = [
    { href:'/curriculum', label:'Curriculum', icon: <LucideIcons.BookOpen size={20} /> },
    { href:'/settings/subjects', label:'Subjects', icon: <LucideIcons.Palette size={20} /> },
    { href:'/settings/activities', label:'Activities', icon: <LucideIcons.Dumbbell size={20} /> },
    { href:'/settings/students', label:'Students', icon: <LucideIcons.Users size={20} /> },
    { href:'/settings/holidays', label:'Holidays', icon: <LucideIcons.Palmtree size={20} /> },
    { href:'/settings/account', label:'Account', icon: <LucideIcons.UserCog size={20} /> },
    { href:'/compliance', label:'Compliance', icon: <LucideIcons.ClipboardList size={20} /> },
  ]

  return (
    <div className="flex h-screen bg-[#F7F3E7]">
      {/* Mobile nav header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-20 bg-[#F7F3E7] border-b border-stone-200  flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2 h-full py-2">
          <img src="/logo.png"alt="Logo"className="h-full w-auto max-w-[200px] object-contain"/>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-stone-600">
          {isOpen ? <LucideIcons.X size={28} /> : <LucideIcons.Menu size={28} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 w-72 bg-[#F7F3E7] border-r border-stone-200  z-30 transition-transform duration-300 ease-in-out ${isOpen ?'translate-x-0':'-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="h-64 hidden md:flex items-center justify-center p-4 border-b border-stone-200  bg-[#F7F3E7]">
            <img src="/logo.png"alt="Logo"className="w-full h-full object-contain"/>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            
            <div>
              <p className="px-2 text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Main</p>
              <div className="space-y-1">
                {mainLinks.map(l => {
                  const isActive = pathname.startsWith(l.href) && l.href !=='/dashboard'|| pathname === l.href
                  return (
                    <div key={l.href}>
                      <Link 
                        href={l.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive ?'bg-slate-800 text-white shadow-sm':'text-stone-800  hover:bg-slate-200  hover:text-slate-900'
                        }`}
                      >
                        {l.icon}
                        <span className="font-medium text-sm">{l.label}</span>
                      </Link>
                      
                      {/* Render student sub-links under Dashboard */}
                      {l.href ==='/dashboard'&& students.length > 0 && (
                        <div className="ml-7 mt-1 pl-4 border-l-2 border-stone-300  space-y-1">
                          {students.map(student => {
                            const isStudentActive = pathname === `/student/${student.id}`
                            return (
                              <Link
                                key={student.id}
                                href={`/student/${student.id}`}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                                  isStudentActive ?'text-slate-900  font-bold bg-slate-200/50':'text-stone-700  hover:text-slate-900  hover:bg-slate-200/50'
                                }`}
                              >
                                {student.name}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {userRole !== 'student' && (
              <div>
                <p className="px-2 text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Settings</p>
                <div className="space-y-1">
                  {settingsLinks.map(l => {
                    const isActive = pathname.startsWith(l.href)
                    return (
                      <Link 
                        key={l.href} 
                        href={l.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive ?'bg-slate-800 text-white shadow-sm':'text-stone-800  hover:bg-slate-200  hover:text-slate-900'
                        }`}
                      >
                        {l.icon}
                        <span className="font-medium text-sm">{l.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

          </nav>
          <div className="p-4 border-t border-stone-300">
            <form action="/auth/signout"method="post">
              <button type="submit"className="w-full flex items-center gap-3 px-3 py-2 text-sm text-stone-700  hover:text-stone-900  transition-colors rounded-md hover:bg-stone-200">
                <LucideIcons.LogOut size={20} />
                <span className="font-medium">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 bg-[#F7F3E7]">
        {children}
      </main>
      
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
