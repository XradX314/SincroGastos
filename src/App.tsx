import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { type ReactNode } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import { ToastProvider } from './components/ui/Toast'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Reports } from './pages/Reports'
import { History } from './pages/History'
import { DollarSign, BarChart2, Clock, Moon, Sun, LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-bg-dark">
        <div className="w-8 h-8 border-3 border-primary-DEFAULT border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark">
      {/* Header global */}
      <header className="sticky top-0 z-30 bg-surface-DEFAULT dark:bg-surface-dark border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-DEFAULT dark:bg-primary-dark flex items-center justify-center">
                <DollarSign size={14} className="text-white" />
              </div>
              <span className="font-bold text-text1-DEFAULT dark:text-text1-dark">GastApp</span>
            </div>

            {/* Navegación */}
            <nav className="hidden sm:flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-DEFAULT/10 text-primary-DEFAULT dark:bg-primary-dark/10 dark:text-primary-dark'
                      : 'text-text2-DEFAULT dark:text-text2-dark hover:text-text1-DEFAULT dark:hover:text-text1-dark hover:bg-surface-2 dark:hover:bg-surface-2dark'
                  }`
                }
              >
                <DollarSign size={14} />
                Dashboard
              </NavLink>
              <NavLink
                to="/reports"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-DEFAULT/10 text-primary-DEFAULT dark:bg-primary-dark/10 dark:text-primary-dark'
                      : 'text-text2-DEFAULT dark:text-text2-dark hover:text-text1-DEFAULT dark:hover:text-text1-dark hover:bg-surface-2 dark:hover:bg-surface-2dark'
                  }`
                }
              >
                <BarChart2 size={14} />
                Reportes
              </NavLink>
              <NavLink
                to="/history"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-DEFAULT/10 text-primary-DEFAULT dark:bg-primary-dark/10 dark:text-primary-dark'
                      : 'text-text2-DEFAULT dark:text-text2-dark hover:text-text1-DEFAULT dark:hover:text-text1-dark hover:bg-surface-2 dark:hover:bg-surface-2dark'
                  }`
                }
              >
                <Clock size={14} />
                Historial
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:block text-xs text-text2-DEFAULT dark:text-text2-dark">
              {user?.email}
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-text2-DEFAULT dark:text-text2-dark hover:bg-surface-2 dark:hover:bg-surface-2dark transition-colors"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={signOut}
              className="p-2 rounded-lg text-text2-DEFAULT dark:text-text2-dark hover:bg-surface-2 dark:hover:bg-surface-2dark transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main>{children}</main>

      {/* Nav mobile bottom */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-DEFAULT dark:bg-surface-dark border-t border-black/[0.06] dark:border-white/[0.06] flex">
        {[
          { to: '/', icon: DollarSign, label: 'Inicio', end: true },
          { to: '/reports', icon: BarChart2, label: 'Reportes', end: false },
          { to: '/history', icon: Clock, label: 'Historial', end: false },
        ].map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-primary-DEFAULT dark:text-primary-dark'
                  : 'text-text2-DEFAULT dark:text-text2-dark'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Reports />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <PrivateRoute>
                <AppLayout>
                  <History />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
