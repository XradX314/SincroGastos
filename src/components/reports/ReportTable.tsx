import { useRef } from 'react'
import { Download, FileText } from 'lucide-react'
import { formatARS } from '../../lib/categoryData'
import { Button } from '../ui/Button'
import type { AnnualReport } from '../../types'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

interface ReportTableProps {
  report: AnnualReport
}

function pct(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function fmt(v: number): string {
  if (v === 0) return '—'
  return formatARS(v)
}

export function ReportTable({ report }: ReportTableProps) {
  const tableRef = useRef<HTMLDivElement>(null)

  const exportCSV = () => {
    const rows: string[][] = []
    rows.push(['Categoría', 'Subcategoría', ...MONTHS, 'Total', '%'])
    report.categories.forEach((cat) => {
      rows.push([cat.categoria, '', ...cat.months.map(String), String(cat.total), pct(cat.total, report.grandTotal)])
      cat.subcategories.forEach((sub) => {
        rows.push(['', sub.subcategoria, ...sub.months.map(String), String(sub.total), pct(sub.total, report.grandTotal)])
      })
    })
    rows.push(['TOTAL', '', ...report.monthTotals.map(String), String(report.grandTotal), '100%'])

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gastos_${report.year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    doc.setFontSize(14)
    doc.text(`Reporte Anual ${report.year}`, 14, 14)

    const head = [['Categoría', 'Subcategoría', ...MONTHS, 'Total', '%']]
    const body: string[][] = []

    report.categories.forEach((cat) => {
      body.push([cat.categoria, '', ...cat.months.map((v) => fmt(v)), fmt(cat.total), pct(cat.total, report.grandTotal)])
      cat.subcategories.forEach((sub) => {
        body.push(['', sub.subcategoria, ...sub.months.map((v) => fmt(v)), fmt(sub.total), pct(sub.total, report.grandTotal)])
      })
    })
    body.push(['TOTAL', '', ...report.monthTotals.map((v) => fmt(v)), fmt(report.grandTotal), '100%'])

    autoTable(doc, {
      head,
      body,
      startY: 20,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [79, 106, 245] },
      didParseCell: (data) => {
        if (data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })

    doc.save(`gastos_${report.year}.pdf`)
  }

  return (
    <div className="space-y-3">
      {/* Acciones */}
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={exportCSV}>
          <Download size={14} />
          CSV
        </Button>
        <Button variant="secondary" size="sm" onClick={exportPDF}>
          <FileText size={14} />
          PDF
        </Button>
      </div>

      {/* Tabla con scroll horizontal */}
      <div
        ref={tableRef}
        className="overflow-auto rounded-2xl border border-black/[0.06] dark:border-white/[0.06]"
        style={{ maxHeight: 'calc(100vh - 240px)' }}
      >
        <table className="w-full text-xs border-collapse" style={{ minWidth: '900px' }}>
          <thead>
            <tr className="bg-surface-2 dark:bg-surface-2dark sticky top-0 z-10">
              {/* Sticky first col */}
              <th className="sticky left-0 z-20 bg-surface-2 dark:bg-surface-2dark text-left px-4 py-3 font-semibold text-text1-DEFAULT dark:text-text1-dark border-b border-black/[0.06] dark:border-white/[0.06]" style={{ minWidth: 160 }}>
                Categoría
              </th>
              {MONTHS.map((m) => (
                <th key={m} className="px-3 py-3 text-right font-semibold text-text1-DEFAULT dark:text-text1-dark border-b border-black/[0.06] dark:border-white/[0.06] whitespace-nowrap">
                  {m}
                </th>
              ))}
              <th className="px-3 py-3 text-right font-bold text-text1-DEFAULT dark:text-text1-dark border-b border-black/[0.06] dark:border-white/[0.06]">Total</th>
              <th className="px-3 py-3 text-right font-semibold text-text2-DEFAULT dark:text-text2-dark border-b border-black/[0.06] dark:border-white/[0.06]">%</th>
            </tr>
          </thead>
          <tbody>
            {report.categories.map((cat) => (
              <>
                {/* Fila de categoría */}
                <tr key={cat.categoria} className="bg-surface-DEFAULT dark:bg-surface-dark border-t border-black/[0.04] dark:border-white/[0.04]">
                  <td className="sticky left-0 z-10 bg-surface-DEFAULT dark:bg-surface-dark px-4 py-2.5 font-semibold text-text1-DEFAULT dark:text-text1-dark border-r border-black/[0.06] dark:border-white/[0.06]">
                    {cat.categoria}
                  </td>
                  {cat.months.map((v, i) => (
                    <td key={i} className="px-3 py-2.5 text-right font-semibold text-text1-DEFAULT dark:text-text1-dark whitespace-nowrap">
                      {fmt(v)}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right font-bold text-text1-DEFAULT dark:text-text1-dark whitespace-nowrap">
                    {fmt(cat.total)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-text2-DEFAULT dark:text-text2-dark">
                    {pct(cat.total, report.grandTotal)}
                  </td>
                </tr>

                {/* Filas de subcategorías */}
                {cat.subcategories.map((sub) => (
                  <tr key={`${cat.categoria}-${sub.subcategoria}`} className="hover:bg-surface-2 dark:hover:bg-surface-2dark transition-colors">
                    <td className="sticky left-0 z-10 bg-surface-DEFAULT dark:bg-surface-dark hover:bg-surface-2 dark:hover:bg-surface-2dark px-4 py-2 pl-8 text-text2-DEFAULT dark:text-text2-dark border-r border-black/[0.06] dark:border-white/[0.06] transition-colors">
                      {sub.subcategoria}
                    </td>
                    {sub.months.map((v, i) => (
                      <td key={i} className="px-3 py-2 text-right text-text2-DEFAULT dark:text-text2-dark whitespace-nowrap">
                        {fmt(v)}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right text-text1-DEFAULT dark:text-text1-dark font-medium whitespace-nowrap">
                      {fmt(sub.total)}
                    </td>
                    <td className="px-3 py-2 text-right text-text2-DEFAULT dark:text-text2-dark">
                      {pct(sub.total, report.grandTotal)}
                    </td>
                  </tr>
                ))}
              </>
            ))}

            {/* Fila de totales */}
            <tr className="bg-primary-DEFAULT/5 dark:bg-primary-dark/5 border-t-2 border-primary-DEFAULT/20 dark:border-primary-dark/20 sticky bottom-0">
              <td className="sticky left-0 z-10 bg-primary-DEFAULT/5 dark:bg-primary-dark/5 px-4 py-3 font-bold text-text1-DEFAULT dark:text-text1-dark border-r border-black/[0.06] dark:border-white/[0.06]">
                TOTAL
              </td>
              {report.monthTotals.map((v, i) => (
                <td key={i} className="px-3 py-3 text-right font-bold text-text1-DEFAULT dark:text-text1-dark whitespace-nowrap">
                  {fmt(v)}
                </td>
              ))}
              <td className="px-3 py-3 text-right font-bold text-primary-DEFAULT dark:text-primary-dark whitespace-nowrap">
                {fmt(report.grandTotal)}
              </td>
              <td className="px-3 py-3 text-right font-bold text-text1-DEFAULT dark:text-text1-dark">
                100%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
