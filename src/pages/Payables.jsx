import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { usePool } from '../context/PoolContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/Button'
import { Modal, ConfirmDialog } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Select } from '../components/ui/Input'
import { PayableForm } from '../components/forms/PayableForm'
import { formatAmount, formatDate } from '../utils/calculations'

const categories = ['food', 'travel', 'office', 'utility', 'misc']

export default function Payables() {
  const { state, dispatch, symbol } = usePool()
  const { toast } = useToast()
  const [modal, setModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const memberMap = Object.fromEntries(state.members.map((m) => [m.id, m.name]))

  const categorySummary = useMemo(() => {
    const sums = {}
    categories.forEach((c) => { sums[c] = 0 })
    state.payables.forEach((p) => {
      if (p.status === 'paid' || p.status === 'reimbursed') {
        sums[p.category] = (sums[p.category] || 0) + p.amount
      }
    })
    return sums
  }, [state.payables])

  const filtered = state.payables.filter((p) => {
    if (categoryFilter && p.category !== categoryFilter) return false
    if (statusFilter && p.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payables</h1>
          <p className="text-sm text-slate-500">Pool expenses and reimbursements</p>
        </div>
        <Button onClick={() => setModal({ type: 'add' })}>
          <Plus className="h-4 w-4" /> Add payable
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        {categories.map((cat) => (
          <Card key={cat} className="p-3">
            <p className="text-xs text-slate-500 capitalize">{cat}</p>
            <p className="font-amount font-semibold">{formatAmount(categorySummary[cat] || 0, symbol)}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 flex gap-3 flex-wrap">
        <Select
          placeholder="All categories"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={categories.map((c) => ({ value: c, label: c }))}
        />
        <Select
          placeholder="All statuses"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'paid', label: 'Paid' },
            { value: 'reimbursed', label: 'Reimbursed' },
          ]}
        />
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No payables" description="Record expenses paid from the pool." actionLabel="Add payable" onAction={() => setModal({ type: 'add' })} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-600">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Paid to</th>
                  <th className="px-4 py-3">Paid by</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3">{formatDate(p.date)}</td>
                    <td className="px-4 py-3 font-medium">{p.description}</td>
                    <td className="px-4 py-3 capitalize">{p.category}</td>
                    <td className="px-4 py-3 text-right font-amount text-red-600">{formatAmount(p.amount, symbol)}</td>
                    <td className="px-4 py-3">{p.paidTo || '—'}</td>
                    <td className="px-4 py-3">{p.paidById ? memberMap[p.paidById] : '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === 'reimbursed' ? 'success' : p.status === 'pending' ? 'warning' : 'default'}>
                        {p.paidById && p.status === 'pending' ? 'Pending reimbursement' : p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {p.paidById && p.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              dispatch({ type: 'UPDATE_PAYABLE', payload: { id: p.id, status: 'reimbursed' } })
                              toast('Marked as reimbursed ✓')
                            }}
                          >
                            Reimburse
                          </Button>
                        )}
                        <button type="button" className="p-1.5 hover:bg-slate-100 rounded" onClick={() => setModal({ type: 'edit', ...p })}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" className="p-1.5 hover:bg-red-50 rounded" onClick={() => setDeleteId(p.id)}>
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

      <Modal open={modal?.type === 'add'} onClose={() => setModal(null)} title="Add payable" size="lg">
        <PayableForm
          members={state.members}
          onSubmit={(data) => {
            dispatch({ type: 'ADD_PAYABLE', payload: data })
            toast('Payable added ✓')
            setModal(null)
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>
      <Modal open={modal?.type === 'edit'} onClose={() => setModal(null)} title="Edit payable" size="lg">
        <PayableForm
          members={state.members}
          initial={modal}
          onSubmit={(data) => {
            dispatch({ type: 'UPDATE_PAYABLE', payload: { id: modal.id, ...data } })
            toast('Payable updated ✓')
            setModal(null)
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          dispatch({ type: 'DELETE_PAYABLE', payload: deleteId })
          toast('Payable deleted')
        }}
        title="Delete payable"
        message="Remove this expense record?"
        danger
      />
    </div>
  )
}
