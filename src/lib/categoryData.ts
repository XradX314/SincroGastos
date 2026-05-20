import type { CategoryName } from '../types'

export const CATEGORIES: Record<CategoryName, string[]> = {
  'Casa': [
    'Servicios',
    'Farmacia',
    'Mejoras',
    'Expensas',
    'Impuestos',
    'Supermercado',
  ],
  'Hijo 1': [
    'Empleada',
    'Escuela',
    'Club',
    'Natación',
    'Inglés',
    'Ocio',
    'Tienda',
  ],
  'Hijo 2': [
    'Empleada',
    'Escuela',
    'Club',
    'Natación',
    'Inglés',
    'Ocio',
    'Tienda',
  ],
  'Hijo 3': [
    'Empleada',
    'Escuela',
    'Club',
    'Natación',
    'Inglés',
    'Ocio',
    'Tienda',
  ],
  'Yo': [
    'Auto/seguro',
    'Auto/cochera',
    'Combustible',
    'Tarjeta de crédito',
    'Obra social',
    'AUI/Bialik',
    'Auto/mantenimiento',
    'Ocio yo',
  ],
  'Otros': [
    'Reintegros',
    'Roturas',
    'Regalos',
    'Tienda',
    'Viaje',
    'Remis',
    'Librería',
  ],
}

export const CATEGORY_COLORS: Record<CategoryName, string> = {
  'Casa':   '#4F6AF5',
  'Hijo 1': '#0EA882',
  'Hijo 2': '#F59E0B',
  'Hijo 3': '#EC4899',
  'Yo':     '#8B5CF6',
  'Otros':  '#6B7280',
}

export const CATEGORY_NAMES = Object.keys(CATEGORIES) as CategoryName[]

export function formatARS(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatARSCompact(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}k`
  }
  return formatARS(value)
}
