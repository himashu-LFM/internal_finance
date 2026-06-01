import {
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
import { Wallet, TrendingUp, AlertCircle, CreditCard, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { usePool } from '../context/PoolContext'
import { StatCard } from '../components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import {
  formatAmount,
  formatDateTime,
  getMonthlyData,
  getMemberShare,
} from '../utils/calculations'
import { getRecentActivity } from '../utils/ledger'
import { cn } from '../utils/cn'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

export default function Dashboard() {
  const { state, stats, ledger, symbol, getMember } = usePool()
  const { members, contributions, payables } = state

  const monthly = getMonthlyData(contributions, payables)
  const share = getMemberShare(members, contributions)
  const activity = getRecentActivity(ledger, 10)

  const activityColor = (entry) => {
    if (entry.credit > 0) return 'text-green-600'
    if (entry.debit > 0) return 'text-red-600'
    return 'text-amber-600'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Pool overview and recent activity</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Pool Balance" value={stats.poolBalance} symbol={symbol} icon={Wallet} variant="primary" />
        <StatCard label="Total Collected" value={stats.totalCollected} symbol={symbol} icon={TrendingUp} variant="success" />
        <StatCard label="Total Receivables" value={stats.totalReceivables} symbol={symbol} icon={AlertCircle} variant="warning" />
        <StatCard label="Total Payables" value={stats.totalPayables} symbol={symbol} icon={CreditCard} variant="danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contribution share</CardTitle>
          </CardHeader>
          <CardContent>
            {share.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No contributions yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={share} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {share.map((_, i) => (
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

        <Card>
          <CardHeader>
            <CardTitle>Monthly in vs out (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatAmount(v, symbol)} />
                <Legend />
                <Bar dataKey="contributions" name="Contributions" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="payables" name="Payables" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member contribution targets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.filter((m) => m.status === 'active' && m.targetAmount).map((m) => {
            const contributed = state.contributions
              .filter((c) => c.memberId === m.id && c.status === 'confirmed')
              .reduce((s, c) => s + c.amount, 0)
            const pct = Math.min(100, Math.round((contributed / m.targetAmount) * 100))
            return (
              <div key={m.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{m.name}</span>
                  <span className="font-amount text-slate-600">
                    {formatAmount(contributed, symbol)} / {formatAmount(m.targetAmount, symbol)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-slate-100">
            {activity.map((entry) => (
              <li key={entry.id} className="flex items-center gap-4 py-3 first:pt-0">
                <div className={cn('rounded-full p-2 bg-slate-50', activityColor(entry))}>
                  {entry.credit > 0 ? (
                    <ArrowDownLeft className="h-4 w-4" />
                  ) : entry.debit > 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{entry.description}</p>
                  <p className="text-xs text-slate-500">
                    {entry.memberId ? getMember(entry.memberId)?.name : '—'} · {formatDateTime(entry.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  {entry.credit > 0 && (
                    <span className="font-amount text-sm text-green-600">+{formatAmount(entry.credit, symbol)}</span>
                  )}
                  {entry.debit > 0 && (
                    <span className="font-amount text-sm text-red-600">-{formatAmount(entry.debit, symbol)}</span>
                  )}
                  {entry.credit === 0 && entry.debit === 0 && (
                    <Badge variant="warning">Pending</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
