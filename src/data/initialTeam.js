/** Team roster: name + amount already paid into the pool (INR). */
export const INITIAL_TEAM = [
  { name: 'Sanjeev Sharma', amount: 300 },
  { name: 'Yash Jangid', amount: 200 },
  { name: 'Yash Sharma', amount: 200 },
  { name: 'Rishi Soni', amount: 200 },
  { name: 'Giriraj', amount: 200 },
  { name: 'Kratika', amount: 200 },
  { name: 'Kuldeep Kumhar', amount: 200 },
  { name: 'Keshav', amount: 200 },
  { name: 'Divyanshu', amount: 200 },
  { name: 'Himanshu', amount: 200 },
  { name: 'Sunny', amount: 200 },
  { name: 'Chavi Jain', amount: 200 },
  { name: 'Sonal', amount: 200 },
  { name: 'Nikhil', amount: 200 },
]

function normalizeName(name) {
  return name.trim().toLowerCase()
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Adds members + confirmed contributions for INITIAL_TEAM.
 * Skips anyone whose name already exists (case-insensitive).
 */
export function mergeInitialTeam(state) {
  const existing = new Set(state.members.map((m) => normalizeName(m.name)))
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date().toISOString()
  const defaultTarget = state.settings?.defaultTargetAmount || 0

  const newMembers = []
  const newContributions = []

  for (const row of INITIAL_TEAM) {
    const key = normalizeName(row.name)
    if (existing.has(key)) continue

    const memberId = uid('m')
    newMembers.push({
      id: memberId,
      name: row.name.trim(),
      status: 'active',
      targetAmount: defaultTarget || undefined,
      createdAt: now,
    })
    newContributions.push({
      id: uid('c'),
      memberId,
      amount: row.amount,
      date: today,
      method: 'other',
      notes: 'Initial pool contribution',
      status: 'confirmed',
      createdAt: now,
    })
    existing.add(key)
  }

  if (newMembers.length === 0) return state

  return {
    ...state,
    members: [...state.members, ...newMembers],
    contributions: [...state.contributions, ...newContributions],
  }
}
