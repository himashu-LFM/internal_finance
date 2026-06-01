import { useState } from 'react'
import { Input, Textarea, Select } from '../ui/Input'
import { Button } from '../ui/Button'

const today = new Date().toISOString().slice(0, 10)

export function ReceivableForm({ members, initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    memberId: initial?.memberId || '',
    amount: initial?.amount ?? '',
    dueDate: initial?.dueDate || today,
    description: initial?.description || '',
    notes: initial?.notes || '',
  })
  const [errors, setErrors] = useState({})

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const e = {}
    if (!form.memberId) e.memberId = 'Select a member'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter valid amount'
    if (!form.description.trim()) e.description = 'Description is required'
    setErrors(e)
    if (Object.keys(e).length) return
    onSubmit({ ...form, amount: Number(form.amount), description: form.description.trim() })
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
        options={members.map((m) => ({ value: m.id, label: m.name }))}
      />
      <Input
        label="Amount due (INR)"
        type="number"
        required
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
        error={errors.amount}
      />
      <Input
        label="Due date"
        type="date"
        required
        value={form.dueDate}
        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
      />
      <Input
        label="Description / reason"
        required
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        error={errors.description}
      />
      <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit">{initial?.id ? 'Update' : 'Add receivable'}</Button>
      </div>
    </form>
  )
}
