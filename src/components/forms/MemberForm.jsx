import { useState } from 'react'
import { Input, Textarea, Select } from '../ui/Input'
import { Button } from '../ui/Button'

const empty = {
  name: '',
  email: '',
  department: '',
  targetAmount: '',
  status: 'active',
  notes: '',
}

export function MemberForm({ initial, members, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...empty,
    ...initial,
    targetAmount: initial?.targetAmount ?? '',
  }))
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    const dup = members.find(
      (m) => m.name.toLowerCase() === form.name.trim().toLowerCase() && m.id !== initial?.id
    )
    if (dup) e.name = 'A member with this name already exists'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    onSubmit({
      ...form,
      name: form.name.trim(),
      email: form.email?.trim() || undefined,
      department: form.department?.trim() || undefined,
      targetAmount: form.targetAmount ? Number(form.targetAmount) : undefined,
      notes: form.notes?.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full name"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        error={errors.name}
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Input
        label="Department"
        value={form.department}
        onChange={(e) => setForm({ ...form, department: e.target.value })}
      />
      <Input
        label="Target contribution (INR)"
        type="number"
        min="0"
        value={form.targetAmount}
        onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
      />
      <Select
        label="Status"
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value })}
        options={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
      />
      <Textarea
        label="Notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">{initial?.id ? 'Save changes' : 'Add member'}</Button>
      </div>
    </form>
  )
}
