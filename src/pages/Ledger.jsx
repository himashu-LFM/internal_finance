import { useState, useMemo } from 'react'
import { Download, Printer } from 'lucide-react'
import { usePool } from '../context/PoolContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'
import { formatAmount, formatDateTime } from '../utils/calculations'
import { exportLedgerCsv } from '../utils/export'

const typeLabels = {
  contribution: 'Contribution',
  payable: 'Payable',
  receivable_created: 'Receivable Created',
  receivable_waived: 'Receivable Waived',
  reimbursement: 'Reimbursement',
}

export default function Ledger() {
  const { ledger, state, symbol } = usePool()
  const [typeFilter, setTypeFilter] = useState('')
  const [memberFilter, setMemberFilter] = useState('')
  const [search, setSearch] = useState('')

  const memberMap = Object.fromEntries(state.members.map((m) => [m.id, m.name]))

  const filtered = useMemo(() => {
    return ledger.filter((e) => {
      if (typeFilter && e.type !== typeFilter) return false
      if (memberFilter && e.memberId !== memberFilter) return false
      if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [ledger, typeFilter, memberFilter, search])

  const handlePrint = () => window.print()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold">Ledger</h1>
          <p className="text-sm text-slate-500">Full audit log — read only</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportLedgerCsv(filtered, state.members)}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="print-only mb-4">
        <h1 className="text-xl font-bold">Budget Pool Ledger</h1>
        <p className="text-sm">{state.settings?.orgName}</p>
      </div>

      <Card className="p-4 no-print">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            placeholder="All types"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Select
            placeholder="All members"
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            options={state.members.map((m) => ({ value: m.id, label: m.name }))}
          />
          <Input placeholder="Search description..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-600">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Date & time</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b">
                  <td className="px-4 py-3 text-slate-500">{e.seq}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(e.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{typeLabels[e.type] || e.type}</span>
                  </td>
                  <td className="px-4 py-3">{e.memberId ? memberMap[e.memberId] : '—'}</td>
                  <td className="px-4 py-3 max-w-xs">{e.description}</td>
                  <td className="px-4 py-3 text-right font-amount text-red-600">
                    {e.debit > 0 ? formatAmount(e.debit, symbol) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-amount text-green-600">
                    {e.credit > 0 ? formatAmount(e.credit, symbol) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-amount font-medium">{formatAmount(e.balance, symbol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
