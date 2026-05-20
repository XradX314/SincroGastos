import { useState } from 'react'
import { BarChart2 } from 'lucide-react'
import { useExpenses } from '../hooks/useExpenses'
import { useReports } from '../hooks/useReports'
import { ReportTable } from '../components/reports/ReportTable'
import { Card } from '../components/ui/Card'

export function Reports() {
  const { expenses, loading } = useExpenses()
  const { getAnnualReport, getAvailableYears } = useReports(expenses)
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const years = getAvailableYears()
  const report = getAnnualReport(selectedYear)
  const hasData = report.grandTotal > 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary-dark/10">
            <BarChart2 size={20} className="text-primary dark:text-primary-dark" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text1 dark:text-text1-dark">Reporte Anual</h1>
            <p className="text-sm text-text2 dark:text-text2-dark">Vista completa por categoría y mes</p>
          </div>
        </div>

        {/* Selector de año */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-3 py-2 rounded-xl bg-surface-2 dark:bg-surface-2dark border-2 border-transparent focus:border-primary dark:focus:border-primary-dark outline-none text-sm font-medium text-text1 dark:text-text1-dark transition-all"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Contenido */}
      {loading ? (
        <Card className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </Card>
      ) : !hasData ? (
        <Card className="flex flex-col items-center justify-center h-64 gap-3">
          <BarChart2 size={40} className="text-text2 dark:text-text2-dark opacity-40" />
          <p className="text-text2 dark:text-text2-dark text-sm">
            No hay gastos registrados para {selectedYear}
          </p>
        </Card>
      ) : (
        <ReportTable report={report} />
      )}
    </div>
  )
}
