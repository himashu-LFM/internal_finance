let entryCounter = 0

function nextId() {
  entryCounter += 1
  return `ledger-${entryCounter}`
}

export function generateLedger({ contributions, payables, receivables, settings }) {
  entryCounter = 0
  const events = []

  if (settings?.openingBalance) {
    events.push({
      sortAt: '1970-01-01T00:00:00.000Z',
      createdAt: '1970-01-01T00:00:00.000Z',
      type: 'contribution',
      refId: 'opening',
      description: 'Opening balance',
      credit: settings.openingBalance,
      debit: 0,
    })
  }

  receivables.forEach((r) => {
    events.push({
      sortAt: r.createdAt,
      createdAt: r.createdAt,
      type: 'receivable_created',
      refId: r.id,
      memberId: r.memberId,
      description: `Receivable created: ${r.description}`,
      credit: 0,
      debit: 0,
    })
    if (r.status === 'waived') {
      events.push({
        sortAt: r.waivedAt || r.createdAt,
        createdAt: r.waivedAt || r.createdAt,
        type: 'receivable_waived',
        refId: r.id,
        memberId: r.memberId,
        description: `Receivable waived: ${r.description}`,
        credit: 0,
        debit: 0,
      })
    }
  })

  contributions
    .filter((c) => c.status === 'confirmed')
    .forEach((c) => {
      const sortAt = c.createdAt || `${c.date}T12:00:00.000Z`
      events.push({
        sortAt,
        createdAt: c.createdAt || sortAt,
        type: 'contribution',
        refId: c.id,
        memberId: c.memberId,
        description: `Contribution — ${(c.method || '').replace('_', ' ')}`,
        credit: c.amount,
        debit: 0,
      })
    })

  payables.forEach((p) => {
    if (p.paidById) {
      if (p.status === 'reimbursed') {
        events.push({
          sortAt: p.reimbursedAt || p.updatedAt || `${p.date}T16:00:00.000Z`,
          createdAt: p.reimbursedAt || p.createdAt,
          type: 'reimbursement',
          refId: p.id,
          memberId: p.paidById,
          description: `Reimbursement: ${p.description}`,
          credit: 0,
          debit: p.amount,
        })
      }
      return
    }
    if (p.status === 'paid' || p.status === 'reimbursed') {
      events.push({
        sortAt: p.createdAt || `${p.date}T14:00:00.000Z`,
        createdAt: p.createdAt,
        type: 'payable',
        refId: p.id,
        memberId: p.paidById,
        description: `Expense: ${p.description} (${p.category})`,
        credit: 0,
        debit: p.amount,
      })
    }
  })

  events.sort((a, b) => new Date(a.sortAt) - new Date(b.sortAt))

  let balance = 0
  const entries = events.map((e, idx) => {
    balance += (e.credit || 0) - (e.debit || 0)
    return {
      id: nextId(),
      seq: idx + 1,
      type: e.type,
      refId: e.refId,
      memberId: e.memberId,
      description: e.description,
      debit: e.debit || 0,
      credit: e.credit || 0,
      balance,
      createdAt: e.createdAt || e.sortAt,
    }
  })

  return entries.reverse()
}

export function getRecentActivity(ledger, limit = 10) {
  return ledger.slice(0, limit)
}
