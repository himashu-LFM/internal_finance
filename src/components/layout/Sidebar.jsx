import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  BarChart3,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { usePool } from '../../context/PoolContext'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/contributions', label: 'Contributions', icon: Wallet },
  { to: '/receivables', label: 'Receivables', icon: ArrowDownLeft },
  { to: '/payables', label: 'Payables', icon: ArrowUpRight },
  { to: '/ledger', label: 'Ledger', icon: BookOpen },
  { to: '/reports', label: 'Reports & Summary', icon: BarChart3 },
]

export function Sidebar() {
  const { state, stats } = usePool()
  const { isAdmin, isCloudEnabled, profile, signOut } = useAuth()
  const overdueCount = stats.overdueReceivables.length

  return (
    <aside className="no-print fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-[#0f172a] text-slate-300">
      <div className="border-b border-slate-700/50 px-5 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">Budget Pool</p>
            <p className="text-xs text-slate-400 truncate max-w-[140px]">
              {state.settings?.orgName || 'Internal Finance'}
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-500/20 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{label}</span>
            {to === '/receivables' && overdueCount > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                {overdueCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-700/50 p-3 space-y-0.5">
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                isActive ? 'bg-blue-500/20 text-white' : 'text-slate-400 hover:text-white'
              )
            }
          >
            <Shield className="h-5 w-5" />
            Admin
          </NavLink>
        )}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
              isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            )
          }
        >
          <Settings className="h-5 w-5" />
          Settings
        </NavLink>
        {isCloudEnabled && (
          <div className="px-3 pt-2">
            <p className="text-xs text-slate-500 truncate" title={profile?.email}>
              {profile?.email}
            </p>
            <button
              type="button"
              onClick={() => signOut()}
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
