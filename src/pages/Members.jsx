import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Users, Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { usePool } from '../context/PoolContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/Button'
import { Modal, ConfirmDialog } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { MemberForm } from '../components/forms/MemberForm'
import { ContributionForm } from '../components/forms/ContributionForm'
import { ReceivableForm } from '../components/forms/ReceivableForm'
import {
  formatAmount,
  formatDate,
  getMemberContributed,
  getMemberPendingReceivable,
} from '../utils/calculations'

export default function Members() {
  const { state, dispatch, symbol, getMember } = usePool()
  const { toast } = useToast()
  const [params] = useSearchParams()
  const [modal, setModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [selectedId, setSelectedId] = useState(params.get('member') || null)

  const selected = selectedId ? getMember(selectedId) : null

  const handleAdd = (data) => {
    dispatch({ type: 'ADD_MEMBER', payload: data })
    toast('Member added ✓')
    setModal(null)
  }

  const handleUpdate = (data) => {
    dispatch({ type: 'UPDATE_MEMBER', payload: { id: modal.id, ...data } })
    toast('Member updated ✓')
    setModal(null)
  }

  const handleDelete = () => {
    dispatch({ type: 'DELETE_MEMBER', payload: deleteId })
    toast('Member deleted')
    setDeleteId(null)
    if (selectedId === deleteId) setSelectedId(null)
  }

  if (selected) {
    const contributed = getMemberContributed(selected.id, state.contributions)
    const owed = getMemberPendingReceivable(selected.id, state.receivables)
    const net = contributed - owed
    const history = [
      ...state.contributions.filter((c) => c.memberId === selected.id).map((c) => ({
        type: 'contribution',
        date: c.date,
        desc: `Contribution (${c.status})`,
        amount: c.amount,
        positive: true,
      })),
      ...state.receivables.filter((r) => r.memberId === selected.id).map((r) => ({
        type: 'receivable',
        date: r.dueDate,
        desc: r.description,
        amount: r.amount - (r.amountPaid || 0),
        positive: false,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date))

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button type="button" onClick={() => setSelectedId(null)} className="text-sm text-blue-500 hover:underline mb-2">
              ← Back to members
            </button>
            <h1 className="text-2xl font-bold">{selected.name}</h1>
            <p className="text-sm text-slate-500">{selected.department} · {selected.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setModal({ type: 'contribution', memberId: selected.id })}>
              Add contribution
            </Button>
            <Button variant="outline" onClick={() => setModal({ type: 'receivable', memberId: selected.id })}>
              Mark receivable
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="pt-6"><p className="text-sm text-slate-500">Contributed</p><p className="text-xl font-amount font-semibold text-green-600">{formatAmount(contributed, symbol)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-slate-500">Owed</p><p className="text-xl font-amount font-semibold text-amber-600">{formatAmount(owed, symbol)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-slate-500">Net</p><p className={`text-xl font-amount font-semibold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatAmount(net, symbol)}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Transaction history</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2">{formatDate(h.date)}</td>
                    <td>{h.desc}</td>
                    <td className={`py-2 text-right font-amount ${h.positive ? 'text-green-600' : 'text-red-600'}`}>
                      {h.positive ? '+' : '-'}{formatAmount(h.amount, symbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <MemberDetailModals modal={modal} setModal={setModal} selected={selected} state={state} dispatch={dispatch} toast={toast} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Members</h1>
          <p className="text-sm text-slate-500">{state.members.length} team members</p>
        </div>
        <Button onClick={() => setModal({ type: 'add' })}>
          <Plus className="h-4 w-4" /> Add member
        </Button>
      </div>

      {state.members.length === 0 ? (
        <EmptyState icon={Users} title="No members yet" description="Add team members to start tracking contributions." actionLabel="Add member" onAction={() => setModal({ type: 'add' })} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role / Dept</th>
                  <th className="px-4 py-3 font-medium text-right">Contributed</th>
                  <th className="px-4 py-3 font-medium text-right">Pending receivable</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.members.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button type="button" className="font-medium text-blue-600 hover:underline" onClick={() => setSelectedId(m.id)}>
                        {m.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.department || '—'}</td>
                    <td className="px-4 py-3 text-right font-amount">{formatAmount(getMemberContributed(m.id, state.contributions), symbol)}</td>
                    <td className="px-4 py-3 text-right font-amount text-amber-600">{formatAmount(getMemberPendingReceivable(m.id, state.receivables), symbol)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={m.status === 'active' ? 'success' : 'outline'}>{m.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" className="p-1.5 rounded hover:bg-slate-100" title="Edit" onClick={() => setModal({ type: 'edit', ...m })}>
                          <Pencil className="h-4 w-4 text-slate-500" />
                        </button>
                        <button type="button" className="p-1.5 rounded hover:bg-slate-100" title="View ledger" onClick={() => setSelectedId(m.id)}>
                          <BookOpen className="h-4 w-4 text-slate-500" />
                        </button>
                        <button type="button" className="p-1.5 rounded hover:bg-red-50" title="Delete" onClick={() => setDeleteId(m.id)}>
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

      <Modal open={modal?.type === 'add'} onClose={() => setModal(null)} title="Add member">
        <MemberForm members={state.members} onSubmit={handleAdd} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal?.type === 'edit'} onClose={() => setModal(null)} title="Edit member">
        <MemberForm initial={modal} members={state.members} onSubmit={handleUpdate} onCancel={() => setModal(null)} />
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete member" message="This cannot be undone. Related records will remain." danger />
    </div>
  )
}

function MemberDetailModals({ modal, setModal, selected, state, dispatch, toast }) {
  return (
    <>
      <Modal open={modal?.type === 'contribution'} onClose={() => setModal(null)} title="Add contribution">
        <ContributionForm
          members={state.members}
          initial={{ memberId: modal?.memberId || selected.id }}
          onSubmit={(data) => {
            dispatch({ type: 'ADD_CONTRIBUTION', payload: data })
            toast('Contribution added ✓')
            setModal(null)
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>
      <Modal open={modal?.type === 'receivable'} onClose={() => setModal(null)} title="Add receivable">
        <ReceivableForm
          members={state.members}
          initial={{ memberId: modal?.memberId || selected.id }}
          onSubmit={(data) => {
            dispatch({ type: 'ADD_RECEIVABLE', payload: data })
            toast('Receivable added ✓')
            setModal(null)
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>
    </>
  )
}
