const fs = require('fs');

const filePath = 'src/app/settings/account/AccountManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add import
if (!content.includes('import EditPasswordModal')) {
  content = content.replace(
    "import { createClient } from '@/utils/supabase/client'",
    "import { createClient } from '@/utils/supabase/client'\nimport EditPasswordModal from '@/components/EditPasswordModal'"
  );
}

// Check if current user is owner
if (!content.includes('const isOwner =')) {
  content = content.replace(
    "export default function AccountManager({ profiles, currentUserId }: { profiles: any[], currentUserId: string }) {",
    "export default function AccountManager({ profiles, currentUserId }: { profiles: any[], currentUserId: string }) {\n  const currentUserProfile = profiles.find(p => p.id === currentUserId)\n  const isOwner = currentUserProfile?.household_role === 'owner'"
  );
}

// Remove old password change logic in handleUpdateProfile
const oldPasswordChange = `    // Update password if current user
    if (id === currentUserId && password) {
      if (password !== passwordConfirm) {
        setStatus("Passwords do not match!")
        return
      }
      const { error: authError } = await supabase.auth.updateUser({ password })
      if (authError) {
        setStatus(\`Error updating password: \${authError.message}\`)
        return
      }
    }`;

content = content.replace(oldPasswordChange, "");

// Remove old password UI
const oldPasswordUI = `{profile.id === currentUserId ? (
                  <div className="pt-2 border-t border-stone-200">
                    <label className="block text-xs font-semibold mb-2 text-stone-500">Change Password</label>
                    <div className="space-y-2">
                      <input type="password" placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 text-sm" />
                      <input type="password" placeholder="Confirm Password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} className="w-full rounded-md border-stone-300 shadow-sm focus:border-slate-500  p-2 text-sm" />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic pt-2">Password can only be changed by the user themselves.</p>
                )}`;

content = content.replace(oldPasswordUI, "");

// Add EditPasswordModal
const oldRoleBadge = `                    <span className={\`px-2 py-0.5 rounded font-medium capitalize \${
                      profile.household_role === 'owner' ? 'bg-purple-100 text-purple-700' :
                      profile.household_role === 'co-owner' ? 'bg-blue-100 text-blue-700' :
                      'bg-stone-100 text-stone-700'
                    }\`}>
                      {profile.household_role}
                    </span>`;

const newRoleBadge = `${oldRoleBadge}\n                    {isOwner && (\n                      <EditPasswordModal userId={profile.id} userEmail={profile.display_name || 'User'} />\n                    )}`;

content = content.replace(oldRoleBadge, newRoleBadge);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated AccountManager.tsx');
