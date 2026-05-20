import { useState } from 'react'
import { Plus, Moon, Sun, LogOut, DollarSign, TrendingDown, Hash, Star } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useExpenses } from '../hooks/useExpenses'
import { useTheme } from '../hooks/useTheme'
import { KPICard } from '../components/dashboard/KPICard'
import { DonutChart } from '../components/dashboard/DonutChart'
import { BarChart, buildLast6MonthsData } from '../components/dashboard/BarChart'
import { ExpenseList } from '../components/dashboard/ExpenseList'
import { Modal } from '../components/ui/Modal'
import { ExpenseForm } from '../components/forms/ExpenseForm'
import { formatARSCompact } from '../lib/categoryData'
import type { CategoryName } from '../types'

const EMPTY_BY_CATEGORY: Record<CategoryName, number> = {
  'Casa': 0, 'Hijo 1': 0, 'Hijo 2': 0, 'Hijo 3': 0, 'Yo': 0, 'Otros': 0,
}

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { expenses, loading, addExpense, deleteExpense, getMonthExpenses, getCurrentMonthKPIs } = useExpenses()
  const { theme, toggleTheme } = useTheme()
  const [formOpen, setFormOpen] = useState(false)

  const kpis = getCurrentMonthKPIs()
  const barData = buildLast6MonthsData(getMonthExpenses)

  const byCategory: Record<CategoryName, number> = {
    ...EMPTY_BY_CATEGORY,
    ...(kpis.byCategory as Record<CategoryName, number>),
  }

  const trendLabel =
    kpis.trendPct === 0
      ? '=0%'
      : kpis.trendPct > 0
        ? `+${kpis.trendPct}%`
        : `${kpis.trendPct}%`

  const handleDelete = async (id: string) => {
    await deleteExpense(id)
  }

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface-DEFAULT dark:bg-surface-dark border-b border-black/[0.06] dark:border-white/[0.06] backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary-DEFAULT dark:bg-primary-dark flex items-center justify-center">
              <DollarSign size={14} className="text-white" />
            </div>
            <span className="font-bold text-text1-DEFAULT dark:text-text1-dark">GastApp</span>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-text2-DEFAULT dark:text-text2-dark mr-1">
              {user?.email}
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-text2-DEFAULT dark:text-text2-dark hover:bg-surface-2 dark:hover:bg-surface-2dark transition-colors"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={signOut}
              className="p-2 rounded-lg text-text2-DEFAULT dark:text-text2-dark hover:bg-surface-2 dark:hover:bg-surface-2dark transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-DEFAULT dark:bg-primary-dark text-white text-sm font-medium hover:bg-primary-hover transition-colors ml-1"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Gasto</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            title="Gasto del mes"
            value={formatARSCompact(kpis.totalCurrent)}
            subtitle={`Anterior: ${formatARSCompact(kpis.totalPrevious)}`}
            trend={trendLabel}
            trendPositive={kpis.trendPct <= 0}
            icon={DollarSign}
          />
          <KPICard
            title="Vs. mes anterior"
            value={trendLabel}
            subtitle={kpis.trendPct <= 0 ? 'Gastás menos 🎉' : 'Gastás más'}
            trend={trendLabel}
            trendPositive={kpis.trendPct <= 0}
            icon={TrendingDown}
          />
          <KPICard
            title="Movimientos"
            value={String(kpis.count)}
            subtitle="Gastos este mes"
            trend={kpis.count > 0 ? `+${kpis.count}` : '0'}
            trendPositive={true}
            icon={Hash}
          />
          <KPICard
            title="Categoría top"
            value={kpis.topCategory}
            subtitle={kpis.topCategory !== '—' ? formatARSCompact(byCategory[kpis.topCategory as CategoryName] ?? 0) : 'Sin datos'}
            trend="este mes"
            trendPositive={false}
            icon={Star}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DonutChart data={byCategory} />
          <BarChart data={barData} />
        </div>

        {/* Lista de gastos */}
        <ExpenseList expenses={expenses} onDelete={handleDelete} loading={loading} />
      </main>

      {/* Modal de nuevo gasto */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Nuevo gasto" maxWidth="md">
        <ExpenseForm
          onSubmit={addExpense}
          onClose={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  )
}
