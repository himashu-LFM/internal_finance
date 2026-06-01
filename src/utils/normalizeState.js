import { DEFAULT_SETTINGS, getSeedState } from '../data/seed'

/** Ensure pool state always has arrays + settings (fixes empty/partial Supabase rows). */
export function normalizePoolState(raw) {
  const base = getSeedState()
  if (!raw || typeof raw !== 'object') return base

  return {
    members: Array.isArray(raw.members) ? raw.members : [],
    contributions: Array.isArray(raw.contributions) ? raw.contributions : [],
    receivables: Array.isArray(raw.receivables) ? raw.receivables : [],
    payables: Array.isArray(raw.payables) ? raw.payables : [],
    settings: {
      ...DEFAULT_SETTINGS,
      ...(raw.settings && typeof raw.settings === 'object' ? raw.settings : {}),
    },
    lastSaved: raw.lastSaved || base.lastSaved,
  }
}
