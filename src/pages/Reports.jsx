import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Download, Printer } from 'lucide-react'
import { usePool } from '../context/PoolContext'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'
import {
  formatAmount,
  getTotalCollected,
  getPoolBalance,
  getMemberContributed,
  getMemberPendingReceivable,
  getMemberReimbursementsDue,
  getMonthlyData,
  filterByPeriod,
} from '../utils/calculations'
import { exportReportCsv } from '../utils/export'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Reports() {
  const { state, symbol, stats } = usePool()
  const [period, setPeriod] = useState('this_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const customRange = period === 'custom' ? { start: customStart, end: customEnd } : null

  const periodContributions = useMemo(
    () => filterByPeriod(state.contributions.filter((c) => c.status === 'confirmed'), 'date', period, customRange),
    [state.contributions, period, customStart, customEnd]
  )
  const periodPayables = useMemo(
    () => filterByPeriod(state.payables.filter((p) => p.status === 'paid' || p.status === 'reimbursed'), 'date', period, customRange),
    [state.payables, period, customStart, customEnd]
  )

  const totalIn = periodContributions.reduce((s, c) => s + c.amount, 0)
  const totalOut = periodPayables.reduce((s, p) => s + p.amount, 0)
  const monthly = getMonthlyData(state.contributions, state.payables, 12)

  const categoryData = useMemo(() => {
    const sums = {}
    periodPayables.forEach((p) => {
      sums[p.category] = (sums[p.category] || 0) + p.amount
    })
    return Object.entries(sums).map(([name, value]) => ({ name, value }))
  }, [periodPayables])

  const memberRows = state.members
    .filter((m) => m.status === 'active')
    .map((m) => {
      const contributed = getMemberContributed(m.id, state.contributions)
      const receivable = getMemberPendingReceivable(m.id, state.receivables)
      const reimburse = getMemberReimbursementsDue(m.id, state.payables)
      const net = contributed - receivable + reimburse
      return {
        'Member Name': m.name,
        Target: m.targetAmount || '—',
        Contributed: contributed,
        'Receivable Pending': receivable,
        'Reimbursements Due': reimburse,
        'Net Position': net,
      }
    })

  const memberBar = state.members
    .filter((m) => m.status === 'active')
    .map((m) => ({
      name: m.name.split(' ')[0],
      contributed: getMemberContributed(m.id, state.contributions),
    }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold">Reports & Summary</h1>
          <p className="text-sm text-slate-500">Pool analytics and exports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReportCsv(memberRows, 'member-summary')}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <Card className="p-4 no-print">
        <div className="flex flex-wrap gap-3 items-end">
          <Select
            label="Period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={[
              { value: 'this_month', label: 'This Month' },
              { value: 'last_month', label: 'Last Month' },
              { value: 'this_quarter', label: 'This Quarter' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          {period === 'custom' && (
            <>
              <Input label="From" type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
              <Input label="To" type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pool summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm text-slate-500">Opening balance</p>
              <p className="text-xl font-amount font-semibold">{formatAmount(state.settings?.openingBalance || 0, symbol)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total in (period)</p>
              <p className="text-xl font-amount font-semibold text-green-600">{formatAmount(totalIn, symbol)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total out (period)</p>
              <p className="text-xl font-amount font-semibold text-red-600">{formatAmount(totalOut, symbol)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Current balance</p>
              <p className="text-xl font-amount font-semibold text-blue-600">
                {formatAmount(getPoolBalance(state.contributions, state.payables, state.settings), symbol)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            All-time collected: {formatAmount(getTotalCollected(state.contributions), symbol)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Per-member summary</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-600">
                <th className="pb-2">Member</th>
                <th className="pb-2 text-right">Target</th>
                <th className="pb-2 text-right">Contributed</th>
                <th className="pb-2 text-right">Receivable</th>
                <th className="pb-2 text-right">Reimb. due</th>
                <th className="pb-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {memberRows.map((row) => (
                <tr key={row['Member Name']} className="border-b border-slate-50">
                  <td className="py-2 font-medium">{row['Member Name']}</td>
                  <td className="py-2 text-right font-amount">{typeof row.Target === 'number' ? formatAmount(row.Target, symbol) : row.Target}</td>
                  <td className="py-2 text-right font-amount text-green-600">{formatAmount(row.Contributed, symbol)}</td>
                  <td className="py-2 text-right font-amount text-amber-600">{formatAmount(row['Receivable Pending'], symbol)}</td>
                  <td className="py-2 text-right font-amount">{formatAmount(row['Reimbursements Due'], symbol)}</td>
                  <td className={`py-2 text-right font-amount font-semibold ${row['Net Position'] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAmount(row['Net Position'], symbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 no-print">
        <Card>
          <CardHeader><CardTitle>Monthly contribution trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatAmount(v, symbol)} />
                <Line type="monotone" dataKey="contributions" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Category spend (period)</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No payables in period</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatAmount(v, symbol)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="no-print">
        <CardHeader><CardTitle>Member contribution comparison</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(200, memberBar.length * 40)}>
            <BarChart data={memberBar} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={55} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatAmount(v, symbol)} />
              <Bar dataKey="contributed" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
