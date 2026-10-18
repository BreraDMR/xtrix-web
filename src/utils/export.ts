

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import { cellText, type ExportColumn } from './columns'

export type { ExportColumn }

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'print'

export type ExportPreferences = Partial<Pick<ExportOptions<unknown>, 'format'>>

export interface ExportOptions<T> {
  data: T[]
  columns: ExportColumn<T>[]
  filename: string
  title?: string
  format: ExportFormat
  includeCharts?: boolean
  chartSelectors?: string[]
}


export async function exportToPDF<T extends object>(
  options: ExportOptions<T>
): Promise<void> {
  const { data, columns, filename, title } = options
  const doc = new jsPDF()

  if (title) {
    doc.setFontSize(18)
    doc.text(title, 14, 22)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
  }

  const tableData = data.map((row) =>
    columns.map((col) => {
      const text = cellText(row, col)
      return typeof text === 'string' ? text : String(text ?? '')
    })
  )

  const headers = columns.map((col) => col.label)
  const colWidths = columns.map((col) => col.width || 40)

  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: title ? 35 : 20,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [139, 92, 246], textColor: 255 },
    columnStyles: columns.reduce((acc, _, idx) => {
      acc[idx] = { cellWidth: colWidths[idx] }
      return acc
    }, {} as Record<number, { cellWidth: number }>),
  })

  if (options.includeCharts && options.chartSelectors) {
    // jspdf-autotable sticks this onto the doc, its typings don't declare it
    let currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20

    for (const selector of options.chartSelectors) {
      const element = document.querySelector(selector) as HTMLElement
      if (element) {
        try {
          const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2,
          })
          const imgData = canvas.toDataURL('image/png')
          const imgWidth = 180
          const imgHeight = (canvas.height * imgWidth) / canvas.width

          if (currentY + imgHeight > 280) {
            doc.addPage()
            currentY = 20
          }

          doc.addImage(imgData, 'PNG', 14, currentY, imgWidth, imgHeight)
          currentY += imgHeight + 10
        } catch (error) {
          console.error('Error exporting chart:', error)
        }
      }
    }
  }

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}


export function exportToExcel<T extends object>(
  options: ExportOptions<T>
): void {
  const { data, columns, filename } = options

  const worksheetData: unknown[][] = []

  worksheetData.push(columns.map((col) => col.label))

  data.forEach((row) => {
    worksheetData.push(
      columns.map((col) => cellText(row, col) ?? '')
    )
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(worksheetData)

  ws['!cols'] = columns.map((col) => ({ wch: col.width || 15 }))

  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}


export async function exportChartToImage(
  selector: string,
  filename: string,
  format: 'png' | 'jpg' = 'png'
): Promise<void> {
  const element = document.querySelector(selector) as HTMLElement
  if (!element) {
    console.error('Chart element not found:', selector)
    return
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
    })

    const dataUrl = canvas.toDataURL(`image/${format}`)
    const link = document.createElement('a')
    link.download = filename.endsWith(`.${format}`) ? filename : `${filename}.${format}`
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Error exporting chart:', error)
    throw error
  }
}


export function printElement(selector?: string): void {
  const element = selector ? document.querySelector(selector) : document.body

  if (!element) {
    window.print()
    return
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    window.print()
    return
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #8b5cf6; color: white; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}


export async function exportData<T extends object>(
  options: ExportOptions<T>
): Promise<void> {
  switch (options.format) {
    case 'pdf':
      await exportToPDF(options)
      break
    case 'excel':
      exportToExcel(options)
      break
    case 'csv': {
      const { exportTableToCSV } = await import('./table')
      exportTableToCSV(options.data, options.columns, options.filename)
      break
    }
    case 'print':
      printElement()
      break
    default:
      throw new Error(`Unsupported format: ${options.format}`)
  }
}


export function getExportPreferences(): ExportPreferences {
  try {
    const saved = localStorage.getItem('export_preferences')
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}


export function saveExportPreferences(preferences: ExportPreferences): void {
  try {
    localStorage.setItem('export_preferences', JSON.stringify(preferences))
  } catch {
  }
}
