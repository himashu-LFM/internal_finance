import { useState, useRef } from 'react'
import { usePool } from '../context/PoolContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { ConfirmDialog } from '../components/ui/Modal'
import { exportJsonBackup } from '../utils/export'
import { clearStorage } from '../hooks/useLocalStorage'
import { getSeedState } from '../data/seed'

export default function Settings() {
  const { state, dispatch, resetData, importData, isCloud } = usePool()
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState({ ...state.settings })
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef(null)

  const saveSettings = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: form })
    toast('Settings saved ✓')
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!data.members || !data.contributions) {
          toast('Invalid backup file', 'error')
          return
        }
        importData(data)
        toast('Data imported successfully ✓')
      } catch {
        toast('Failed to parse JSON', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleReset = () => {
    clearStorage()
    resetData()
    setForm({ ...getSeedState().settings })
    toast('Data reset to sample seed')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-slate-500">Organization preferences and data management</p>
      </div>

      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Organization / team name"
            value={form.orgName}
            onChange={(e) => setForm({ ...form, orgName: e.target.value })}
          />
          <Input
            label="Currency symbol"
            value={form.currencySymbol}
            onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
          />
          <Input
            label="Default contribution target (INR)"
            type="number"
            value={form.defaultTargetAmount}
            onChange={(e) => setForm({ ...form, defaultTargetAmount: Number(e.target.value) })}
          />
          <Input
            label="Opening balance (INR)"
            type="number"
            value={form.openingBalance}
            onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })}
          />
          <Button onClick={saveSettings}>Save settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Backup & restore</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Export all data as JSON for backup, or import a previous backup file.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportJsonBackup(state)}>
              Export JSON backup
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Import from JSON
            </Button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>
        </CardContent>
      </Card>

      {(!isCloud || isAdmin) && (
        <Card className="border-red-200">
          <CardHeader><CardTitle className="text-red-700">Danger zone</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Reset all data to empty. This affects everyone when using shared cloud data.
              {isCloud && ' Admin only.'}
            </p>
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              Reset all data
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleReset}
        title="Reset all data?"
        message="This will erase your local data and restore sample seed data."
        confirmLabel="Reset everything"
        danger
      />
    </div>
  )
}
