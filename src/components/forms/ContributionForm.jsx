import { useState } from 'react'
import { Input, Textarea, Select } from '../ui/Input'
import { Button } from '../ui/Button'

const today = new Date().toISOString().slice(0, 10)

export function ContributionForm({ members, initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    memberId: initial?.memberId || '',
    amount: initial?.amount ?? '',
    date: initial?.date || today,
    method: initial?.method || 'upi',
    referenceNo: initial?.referenceNo || '',
    notes: initial?.notes || '',
    status: initial?.status || 'confirmed',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.memberId) e.memberId = 'Select a member'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter a valid amount'
    if (!form.date) e.date = 'Date is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    onSubmit({
      ...form,
      amount: Number(form.amount),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Member"
        required
        value={form.memberId}
        onChange={(e) => setForm({ ...form, memberId: e.target.value })}
        error={errors.memberId}
        placeholder="Select member..."
        options={members.filter((m) => m.status === 'active').map((m) => ({
          value: m.id,
          label: m.name,
        }))}
      />
      <Input
        label="Amount (INR)"
        type="number"
        required
        min="1"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
        error={errors.amount}
      />
      <Input
        label="Date received"
        type="date"
        required
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        error={errors.date}
      />
      <Select
        label="Payment method"
        value={form.method}
        onChange={(e) => setForm({ ...form, method: e.target.value })}
        options={[
          { value: 'cash', label: 'Cash' },
          { value: 'upi', label: 'UPI' },
          { value: 'bank_transfer', label: 'Bank Transfer' },
          { value: 'other', label: 'Other' },
        ]}
      />
      <Input
        label="Reference no."
        value={form.referenceNo}
        onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
      />
      <Select
        label="Status"
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value })}
        options={[
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'pending', label: 'Pending verification' },
        ]}
      />
      <Textarea
        label="Notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit">{initial?.id ? 'Update' : 'Add contribution'}</Button>
      </div>
    </form>
  )
}
