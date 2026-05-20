import { useCallback } from 'react'
import { CATEGORY_NAMES } from '../lib/categoryData'
import type { AnnualReport, CategoryName, CategoryReport, Expense, SubcategoryRow } from '../types'

export function useReports(expenses: Expense[]) {
  const getAnnualReport = useCallback(
    (year: number): AnnualReport => {
      const yearExpenses = expenses.filter((e) => {
        const d = new Date(e.fecha + 'T00:00:00')
        return d.getFullYear() === year
      })

      const monthTotals = Array(12).fill(0) as number[]
      yearExpenses.forEach((e) => {
        const m = new Date(e.fecha + 'T00:00:00').getMonth()
        monthTotals[m] += e.importe
      })

      const grandTotal = monthTotals.reduce((s, v) => s + v, 0)

      const categories: CategoryReport[] = CATEGORY_NAMES.map((cat) => {
        const catExpenses = yearExpenses.filter((e) => e.categoria === cat)
        const catMonths = Array(12).fill(0) as number[]
        catExpenses.forEach((e) => {
          const m = new Date(e.fecha + 'T00:00:00').getMonth()
          catMonths[m] += e.importe
        })
        const catTotal = catMonths.reduce((s, v) => s + v, 0)

        // Agrupar subcategorías
        const subMap = new Map<string, number[]>()
        catExpenses.forEach((e) => {
          if (!subMap.has(e.subcategoria)) {
            subMap.set(e.subcategoria, Array(12).fill(0) as number[])
          }
          const months = subMap.get(e.subcategoria)!
          const m = new Date(e.fecha + 'T00:00:00').getMonth()
          months[m] += e.importe
        })

        const subcategories: SubcategoryRow[] = Array.from(subMap.entries()).map(
          ([sub, months]) => {
            const subTotal = months.reduce((s, v) => s + v, 0)
            return {
              subcategoria: sub,
              months,
              total: subTotal,
              percentage: grandTotal > 0 ? (subTotal / grandTotal) * 100 : 0,
            }
          },
        ).sort((a, b) => b.total - a.total)

        return {
          categoria: cat as CategoryName,
          months: catMonths,
          total: catTotal,
          percentage: grandTotal > 0 ? (catTotal / grandTotal) * 100 : 0,
          subcategories,
        }
      })

      return { year, categories, monthTotals, grandTotal }
    },
    [expenses],
  )

  const getAvailableYears = useCallback((): number[] => {
    const years = new Set<number>()
    expenses.forEach((e) => {
      years.add(new Date(e.fecha + 'T00:00:00').getFullYear())
    })
    if (years.size === 0) years.add(new Date().getFullYear())
    return Array.from(years).sort((a, b) => b - a)
  }, [expenses])

  return { getAnnualReport, getAvailableYears }
}
