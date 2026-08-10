import { type NextRequest } from'next/server'
import { updateSession } from'@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/trips|api/clean|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
