import { useState, useEffect, useCallback } from 'react'
import { normalizePoolState } from '../utils/normalizeState'

const STORAGE_KEY = 'budget-pool-state-v2'

export function loadState(fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    return normalizePoolState(JSON.parse(raw))
  } catch {
    return fallback
  }
}

export function saveState(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...state, lastSaved: new Date().toISOString() })
  )
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
}

export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value) => {
      const next = typeof value === 'function' ? value(stored) : value
      setStored(next)
      window.localStorage.setItem(key, JSON.stringify(next))
    },
    [key, stored]
  )

  useEffect(() => {
    const handler = (e) => {
      if (e.key === key && e.newValue) {
        setStored(JSON.parse(e.newValue))
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [key])

  return [stored, setValue]
}

export { STORAGE_KEY }
