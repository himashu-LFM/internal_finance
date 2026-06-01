import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
  useState,
  useRef,
} from 'react'
import { getSeedState } from '../data/seed'
import { mergeInitialTeam } from '../data/initialTeam'
import { loadState, saveState, clearStorage } from '../hooks/useLocalStorage'
import { generateLedger } from '../utils/ledger'
import {
  getPoolBalance,
  getTotalCollected,
  getTotalReceivables,
  getTotalPayablesOutstanding,
  getOverdueReceivables,
  applyContributionToReceivables,
} from '../utils/calculations'
import { isCloudEnabled } from '../lib/supabase'
import { fetchPoolState, savePoolState, subscribePoolState } from '../lib/poolApi'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

const PoolContext = createContext(null)

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload
    case 'RESET':
      return getSeedState()
    case 'IMPORT':
      return { ...action.payload, lastSaved: new Date().toISOString() }
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      }
    case 'ADD_MEMBER': {
      const member = {
        ...action.payload,
        id: uid('m'),
        status: action.payload.status || 'active',
        createdAt: new Date().toISOString(),
      }
      return { ...state, members: [...state.members, member] }
    }
    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map((m) =>
          m.id === action.payload.id ? { ...m, ...action.payload } : m
        ),
      }
    case 'DELETE_MEMBER':
      return {
        ...state,
        members: state.members.filter((m) => m.id !== action.payload),
      }
    case 'ADD_CONTRIBUTION': {
      const contribution = {
        ...action.payload,
        id: uid('c'),
        createdAt: new Date().toISOString(),
      }
      let receivables = state.receivables
      if (contribution.status === 'confirmed') {
        receivables = applyContributionToReceivables(
          contribution,
          receivables,
          action.targetReceivableId
        )
      }
      return {
        ...state,
        contributions: [...state.contributions, contribution],
        receivables,
      }
    }
    case 'UPDATE_CONTRIBUTION': {
      const prev = state.contributions.find((c) => c.id === action.payload.id)
      const updated = { ...prev, ...action.payload }
      let receivables = state.receivables
      if (updated.status === 'confirmed' && prev?.status !== 'confirmed') {
        receivables = applyContributionToReceivables(
          updated,
          receivables,
          action.targetReceivableId
        )
      }
      return {
        ...state,
        contributions: state.contributions.map((c) =>
          c.id === action.payload.id ? updated : c
        ),
        receivables,
      }
    }
    case 'DELETE_CONTRIBUTION':
      return {
        ...state,
        contributions: state.contributions.filter((c) => c.id !== action.payload),
      }
    case 'BULK_CONFIRM_CONTRIBUTIONS': {
      let receivables = state.receivables
      const contributions = state.contributions.map((c) => {
        if (!action.ids.includes(c.id) || c.status === 'confirmed') return c
        const updated = { ...c, status: 'confirmed' }
        receivables = applyContributionToReceivables(updated, receivables)
        return updated
      })
      return { ...state, contributions, receivables }
    }
    case 'ADD_RECEIVABLE':
      return {
        ...state,
        receivables: [
          ...state.receivables,
          {
            ...action.payload,
            id: uid('r'),
            amountPaid: 0,
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
        ],
      }
    case 'UPDATE_RECEIVABLE':
      return {
        ...state,
        receivables: state.receivables.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload } : r
        ),
      }
    case 'DELETE_RECEIVABLE':
      return {
        ...state,
        receivables: state.receivables.filter((r) => r.id !== action.payload),
      }
    case 'WAIVE_RECEIVABLE':
      return {
        ...state,
        receivables: state.receivables.map((r) =>
          r.id === action.payload.id
            ? {
                ...r,
                status: 'waived',
                waivedReason: action.payload.reason,
                waivedAt: new Date().toISOString(),
              }
            : r
        ),
      }
    case 'ADD_PAYABLE': {
      const payable = {
        ...action.payload,
        id: uid('p'),
        status:
          action.payload.status ||
          (action.payload.paidById ? 'pending' : 'paid'),
        createdAt: new Date().toISOString(),
      }
      return { ...state, payables: [...state.payables, payable] }
    }
    case 'UPDATE_PAYABLE':
      return {
        ...state,
        payables: state.payables.map((p) =>
          p.id === action.payload.id
            ? {
                ...p,
                ...action.payload,
                reimbursedAt:
                  action.payload.status === 'reimbursed'
                    ? new Date().toISOString()
                    : p.reimbursedAt,
              }
            : p
        ),
      }
    case 'DELETE_PAYABLE':
      return {
        ...state,
        payables: state.payables.filter((p) => p.id !== action.payload),
      }
    default:
      return state
  }
}

