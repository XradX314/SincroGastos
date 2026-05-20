import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CATEGORIES, CATEGORY_COLORS } from '../lib/categoryData'

export interface CategoryRow {
  id: string
  nombre: string
  subcategorias: string[]
  color: string
  orden: number
}

interface CategoriesContextType {
  categories: CategoryRow[]
  categoriesMap: Record<string, string[]>
  colorsMap: Record<string, string>
  loading: boolean
  addCategory: (nombre: string, color: string) => Promise<{ error: string | null }>
  updateCategory: (id: string, updates: Partial<Omit<CategoryRow, 'id'>>) => Promise<{ error: string | null }>
  deleteCategory: (id: string) => Promise<{ error: string | null }>
  refresh: () => Promise<void>
}

const CategoriesContext = createContext<CategoriesContextType | null>(null)

const DEFAULT_SEEDS = Object.entries(CATEGORIES).map(([nombre, subcategorias], i) => ({
  nombre,
  subcategorias,
  color: CATEGORY_COLORS[nombre] ?? '#6B7280',
  orden: i,
}))

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('orden', { ascending: true })

    if (!error && data && data.length > 0) {
      setCategories(data as CategoryRow[])
      setLoading(false)
      return
    }

    // First-time user: seed defaults
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const rows = DEFAULT_SEEDS.map((s) => ({ ...s, user_id: user.id }))
    const { data: seeded } = await supabase.from('categories').insert(rows).select()
    setCategories((seeded ?? []) as CategoryRow[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const categoriesMap = Object.fromEntries(categories.map((c) => [c.nombre, c.subcategorias]))
  const colorsMap = Object.fromEntries(categories.map((c) => [c.nombre, c.color]))

  const addCategory = async (nombre: string, color: string): Promise<{ error: string | null }> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }
    const { error } = await supabase.from('categories').insert({
      user_id: user.id,
      nombre,
      subcategorias: [],
      color,
      orden: categories.length,
    })
    if (error) return { error: error.message }
    await fetchCategories()
    return { error: null }
  }

  const updateCategory = async (
    id: string,
    updates: Partial<Omit<CategoryRow, 'id'>>,
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.from('categories').update(updates).eq('id', id)
    if (error) return { error: error.message }
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    return { error: null }
  }

  const deleteCategory = async (id: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) return { error: error.message }
    setCategories((prev) => prev.filter((c) => c.id !== id))
    return { error: null }
  }

  return (
    <CategoriesContext.Provider
      value={{ categories, categoriesMap, colorsMap, loading, addCategory, updateCategory, deleteCategory, refresh: fetchCategories }}
    >
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  const ctx = useContext(CategoriesContext)
  if (!ctx) throw new Error('useCategories must be used within CategoriesProvider')
  return ctx
}
