import { supabase, isCloudEnabled } from './supabase'

export async function fetchPoolState() {
  if (!isCloudEnabled) return null
  const { data, error } = await supabase
    .from('pool_state')
    .select('data, updated_at')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw error
  if (!data?.data) return null
  return {
    ...data.data,
    lastSaved: data.updated_at || data.data.lastSaved,
  }
}

export async function savePoolState(state, userId) {
  if (!isCloudEnabled) return
  const payload = {
    ...state,
    lastSaved: new Date().toISOString(),
  }
  const { error } = await supabase.from('pool_state').upsert({
    id: 1,
    data: payload,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  })
  if (error) throw error
}

export function subscribePoolState(onUpdate) {
  if (!isCloudEnabled) return () => {}
  const channel = supabase
    .channel('pool-state-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pool_state' },
      (payload) => {
        const row = payload.new
        if (row?.data) {
          onUpdate({
            ...row.data,
            lastSaved: row.updated_at || row.data.lastSaved,
          })
        }
      }
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

export async function fetchAllProfiles() {
  if (!isCloudEnabled) return []
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function updateProfileAccess(userId, { can_edit, role }) {
  if (!isCloudEnabled) return
  const patch = {}
  if (typeof can_edit === 'boolean') patch.can_edit = can_edit
  if (role) patch.role = role
  const { error } = await supabase.from('user_profiles').update(patch).eq('id', userId)
  if (error) throw error
}

export async function countAdmins() {
  if (!isCloudEnabled) return 0
  const { count, error } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')
  if (error) throw error
  return count || 0
}

export async function upsertProfile(profile) {
  if (!isCloudEnabled) return
  const { error } = await supabase.from('user_profiles').upsert(profile)
  if (error) throw error
}

export async function fetchProfile(userId) {
  if (!isCloudEnabled) return null
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}