function getLocalInitialState() {
  return mergeInitialTeam(loadState(getSeedState()))
}

export function PoolProvider({ children }) {
  const { canEdit, isAdmin, user, isCloudEnabled: cloud, authLoading } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [state, dispatch] = useReducer(reducer, () =>
    cloud ? getSeedState() : getLocalInitialState()
  )
  const skipSaveRef = useRef(false)
  const remoteSaveRef = useRef(false)

  // Load shared data from Supabase
  useEffect(() => {
    if (!cloud || authLoading) return
    if (!user) {
      setLoading(false)
      return
    }

    let unsub = () => {}

    async function load() {
      try {
        let data = await fetchPoolState()
        if (!data) {
          data = mergeInitialTeam(getSeedState())
          if (canEdit) {
            remoteSaveRef.current = true
            await savePoolState(data, user.id)
          }
        }
        skipSaveRef.current = true
        dispatch({ type: 'HYDRATE', payload: data })
      } catch (err) {
        console.error(err)
        toast('Failed to load shared data', 'error')
      } finally {
        setLoading(false)
      }
    }

    load()
    unsub = subscribePoolState((remote) => {
      if (remoteSaveRef.current) {
        remoteSaveRef.current = false
        return
      }
      skipSaveRef.current = true
      dispatch({ type: 'HYDRATE', payload: remote })
    })

    return () => unsub()
  }, [cloud, user?.id, authLoading, canEdit, toast])

  // Local-only mode loading
  useEffect(() => {
    if (cloud) return
    const t = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(t)
  }, [cloud])

  // Persist changes
  useEffect(() => {
    if (loading || skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }

    if (cloud) {
      if (!canEdit || !user) return
      const timer = setTimeout(async () => {
        try {
          remoteSaveRef.current = true
          await savePoolState(state, user.id)
        } catch (err) {
          console.error(err)
          toast('Failed to save — check connection', 'error')
        }
      }, 600)
      return () => clearTimeout(timer)
    }

    saveState(state)
  }, [state, loading, cloud, canEdit, user?.id, toast])

  const guardedDispatch = useCallback(
    (action) => {
      if (action.type === 'HYDRATE') {
        dispatch(action)
        return
      }
      if (cloud && !canEdit) {
        toast('You have read-only access. Ask an admin for edit permission.', 'error')
        return
      }
      if (action.type === 'RESET' && cloud && !isAdmin) {
        toast('Only admins can reset data', 'error')
        return
      }
      dispatch(action)
    },
    [cloud, canEdit, isAdmin, toast]
  )

  const ledger = useMemo(
    () =>
      generateLedger({
        contributions: state.contributions,
        payables: state.payables,
        receivables: state.receivables,
        settings: state.settings,
      }),
    [state.contributions, state.payables, state.receivables, state.settings]
  )

  const stats = useMemo(
    () => ({
      poolBalance: getPoolBalance(
        state.contributions,
        state.payables,
        state.settings
      ),
      totalCollected: getTotalCollected(state.contributions),
      totalReceivables: getTotalReceivables(state.receivables),
      totalPayables: getTotalPayablesOutstanding(state.payables),
      overdueReceivables: getOverdueReceivables(state.receivables),
    }),
    [state.contributions, state.payables, state.receivables, state.settings]
  )

  const getMember = useCallback(
    (id) => state.members.find((m) => m.id === id),
    [state.members]
  )

  const resetData = useCallback(() => {
    if (!cloud) clearStorage()
    dispatch({ type: 'RESET' })
  }, [cloud])

  const importData = useCallback(
    (data) => {
      guardedDispatch({ type: 'IMPORT', payload: data })
    },
    [guardedDispatch]
  )

  const value = useMemo(
    () => ({
      state,
      dispatch: guardedDispatch,
      ledger,
      stats,
      loading: loading || authLoading,
      getMember,
      resetData,
      importData,
      symbol: state.settings?.currencySymbol || '₹',
      canEdit: !cloud || canEdit,
      readOnly: cloud && !canEdit,
      isCloud: cloud,
    }),
    [
      state,
      guardedDispatch,
      ledger,
      stats,
      loading,
      authLoading,
      getMember,
      resetData,
      importData,
      canEdit,
      cloud,
    ]
  )

  return <PoolContext.Provider value={value}>{children}</PoolContext.Provider>
}

export function usePool() {
  const ctx = useContext(PoolContext)
  if (!ctx) throw new Error('usePool must be used within PoolProvider')
  return ctx
}
