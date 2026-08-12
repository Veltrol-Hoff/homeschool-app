import type { Metadata } from"next";
import { Geist, Geist_Mono } from"next/font/google";
import"./globals.css";
import Navigation from"@/components/Navigation";
import GlobalModalManager from"@/components/GlobalModalManager";
import AudioLogger from"@/components/AudioLogger";
import { Suspense } from"react";
import { createClient } from"@/utils/supabase/server";
import fs from 'fs';
import path from 'path';

// Copy the mascot image to be the app icon
try {
  const src = 'C:/Users/ewhof/.gemini/antigravity/brain/0772288e-39e9-4683-a48b-40af064eb763/school_mascot_1785281008493.jpg';
  const dest = path.join(process.cwd(), 'src/app/icon.jpg');
  if (!fs.existsSync(dest) && fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
} catch (e) {
  // Ignore
}

const geistSans = Geist({
  variable:"--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable:"--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Homeschool Planner",
  description: "Manage your homeschool compliance, schedules, and portfolio.",
  icons: {
    icon: [
      { url: '/mascot.jpg', type: 'image/jpeg' }
    ],
    apple: '/mascot.jpg',
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let userRole = null
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('household_role').eq('id', user.id).single()
    userRole = profile?.household_role
  }

  const { data: students } = await supabase.from('students').select('*')
  const { data: subjects } = await supabase.from('subjects').select('*').order('name')
  const { data: activities } = await supabase.from('activities').select('*').order('name')

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navigation students={students || []} userRole={userRole}>
          {children}
          <Suspense fallback={null}>
            <GlobalModalManager students={students || []} subjects={subjects || []} activities={activities || []} />
          </Suspense>
          <AudioLogger />
        </Navigation>
      </body>
    </html>
  );
}
