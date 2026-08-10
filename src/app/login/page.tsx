import { login, signup } from'./actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorMessage = params.error

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#F7F3E7] py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-2 px-4">
          <img src="/logo.png" alt="Logo" className="w-full max-w-[280px] h-auto object-contain" />
        </div>
        <p className="mt-2 text-center text-sm text-stone-600">
          Sign in or create an account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow-xl sm:rounded-lg sm:px-10  border border-stone-100">
          <form className="space-y-6">
            <div>
              <label
                htmlFor="display_name"
                className="block text-sm font-medium text-stone-700"
              >
                Display Name <span className="text-stone-400 font-normal">(only required for signup)</span>
              </label>
              <div className="mt-1">
                <input
                  id="display_name"
                  name="display_name"
                  type="text"
                  placeholder="Your Name"
                  className="appearance-none block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm placeholder-stone-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-stone-700"
              >
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

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-stone-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm placeholder-stone-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {errorMessage}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                formAction={login}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
              >
                Sign in
              </button>
              <button
                formAction={signup}
                className="w-full flex justify-center py-2 px-4 border border-stone-300 rounded-md shadow-sm text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500     transition-colors"
              >
                Sign up
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-stone-500">
            Need help? Contact <a href="mailto:ehoffmann@veltrol.com" className="text-slate-600 hover:underline">ehoffmann@veltrol.com</a> or visit <a href="https://veltrol.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:underline">veltrol.com</a>.
          </div>
        </div>
      </div>
    </div>
  )
}
