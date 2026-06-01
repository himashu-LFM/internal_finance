import { Eye } from 'lucide-react'
import { usePool } from '../../context/PoolContext'

export function ReadOnlyBanner() {
  const { readOnly } = usePool()
  if (!readOnly) return null

  return (
    <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 text-sm text-slate-700 flex items-center gap-2">
      <Eye className="h-4 w-4 shrink-0" />
      <span>
        <strong>Read-only mode</strong> — you can view all data but cannot make changes. Contact an admin for edit access.
      </span>
    </div>
  )
}
