import { createClient as createServerClient } from'@/utils/supabase/server'
import { createClient as createAdminClient } from'@supabase/supabase-js'
import { redirect } from'next/navigation'
import Link from'next/link'
import InviteForm from'@/components/InviteForm'
import StudentManager from'@/components/StudentManager'
import EditPasswordModal from'@/components/EditPasswordModal'

export default async function AccountManagementPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('household_role')
    .eq('id', user.id)
    .single()

  if (profile?.household_role !=='owner') {
    return (
      <div className="min-h-screen p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p>Only the Owner can access Account Management.</p>
        <Link href="/dashboard"className="text-slate-600 hover:underline mt-4 inline-block">&larr; Back to Dashboard</Link>
      </div>
    )
  }

  // Fetch admin data (requires service role key)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Get all users from auth schema
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
  
  // Get all profiles and join with students
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('*, students(name)')

  // Combine data
  const accounts = profiles?.map(p => {
    const authUser = users?.find(u => u.id === p.id)
    return {
      ...p,
      email: authUser?.email,
      last_sign_in: authUser?.last_sign_in_at
    }
  }) || []

  // Fetch students for the invite form dropdown and StudentManager
  const { data: students } = await supabase.from('students').select('*, academic_years(id, grade_level)').order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-transparent  text-stone-900  p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
          <Link href="/dashboard"className="text-sm text-slate-600 hover:underline">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Account Management</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2">
            <div className="bg-white  rounded-xl shadow-sm border border-stone-100  overflow-hidden">
              <div className="p-4 border-b border-stone-100">
                <h2 className="font-bold text-lg">Family Accounts</h2>
              </div>
              <ul className="divide-y divide-stone-100">
                {accounts.map(account => (
                  <li key={account.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{account.email || account.display_name}</p>
                      <div className="flex gap-3 text-sm mt-1">
                        <span className="text-slate-600  uppercase font-medium tracking-wider text-xs">
                          {account.household_role}
                        </span>
                        {account.students && (
                          <span className="text-stone-500">Linked to: {account.students.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${account.status ==='active'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>
                        {account.status}
                      </span>
                      {account.status ==='invited'&& (
                        <button className="text-xs text-slate-600 hover:underline">Resend Invite</button>
                      )}
                      {account.status ==='active'&& (
                        <EditPasswordModal userId={account.id} userEmail={account.email || account.display_name} />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <StudentManager students={students || []} />
          </div>

          <div>
            <InviteForm students={students || []} />
          </div>

        </div>
      </div>
    </div>
  )
}
