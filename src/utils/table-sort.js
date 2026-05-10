import { typeNames } from '../components/constants.js'

function columnCellValue(col, row) {
  if (!col || !row) {
    return ''
  }
  if (typeof col.field === typeNames.function) {
    return col.field(row)
  }

  return row[col.field]
}

export function sortRowsByColumns(rows, sortBy, descending, columns) {
  if (!Array.isArray(rows) || rows.length <= 1 || !sortBy) {
    return rows
  }
  const col = columns.find(c => c.name === sortBy && c.sortable !== false)
  if (!col) {
    return rows
  }
  const dir = descending ? -1 : 1

  return [...rows].sort((a, b) => {
    const va = columnCellValue(col, a)
    const vb = columnCellValue(col, b)
    if (va == null && vb == null) {
      return 0
    }
    if (va == null) {
      return 1 * dir
    }
    if (vb == null) {
      return -1 * dir
    }
    if (typeof va === typeNames.number && typeof vb === typeNames.number) {
      return (va - vb) * dir
    }
    const sa = String(va).toLowerCase()
    const sb = String(vb).toLowerCase()
    if (sa < sb) {
      return -1 * dir
    }
    if (sa > sb) {
      return 1 * dir
    }

    return 0
  })
}
