export function formatAmount(amount, symbol = '₹') {
  const n = Number(amount) || 0
  return `${symbol}${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(d)
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function daysOverdue(dueDate) {
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export function getConfirmedContributions(contributions) {
  return contributions.filter((c) => c.status === 'confirmed')
}

export function getMemberContributed(memberId, contributions) {
  return getConfirmedContributions(contributions)
    .filter((c) => c.memberId === memberId)
    .reduce((sum, c) => sum + c.amount, 0)
}

export function getMemberPendingReceivable(memberId, receivables) {
  return receivables
    .filter(
      (r) =>
        r.memberId === memberId &&
        (r.status === 'pending' || r.status === 'partially_paid')
    )
    .reduce((sum, r) => sum + (r.amount - (r.amountPaid || 0)), 0)
}

export function getMemberReimbursementsDue(memberId, payables) {
  return payables
    .filter(
      (p) =>
        p.paidById === memberId &&
        p.status === 'pending' &&
        p.paidById
    )
    .reduce((sum, p) => sum + p.amount, 0)
}

export function getTotalCollected(contributions) {
  return getConfirmedContributions(contributions).reduce((s, c) => s + c.amount, 0)
}

export function getTotalReceivables(receivables) {
  return receivables
    .filter((r) => r.status === 'pending' || r.status === 'partially_paid')
    .reduce((s, r) => s + (r.amount - (r.amountPaid || 0)), 0)
}

export function getTotalPayablesOutstanding(payables) {
  return payables
    .filter((p) => p.status === 'paid' || p.status === 'pending')
    .reduce((s, p) => {
      if (p.status === 'paid') return s + p.amount
      if (p.status === 'pending' && !p.paidById) return s + p.amount
      return s
    }, 0)
}

export function getPoolBalance(contributions, payables, settings = {}) {
  const opening = settings.openingBalance || 0
  const inflow = getTotalCollected(contributions)
  const outflow = payables
    .filter((p) => p.status === 'paid' || p.status === 'reimbursed')
    .reduce((s, p) => s + p.amount, 0)
  return opening + inflow - outflow
}

export function getOverdueReceivables(receivables) {
  return receivables.filter(
    (r) =>
      (r.status === 'pending' || r.status === 'partially_paid') &&
      daysOverdue(r.dueDate) > 0
  )
}

export function syncReceivableStatus(receivable, contributions) {
  const paid = receivable.amountPaid || 0
  if (receivable.status === 'waived') return receivable
  if (paid >= receivable.amount) {
    return { ...receivable, status: 'paid', amountPaid: receivable.amount }
  }
  if (paid > 0) {
    return { ...receivable, status: 'partially_paid' }
  }
  return { ...receivable, status: 'pending', amountPaid: paid }
}

export function applyContributionToReceivables(
  contribution,
  receivables,
  targetReceivableId
) {
  if (contribution.status !== 'confirmed') return receivables

  let remaining = contribution.amount
  return receivables.map((r) => {
    if (remaining <= 0) return r
    if (r.status === 'paid' || r.status === 'waived') return r
    if (targetReceivableId && r.id !== targetReceivableId) return r
    if (!targetReceivableId && r.memberId !== contribution.memberId) return r

    const owed = r.amount - (r.amountPaid || 0)
    if (owed <= 0) return r

    const apply = Math.min(remaining, owed)
    remaining -= apply
    const newPaid = (r.amountPaid || 0) + apply
    const updated = {
      ...r,
      amountPaid: newPaid,
      linkedContributionId: contribution.id,
    }
    return syncReceivableStatus(updated, contributions)
  })
}

export function getMonthlyData(contributions, payables, months = 6) {
  const result = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    const contrib = getConfirmedContributions(contributions)
      .filter((c) => c.date?.startsWith(key))
      .reduce((s, c) => s + c.amount, 0)
    const paid = payables
      .filter(
        (p) =>
          (p.status === 'paid' || p.status === 'reimbursed') &&
          p.date?.startsWith(key)
      )
      .reduce((s, p) => s + p.amount, 0)
    result.push({ month: label, key, contributions: contrib, payables: paid })
  }
  return result
}

export function getMemberShare(members, contributions) {
  const total = getTotalCollected(contributions)
  if (total === 0) return members.map((m) => ({ name: m.name, value: 0, percent: 0 }))
  return members
    .filter((m) => m.status === 'active')
    .map((m) => {
      const value = getMemberContributed(m.id, contributions)
      return {
        name: m.name,
        value,
        percent: Math.round((value / total) * 100),
      }
    })
    .filter((m) => m.value > 0)
}

export function filterByPeriod(items, dateField, period, customRange) {
  const now = new Date()
  let start
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  switch (period) {
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      break
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3)
      start = new Date(now.getFullYear(), q * 3, 1)
      break
    }
    case 'custom':
      if (customRange?.start) start = new Date(customRange.start)
      if (customRange?.end) end = new Date(customRange.end)
      break
    default:
      return items
  }

  if (!start) return items
  return items.filter((item) => {
    const raw = item[dateField]
    const d = new Date(raw?.length === 10 ? `${raw}T12:00:00` : raw)
    return d >= start && d <= end
  })
}

export function globalSearch(state, query) {
  const q = query.toLowerCase().trim()
  if (!q) return { members: [], contributions: [], payables: [], receivables: [] }

  const { members, contributions, payables, receivables } = state
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m.name]))

  return {
    members: members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.department?.toLowerCase().includes(q)
    ),
    contributions: contributions.filter(
      (c) =>
        memberMap[c.memberId]?.toLowerCase().includes(q) ||
        c.referenceNo?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q)
    ),
    payables: payables.filter(
      (p) =>
        p.description.toLowerCase().includes(q) ||
        p.paidTo?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
    ),
    receivables: receivables.filter(
      (r) =>
        memberMap[r.memberId]?.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.notes?.toLowerCase().includes(q)
    ),
  }
}
