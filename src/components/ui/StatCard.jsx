import { cn } from '../../utils/cn'
import { formatAmount } from '../../utils/calculations'

export function StatCard({ label, value, symbol, icon: Icon, variant = 'default', subtext }) {
  const colors = {
    default: 'text-slate-900',
    success: 'text-green-600',
    danger: 'text-red-600',
    warning: 'text-amber-600',
    primary: 'text-blue-600',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <div className="rounded-lg bg-slate-50 p-2">
            <Icon className="h-4 w-4 text-slate-500" />
          </div>
        )}
      </div>
      <p className={cn('mt-2 text-2xl font-semibold font-amount', colors[variant])}>
        {typeof value === 'number' ? formatAmount(value, symbol) : value}
      </p>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  )
}
