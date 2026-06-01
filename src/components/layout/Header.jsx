import { useState, useRef, useEffect } from 'react'
import { Search, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePool } from '../../context/PoolContext'
import { globalSearch } from '../../utils/calculations'
import { cn } from '../../utils/cn'

export function Header() {
  const { state, stats } = usePool()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useRef(null)

  const results = query.trim() ? globalSearch(state, query) : null
  const hasResults =
    results &&
    (results.members.length +
      results.contributions.length +
      results.payables.length +
      results.receivables.length >
      0)

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const overdue = stats.overdueReceivables.length

  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      {overdue > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-800">
          <Bell className="inline h-4 w-4 mr-2 -mt-0.5" />
          {overdue} receivable{overdue > 1 ? 's are' : ' is'} overdue —{' '}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => navigate('/receivables')}
          >
            Review now
          </button>
        </div>
      )}
      <div className="flex h-14 items-center gap-4 px-6">
        <div ref={ref} className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search members, transactions, notes..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {open && query.trim() && (
            <div className="absolute top-full mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-80 overflow-y-auto">
              {!hasResults ? (
                <p className="p-4 text-sm text-slate-500">No results found</p>
              ) : (
                <SearchResults results={results} members={state.members} onNavigate={(path) => {
                  navigate(path)
                  setOpen(false)
                  setQuery('')
                }} />
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function SearchResults({ results, members, onNavigate }) {
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m.name]))

  return (
    <div className="py-2 text-sm">
      {results.members.length > 0 && (
        <Section title="Members">
          {results.members.map((m) => (
            <button
              key={m.id}
              type="button"
              className="block w-full px-4 py-2 text-left hover:bg-slate-50"
              onClick={() => onNavigate(`/members?member=${m.id}`)}
            >
              {m.name}
            </button>
          ))}
        </Section>
      )}
      {results.contributions.length > 0 && (
        <Section title="Contributions">
          {results.contributions.slice(0, 5).map((c) => (
            <button
              key={c.id}
              type="button"
              className="block w-full px-4 py-2 text-left hover:bg-slate-50"
              onClick={() => onNavigate('/contributions')}
            >
              {memberMap[c.memberId]} — ₹{c.amount}
            </button>
          ))}
        </Section>
      )}
      {results.receivables.length > 0 && (
        <Section title="Receivables">
          {results.receivables.slice(0, 5).map((r) => (
            <button
              key={r.id}
              type="button"
              className="block w-full px-4 py-2 text-left hover:bg-slate-50"
              onClick={() => onNavigate('/receivables')}
            >
              {r.description}
            </button>
          ))}
        </Section>
      )}
      {results.payables.length > 0 && (
        <Section title="Payables">
          {results.payables.slice(0, 5).map((p) => (
            <button
              key={p.id}
              type="button"
              className="block w-full px-4 py-2 text-left hover:bg-slate-50"
              onClick={() => onNavigate('/payables')}
            >
              {p.description}
            </button>
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="px-4 py-1 text-xs font-semibold uppercase text-slate-400">{title}</p>
      {children}
    </div>
  )
}
