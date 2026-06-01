import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { supabase, isCloudEnabled, getAdminEmail } from '../lib/supabase'
import {
  fetchProfile,
  upsertProfile,
  countAdmins,
  fetchAllProfiles,
  updateProfileAccess,
} from '../lib/poolApi'

const AuthContext = createContext(null)

function derivePermissions(profile) {
  if (!profile) {
    return { isAdmin: false, canEdit: false, role: 'viewer', readOnly: true }
  }
  const isAdmin = profile.role === 'admin'
  const canEdit = isAdmin || profile.can_edit === true
  return {
    isAdmin,
    canEdit,
    role: profile.role,
    readOnly: !canEdit,
  }
}

async function ensureProfile(user) {
  let profile = await fetchProfile(user.id)
  if (profile) return profile

  const adminEmail = getAdminEmail()
  const email = (user.email || '').toLowerCase()
  const admins = await countAdmins()
  const shouldBeAdmin =
    admins === 0 || (adminEmail && email === adminEmail)

  profile = {
    id: user.id,
    email: user.email,
    role: shouldBeAdmin ? 'admin' : 'viewer',
    can_edit: shouldBeAdmin,
    display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
  }
  await upsertProfile(profile)
  return profile
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(isCloudEnabled)

  const refreshProfiles = useCallback(async () => {
    if (!isCloudEnabled) return
    const list = await fetchAllProfiles()
    setProfiles(list)
  }, [])

  const loadSession = useCallback(async () => {
    if (!isCloudEnabled) {
      setLoading(false)
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const p = await ensureProfile(session.user)
      setUser(session.user)
      setProfile(p)
      await refreshProfiles()
    } else {
      setUser(null)
      setProfile(null)
    }
    setLoading(false)
  }, [refreshProfiles])

  useEffect(() => {
    loadSession()
    if (!isCloudEnabled) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const p = await ensureProfile(session.user)
        setUser(session.user)
        setProfile(p)
        await refreshProfiles()
      } else {
        setUser(null)
        setProfile(null)
        setProfiles([])
      }
    })
    return () => subscription.unsubscribe()
  }, [loadSession, refreshProfiles])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setProfiles([])
  }, [])

  const setUserEditAccess = useCallback(
    async (userId, canEdit) => {
      const target = profiles.find((p) => p.id === userId)
      if (!target || target.role === 'admin') return
      await updateProfileAccess(userId, {
        can_edit: canEdit,
        role: canEdit ? 'editor' : 'viewer',
      })
      await refreshProfiles()
      if (userId === user?.id) {
        const updated = await fetchProfile(userId)
        setProfile(updated)
      }
    },
    [profiles, refreshProfiles, user?.id]
  )

  const permissions = useMemo(() => derivePermissions(profile), [profile])

  const value = useMemo(
    () => ({
      user,
      profile,
      profiles,
      loading,
      isCloudEnabled,
      ...permissions,
      signIn,
      signUp,
      signOut,
      refreshProfiles,
      setUserEditAccess,
      reloadProfile: async () => {
        if (!user) return
        const p = await fetchProfile(user.id)
        setProfile(p)
      },
    }),
    [
      user,
      profile,
      profiles,
      loading,
      permissions,
      signIn,
      signUp,
      signOut,
      refreshProfiles,
      setUserEditAccess,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
