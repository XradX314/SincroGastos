import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const { signIn, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await signIn(email.trim(), password)
  }

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary dark:bg-primary-dark shadow-lg mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 20C8 20 10 14 16 14C22 14 24 20 24 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="16" cy="10" r="3" fill="white" />
              <path d="M6 26H26" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text1 dark:text-text1-dark">GastApp</h1>
          <p className="text-sm text-text2 dark:text-text2-dark mt-1">Control de gastos personales</p>
        </div>

        {/* Tarjeta */}
        <div className="bg-surface dark:bg-surface-dark rounded-2xl shadow-card dark:shadow-card-dark border border-black/[0.06] dark:border-white/[0.06] p-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-text2 dark:text-text2-dark mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={[
                  'w-full px-3 py-2.5 rounded-xl border-2 outline-none transition-all text-sm',
                  'bg-surface-2 dark:bg-surface-2dark text-text1 dark:text-text1-dark',
                  error
                    ? 'border-danger'
                    : 'border-transparent focus:border-primary dark:focus:border-primary-dark',
                ].join(' ')}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-text2 dark:text-text2-dark mb-1.5"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={[
                  'w-full px-3 py-2.5 rounded-xl border-2 outline-none transition-all text-sm',
                  'bg-surface-2 dark:bg-surface-2dark text-text1 dark:text-text1-dark',
                  error
                    ? 'border-danger'
                    : 'border-transparent focus:border-primary dark:focus:border-primary-dark',
                ].join(' ')}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-danger text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className={[
                'w-full py-3 rounded-xl font-semibold text-sm text-white transition-all',
                'bg-primary hover:bg-primary-hover dark:bg-primary-dark dark:hover:bg-primary',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
              ].join(' ')}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
