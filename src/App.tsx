import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom'
import { type ReactNode, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import { ToastProvider } from './components/ui/Toast'
import { CategoriesProvider } from './contexts/CategoriesContext'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Reports } from './pages/Reports'
import { History } from './pages/History'
import { Settings } from './pages/Settings'
import { Modal } from './components/ui/Modal'
import { ExpenseForm } from './components/forms/ExpenseForm'
import { useExpenses } from './hooks/useExpenses'
import { BarChart2, Clock, Moon, Sun, LogOut, Settings2, LayoutDashboard, Plus } from 'lucide-react'

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-bg-dark">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { addExpense } = useExpenses()
  const [formOpen, setFormOpen] = useState(false)

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/reports', icon: BarChart2, label: 'Reportes', end: false },
    { to: '/history', icon: Clock, label: 'Historial', end: false },
    { to: '/settings', icon: Settings2, label: 'Categorías', end: false },
  ]

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface dark:bg-surface-dark border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <div className="bg-[#1c1f2e] rounded-xl px-2 py-0.5 flex items-center">
              <img src="/logo.png" alt="SincroGastos" className="h-7 w-auto" />
            </div>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary dark:bg-primary-dark/10 dark:text-primary-dark'
                        : 'text-text2 dark:text-text2-dark hover:text-text1 dark:hover:text-text1-dark hover:bg-surface-2 dark:hover:bg-surface-2dark'
                    }`
                  }
                >
                  <Icon size={14} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <span className="hidden md:block text-xs text-text2 dark:text-text2-dark">{user?.email}</span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-text2 dark:text-text2-dark hover:bg-surface-2 dark:hover:bg-surface-2dark transition-colors"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={signOut}
              className="p-2 rounded-lg text-text2 dark:text-text2-dark hover:bg-surface-2 dark:hover:bg-surface-2dark transition-colors"
            >
              <LogOut size={16} />
            </button>
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary dark:bg-primary-dark text-white text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Gasto</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="pb-16 sm:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface dark:bg-surface-dark border-t border-black/[0.06] dark:border-white/[0.06] flex">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary dark:text-primary-dark' : 'text-text2 dark:text-text2-dark'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Global expense modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Nuevo gasto" maxWidth="md">
        <ExpenseForm onSubmit={addExpense} onClose={() => setFormOpen(false)} />
      </Modal>
    </div>
  )
}

function AuthenticatedApp() {
  return (
    <CategoriesProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </CategoriesProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AuthenticatedApp />
              </PrivateRoute>
            }
          />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
