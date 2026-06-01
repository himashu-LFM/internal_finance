import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { usePool } from '../../context/PoolContext'
import { PageSkeleton } from '../ui/Skeleton'
import { formatDateTime } from '../../utils/calculations'

export function Layout() {
  const { loading, state } = usePool()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] pl-64">
        <PageSkeleton />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
        <footer className="no-print border-t border-slate-200 px-6 py-3 text-xs text-slate-500">
          Last saved: {state.lastSaved ? formatDateTime(state.lastSaved) : '—'} · Data stored locally
        </footer>
      </div>
    </div>
  )
}
