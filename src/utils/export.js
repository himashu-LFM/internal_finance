function downloadBlob(content, filename, type = 'text/csv') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function escapeCsv(val) {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function exportToCsv(rows, headers, filename) {
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(',')),
  ]
  downloadBlob(lines.join('\n'), filename)
}

export function exportContributionsCsv(contributions, members, symbol = '₹') {
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m.name]))
  exportToCsv(
    contributions.map((c) => ({
      Date: c.date,
      Member: memberMap[c.memberId] || '',
      Amount: c.amount,
      Method: c.method,
      Reference: c.referenceNo || '',
      Status: c.status,
      Notes: c.notes || '',
    })),
    ['Date', 'Member', 'Amount', 'Method', 'Reference', 'Status', 'Notes'],
    `contributions-${Date.now()}.csv`
  )
}

export function exportLedgerCsv(ledger, members) {
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m.name]))
  exportToCsv(
    ledger.map((e) => ({
      ID: e.seq,
      Date: e.createdAt,
      Type: e.type,
      Member: e.memberId ? memberMap[e.memberId] : '',
      Description: e.description,
      Debit: e.debit,
      Credit: e.credit,
      Balance: e.balance,
    })),
    ['ID', 'Date', 'Type', 'Member', 'Description', 'Debit', 'Credit', 'Balance'],
    `ledger-${Date.now()}.csv`
  )
}

export function exportReportCsv(reportRows, filename = 'report') {
  if (!reportRows.length) return
  const headers = Object.keys(reportRows[0])
  exportToCsv(
    reportRows.map((row) => {
      const o = {}
      headers.forEach((h) => {
        o[h] = row[h]
      })
      return o
    }),
    headers,
    `${filename}-${Date.now()}.csv`
  )
}

export function exportJsonBackup(state) {
  const json = JSON.stringify(state, null, 2)
  downloadBlob(json, `budget-pool-backup-${Date.now()}.json`, 'application/json')
}
