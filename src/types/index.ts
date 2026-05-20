export type CategoryName = 'Casa' | 'Hijo 1' | 'Hijo 2' | 'Hijo 3' | 'Yo' | 'Otros'
export type ExpenseOrigin = 'web' | 'excel'

export interface Expense {
  id: string
  user_id: string
  categoria: CategoryName
  subcategoria: string
  fecha: string       // ISO date "YYYY-MM-DD"
  detalle: string | null
  importe: number
  origen: ExpenseOrigin
  hash_unico: string
  created_at: string
  updated_at: string
}

export interface ExpenseInput {
  categoria: CategoryName
  subcategoria: string
  fecha: string
  detalle?: string
  importe: number
  origen?: ExpenseOrigin
}

export interface Category {
  name: CategoryName
  subcategories: string[]
  color: string
  icon: string
}

export interface SubCategory {
  name: string
  parentCategory: CategoryName
}

export interface MonthlyTotal {
  month: number       // 1-12
  year: number
  total: number
  byCategory: Record<CategoryName, number>
}

export interface SubcategoryRow {
  subcategoria: string
  months: number[]    // índice 0-11
  total: number
  percentage: number
}

export interface CategoryReport {
  categoria: CategoryName
  months: number[]
  total: number
  percentage: number
  subcategories: SubcategoryRow[]
}

export interface AnnualReport {
  year: number
  categories: CategoryReport[]
  monthTotals: number[]
  grandTotal: number
}

export interface MonthlyReport {
  year: number
  month: number
  expenses: Expense[]
  total: number
  byCategory: Record<CategoryName, number>
  bySubcategory: Record<string, number>
}

export interface User {
  id: string
  email: string
  created_at: string
}

export interface SyncResult {
  uploaded: number
  downloaded: number
  conflicts: number
  errors: string[]
  timestamp: string
}

export interface KPI {
  title: string
  value: string
  subtitle: string
  trend: string
  trendPositive: boolean
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}
