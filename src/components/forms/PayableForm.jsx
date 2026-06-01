import { useState } from 'react'
import { Input, Textarea, Select } from '../ui/Input'
import { Button } from '../ui/Button'

const today = new Date().toISOString().slice(0, 10)

export function PayableForm({ members, initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    description: initial?.description || '',
    category: initial?.category || 'misc',
    amount: initial?.amount ?? '',
    date: initial?.date || today,
    paidTo: initial?.paidTo || '',
    paidById: initial?.paidById || '',
    method: initial?.method || 'upi',
    receiptRef: initial?.receiptRef || '',
    status: initial?.status || 'paid',
    notes: initial?.notes || '',
  })
  const [errors, setErrors] = useState({})

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const e = {}
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter valid amount'
    setErrors(e)
    if (Object.keys(e).length) return
    const payload = {
      ...form,
      amount: Number(form.amount),
      paidById: form.paidById || undefined,
      paidTo: form.paidTo || undefined,
    }
    if (payload.paidById && !initial?.id) payload.status = 'pending'
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Description"
        required
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        error={errors.description}
      />
      <Select
        label="Category"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        options={['food', 'travel', 'office', 'utility', 'misc'].map((c) => ({
          value: c,
          label: c.charAt(0).toUpperCase() + c.slice(1),
        }))}
      />
      <Input
        label="Amount (INR)"
        type="number"
        required
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
        error={errors.amount}
      />
      <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      <Input label="Paid to" value={form.paidTo} onChange={(e) => setForm({ ...form, paidTo: e.target.value })} />
      <Select
        label="Paid by (member — reimbursable)"
        value={form.paidById}
        onChange={(e) => setForm({ ...form, paidById: e.target.value })}
        placeholder="Pool expense (none)"
        options={members.map((m) => ({ value: m.id, label: m.name }))}
      />
      <Select
        label="Payment method"
        value={form.method}
        onChange={(e) => setForm({ ...form, method: e.target.value })}
        options={[
          { value: 'cash', label: 'Cash' },
          { value: 'upi', label: 'UPI' },
          { value: 'card', label: 'Card' },
          { value: 'other', label: 'Other' },
        ]}
      />
      <Input
        label="Receipt reference"
        value={form.receiptRef}
        onChange={(e) => setForm({ ...form, receiptRef: e.target.value })}
      />
      <Select
        label="Status"
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value })}
        options={[
          { value: 'pending', label: 'Pending / Pending Reimbursement' },
          { value: 'paid', label: 'Paid' },
          { value: 'reimbursed', label: 'Reimbursed' },
        ]}
      />
      <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit">{initial?.id ? 'Update' : 'Add payable'}</Button>
      </div>
    </form>
  )
}
