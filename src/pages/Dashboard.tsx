import { useExpenses } from '../hooks/useExpenses'
import { useCategories } from '../contexts/CategoriesContext'
import { KPICard } from '../components/dashboard/KPICard'
import { DonutChart } from '../components/dashboard/DonutChart'
import { BarChart, buildLast6MonthsData } from '../components/dashboard/BarChart'
import { ExpenseList } from '../components/dashboard/ExpenseList'
import { formatARSCompact } from '../lib/categoryData'
import { DollarSign, TrendingDown, Hash, Star } from 'lucide-react'

export function Dashboard() {
  const { expenses, loading, deleteExpense, getMonthExpenses, getCurrentMonthKPIs } = useExpenses()
  const { colorsMap } = useCategories()

  const kpis = getCurrentMonthKPIs()
  const barData = buildLast6MonthsData(getMonthExpenses)

  // Build byCategory from actual expenses (not hardcoded categories)
  const byCategory: Record<string, number> = Object.fromEntries(
    Object.keys(colorsMap).map((name) => [name, 0])
  )
  Object.entries(kpis.byCategory).forEach(([k, v]) => { byCategory[k] = v })

  const trendLabel =
    kpis.trendPct === 0 ? '=0%' : kpis.trendPct > 0 ? `+${kpis.trendPct}%` : `${kpis.trendPct}%`

  const topCatValue = kpis.topCategory !== '—' ? (kpis.byCategory[kpis.topCategory] ?? 0) : 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
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
          subtitle={kpis.topCategory !== '—' ? formatARSCompact(topCatValue) : 'Sin datos'}
          trend="este mes"
          trendPositive={false}
          icon={Star}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DonutChart data={byCategory} />
        <BarChart data={barData} />
      </div>

      {/* Expense list */}
      <ExpenseList expenses={expenses} onDelete={deleteExpense} loading={loading} />
    </div>
  )
}
