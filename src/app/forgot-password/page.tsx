import { resetPassword } from './actions'
import Link from 'next/link'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string, error?: string }>
}) {
  const params = await searchParams
  const errorMessage = params.error
  const successMessage = params.message

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#F7F3E7] py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-2 px-4">
          <img src="/logo.png" alt="Logo" className="w-full max-w-[280px] h-auto object-contain" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-stone-900">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-stone-600">
          Enter your email and we will send you a reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow-xl sm:rounded-lg sm:px-10 border border-stone-100">
          <form className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm placeholder-stone-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-md bg-red-50 p-4 border border-red-100">
                <h3 className="text-sm font-medium text-red-800">{errorMessage}</h3>
              </div>
            )}

            {successMessage && (
              <div className="rounded-md bg-green-50 p-4 border border-green-100">
                <h3 className="text-sm font-medium text-green-800">{successMessage}</h3>
              </div>
            )}

            <div>
              <button
                formAction={resetPassword}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
              >
                Send Reset Link
              </button>
            </div>
            
            <div className="text-center mt-4">
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-500">
                &larr; Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
