import { useState } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, Bell, Ban } from 'lucide-react'
import { usePool } from '../context/PoolContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/Button'
import { Modal, ConfirmDialog } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ReceivableForm } from '../components/forms/ReceivableForm'
import { ContributionForm } from '../components/forms/ContributionForm'
import { formatAmount, formatDate, daysOverdue } from '../utils/calculations'
import { cn } from '../utils/cn'

const statusVariant = {
  pending: 'warning',
  partially_paid: 'info',
  paid: 'success',
  waived: 'outline',
}

export default function Receivables() {
  const { state, dispatch, symbol, stats } = usePool()
  const { toast } = useToast()
  const [modal, setModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [payReceivable, setPayReceivable] = useState(null)
  const [waiveId, setWaiveId] = useState(null)
  const [waiveReason, setWaiveReason] = useState('')

  const memberMap = Object.fromEntries(state.members.map((m) => [m.id, m.name]))
  const overdue = stats.overdueReceivables
  const oldest = overdue.length
    ? overdue.reduce((a, b) => (daysOverdue(a.dueDate) > daysOverdue(b.dueDate) ? a : b))
    : null

  const copyReminder = (r) => {
    const name = memberMap[r.memberId]
    const owed = r.amount - (r.amountPaid || 0)
    const text = `Hi ${name}, reminder: ₹${owed.toLocaleString('en-IN')} is due for "${r.description}" (due ${formatDate(r.dueDate)}). Please pay at your earliest.`
    navigator.clipboard.writeText(text)
    toast('Reminder copied to clipboard', 'info')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Receivables</h1>
          <p className="text-sm text-slate-500">Amounts owed to the pool</p>
        </div>
        <Button onClick={() => setModal({ type: 'add' })}>
          <Plus className="h-4 w-4" /> Add receivable
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">Total outstanding</p>
          <p className="text-2xl font-amount font-bold text-amber-900">{formatAmount(stats.totalReceivables, symbol)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Overdue items</p>
          <p className="text-2xl font-bold text-red-600">{overdue.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Oldest overdue</p>
          <p className="text-sm font-medium mt-1">
            {oldest ? `${memberMap[oldest.memberId]} — ${daysOverdue(oldest.dueDate)} days` : 'None'}
          </p>
        </Card>
      </div>

      {state.receivables.length === 0 ? (
        <EmptyState title="No receivables" description="Track what members owe the pool." actionLabel="Add receivable" onAction={() => setModal({ type: 'add' })} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-600">
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3 text-right">Amount due</th>
                  <th className="px-4 py-3">Due date</th>
                  <th className="px-4 py-3">Overdue</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.receivables.map((r) => {
                  const overdueDays = daysOverdue(r.dueDate)
                  const isOverdue =
                    overdueDays > 0 && (r.status === 'pending' || r.status === 'partially_paid')
                  const remaining = r.amount - (r.amountPaid || 0)
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        'border-b',
                        isOverdue && 'bg-amber-50/80'
                      )}
                    >
                      <td className="px-4 py-3 font-medium">{memberMap[r.memberId]}</td>
                      <td className="px-4 py-3 text-right font-amount">{formatAmount(remaining, symbol)}</td>
                      <td className="px-4 py-3">{formatDate(r.dueDate)}</td>
                      <td className="px-4 py-3">
                        {isOverdue ? (
                          <Badge variant="danger">{overdueDays} days overdue</Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[r.status]}>{r.status.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">{r.description}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1 flex-wrap">
                          {r.status !== 'paid' && r.status !== 'waived' && (
                            <>
                              <button type="button" title="Mark paid" className="p-1.5 hover:bg-green-50 rounded" onClick={() => setPayReceivable(r)}>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </button>
                              <button type="button" title="Reminder" className="p-1.5 hover:bg-slate-100 rounded" onClick={() => copyReminder(r)}>
                                <Bell className="h-4 w-4" />
                              </button>
                              <button type="button" title="Waive" className="p-1.5 hover:bg-slate-100 rounded" onClick={() => setWaiveId(r.id)}>
                                <Ban className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button type="button" className="p-1.5 hover:bg-slate-100 rounded" onClick={() => setModal({ type: 'edit', ...r })}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" className="p-1.5 hover:bg-red-50 rounded" onClick={() => setDeleteId(r.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={modal?.type === 'add'} onClose={() => setModal(null)} title="Add receivable">
        <ReceivableForm
          members={state.members}
          onSubmit={(data) => {
            dispatch({ type: 'ADD_RECEIVABLE', payload: data })
            toast('Receivable added ✓')
            setModal(null)
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>
      <Modal open={modal?.type === 'edit'} onClose={() => setModal(null)} title="Edit receivable">
        <ReceivableForm
          members={state.members}
          initial={modal}
          onSubmit={(data) => {
            dispatch({ type: 'UPDATE_RECEIVABLE', payload: { id: modal.id, ...data } })
            toast('Receivable updated ✓')
            setModal(null)
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>
      <Modal open={!!payReceivable} onClose={() => setPayReceivable(null)} title="Mark as paid — log contribution">
        <ContributionForm
          members={state.members}
          initial={{
            memberId: payReceivable?.memberId,
            amount: payReceivable ? payReceivable.amount - (payReceivable.amountPaid || 0) : '',
            status: 'confirmed',
          }}
          onSubmit={(data) => {
            dispatch({
              type: 'ADD_CONTRIBUTION',
              payload: data,
              targetReceivableId: payReceivable.id,
            })
            toast('Payment recorded ✓')
            setPayReceivable(null)
          }}
          onCancel={() => setPayReceivable(null)}
        />
      </Modal>
      <Modal open={!!waiveId} onClose={() => setWaiveId(null)} title="Waive receivable" size="sm">
        <textarea
          className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
          placeholder="Reason for waiving..."
          value={waiveReason}
          onChange={(e) => setWaiveReason(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setWaiveId(null)}>Cancel</Button>
          <Button
            onClick={() => {
              dispatch({ type: 'WAIVE_RECEIVABLE', payload: { id: waiveId, reason: waiveReason } })
              toast('Receivable waived')
              setWaiveId(null)
              setWaiveReason('')
            }}
          >
            Waive
          </Button>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          dispatch({ type: 'DELETE_RECEIVABLE', payload: deleteId })
          toast('Receivable deleted')
        }}
        title="Delete receivable"
        message="Remove this receivable?"
        danger
      />
    </div>
  )
}
