import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Download, CheckSquare } from 'lucide-react'
import { usePool } from '../context/PoolContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/Button'
import { Modal, ConfirmDialog } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input, Select } from '../components/ui/Input'
import { ContributionForm } from '../components/forms/ContributionForm'
import { formatAmount, formatDate } from '../utils/calculations'
import { exportContributionsCsv } from '../utils/export'

export default function Contributions() {
  const { state, dispatch, symbol } = usePool()
  const { toast } = useToast()
  const [modal, setModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [selected, setSelected] = useState([])
  const [filters, setFilters] = useState({ member: '', status: '', method: '', search: '', sort: 'date-desc' })

  const memberMap = Object.fromEntries(state.members.map((m) => [m.id, m.name]))

  const filtered = useMemo(() => {
    let list = [...state.contributions]
    if (filters.member) list = list.filter((c) => c.memberId === filters.member)
    if (filters.status) list = list.filter((c) => c.status === filters.status)
    if (filters.method) list = list.filter((c) => c.method === filters.method)
    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (c) =>
          c.referenceNo?.toLowerCase().includes(q) ||
          c.notes?.toLowerCase().includes(q) ||
          memberMap[c.memberId]?.toLowerCase().includes(q)
      )
    }
    const [field, dir] = filters.sort.split('-')
    list.sort((a, b) => {
      let cmp = 0
      if (field === 'date') cmp = new Date(a.date) - new Date(b.date)
      else if (field === 'amount') cmp = a.amount - b.amount
      else cmp = (memberMap[a.memberId] || '').localeCompare(memberMap[b.memberId] || '')
      return dir === 'desc' ? -cmp : cmp
    })
    return list
  }, [state.contributions, filters, memberMap])

  const toggleSelect = (id) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const bulkConfirm = () => {
    dispatch({ type: 'BULK_CONFIRM_CONTRIBUTIONS', ids: selected })
    toast(`${selected.length} contribution(s) confirmed ✓`)
    setSelected([])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contributions</h1>
          <p className="text-sm text-slate-500">Money collected into the pool</p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <>
              <Button variant="success" size="sm" onClick={bulkConfirm}>
                <CheckSquare className="h-4 w-4" /> Mark confirmed ({selected.length})
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportContributionsCsv(
                state.contributions.filter((c) => selected.includes(c.id)),
                state.members,
                symbol
              )}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </>
          )}
          <Button onClick={() => setModal({ type: 'add' })}>
            <Plus className="h-4 w-4" /> Add contribution
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            placeholder="All members"
            value={filters.member}
            onChange={(e) => setFilters({ ...filters, member: e.target.value })}
            options={state.members.map((m) => ({ value: m.id, label: m.name }))}
          />
          <Select
            placeholder="All statuses"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
          <Select
            placeholder="All methods"
            value={filters.method}
            onChange={(e) => setFilters({ ...filters, method: e.target.value })}
            options={['cash', 'upi', 'bank_transfer', 'other'].map((m) => ({
              value: m,
              label: m.replace('_', ' '),
            }))}
          />
          <Input
            placeholder="Search ref / notes..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            options={[
              { value: 'date-desc', label: 'Date (newest)' },
              { value: 'date-asc', label: 'Date (oldest)' },
              { value: 'amount-desc', label: 'Amount (high)' },
              { value: 'member-asc', label: 'Member A–Z' },
            ]}
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No contributions" description="Record money received into the pool." actionLabel="Add contribution" onAction={() => setModal({ type: 'add' })} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-600">
                  <th className="px-4 py-3 w-10" />
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} />
                    </td>
                    <td className="px-4 py-3">{formatDate(c.date)}</td>
                    <td className="px-4 py-3 font-medium">{memberMap[c.memberId]}</td>
                    <td className="px-4 py-3 text-right font-amount text-green-600">{formatAmount(c.amount, symbol)}</td>
                    <td className="px-4 py-3 capitalize">{c.method?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-slate-500">{c.referenceNo || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.status === 'confirmed' ? 'success' : 'warning'}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" className="p-1.5 hover:bg-slate-100 rounded" onClick={() => setModal({ type: 'edit', ...c })}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" className="p-1.5 hover:bg-red-50 rounded" onClick={() => setDeleteId(c.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={modal?.type === 'add'} onClose={() => setModal(null)} title="Add contribution">
        <ContributionForm
          members={state.members}
          onSubmit={(data) => {
            dispatch({ type: 'ADD_CONTRIBUTION', payload: data })
            toast('Contribution added ✓')
            setModal(null)
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>
      <Modal open={modal?.type === 'edit'} onClose={() => setModal(null)} title="Edit contribution">
        <ContributionForm
          members={state.members}
          initial={modal}
          onSubmit={(data) => {
            dispatch({ type: 'UPDATE_CONTRIBUTION', payload: { id: modal.id, ...data } })
            toast('Contribution updated ✓')
            setModal(null)
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          dispatch({ type: 'DELETE_CONTRIBUTION', payload: deleteId })
          toast('Contribution deleted')
        }}
        title="Delete contribution"
        message="Remove this contribution record?"
        danger
      />
    </div>
  )
}
