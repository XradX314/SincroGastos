import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { generateHash } from '../lib/hashUtils'
import type { CategoryName, Expense, ExpenseInput } from '../types'

interface ExpensesState {
  expenses: Expense[]
  loading: boolean
  error: string | null
}

export function useExpenses() {
  const [state, setState] = useState<ExpensesState>({
    expenses: [],
    loading: true,
    error: null,
  })

  const fetchExpenses = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('fecha', { ascending: false })

    if (error) {
      setState((s) => ({ ...s, loading: false, error: error.message }))
      return
    }
    setState({ expenses: (data ?? []) as Expense[], loading: false, error: null })
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const addExpense = async (input: ExpenseInput): Promise<{ error: string | null }> => {
    const hash = await generateHash(input)
    const { error } = await supabase.from('expenses').insert({
      categoria: input.categoria,
      subcategoria: input.subcategoria,
      fecha: input.fecha,
      detalle: input.detalle ?? null,
      importe: input.importe,
      origen: input.origen ?? 'web',
      hash_unico: hash,
    })
    if (error) return { error: error.message }
    await fetchExpenses()
    return { error: null }
  }

  const updateExpense = async (
    id: string,
    data: Partial<ExpenseInput>,
  ): Promise<{ error: string | null }> => {
    const current = state.expenses.find((e) => e.id === id)
    if (!current) return { error: 'Gasto no encontrado' }

    const merged: ExpenseInput = {
      categoria: data.categoria ?? current.categoria,
      subcategoria: data.subcategoria ?? current.subcategoria,
      fecha: data.fecha ?? current.fecha,
      detalle: data.detalle !== undefined ? data.detalle : (current.detalle ?? undefined),
      importe: data.importe ?? current.importe,
    }

    const hash = await generateHash(merged)
    const { error } = await supabase
      .from('expenses')
      .update({ ...merged, hash_unico: hash })
      .eq('id', id)

    if (error) return { error: error.message }
    await fetchExpenses()
    return { error: null }
  }

  const deleteExpense = async (id: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) return { error: error.message }
    await fetchExpenses()
    return { error: null }
  }

  const getMonthExpenses = useCallback(
    (year: number, month: number): Expense[] => {
      return state.expenses.filter((e) => {
        const d = new Date(e.fecha + 'T00:00:00')
        return d.getFullYear() === year && d.getMonth() + 1 === month
      })
    },
    [state.expenses],
  )

  const getCurrentMonthKPIs = useCallback(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const current = getMonthExpenses(year, month)
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const previous = getMonthExpenses(prevYear, prevMonth)

    const totalCurrent = current.reduce((s, e) => s + e.importe, 0)
    const totalPrevious = previous.reduce((s, e) => s + e.importe, 0)

    const trendPct =
      totalPrevious === 0
        ? 0
        : Math.round(((totalCurrent - totalPrevious) / totalPrevious) * 100)

    const byCategory: Record<string, number> = {}
    current.forEach((e) => {
      byCategory[e.categoria] = (byCategory[e.categoria] ?? 0) + e.importe
    })

    const topCategory =
      Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

    return {
      totalCurrent,
      totalPrevious,
      trendPct,
      count: current.length,
      topCategory: topCategory as CategoryName | '—',
      byCategory,
    }
  }, [getMonthExpenses])

  return {
    expenses: state.expenses,
    loading: state.loading,
    error: state.error,
    addExpense,
    updateExpense,
    deleteExpense,
    getMonthExpenses,
    getCurrentMonthKPIs,
    refresh: fetchExpenses,
  }
}
