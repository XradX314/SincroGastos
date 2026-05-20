import type { ExpenseInput } from '../types'

export async function generateHash(expense: ExpenseInput): Promise<string> {
  const raw = [
    expense.categoria,
    expense.subcategoria,
    expense.fecha,
    expense.detalle ?? '',
    String(expense.importe),
  ].join('|')

  const encoder = new TextEncoder()
  const data = encoder.encode(raw)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
