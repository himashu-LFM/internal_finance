import { Shield, Pencil, Eye } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Navigate } from 'react-router-dom'
import { formatDateTime } from '../utils/calculations'

export default function Admin() {
  const { isAdmin, profiles, setUserEditAccess, user, refreshProfiles } = useAuth()
  const { toast } = useToast()

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  const handleToggle = async (profile) => {
    if (profile.role === 'admin') return
    try {
      await setUserEditAccess(profile.id, !profile.can_edit)
      toast(
        profile.can_edit
          ? `Revoked edit access for ${profile.email}`
          : `Granted edit access to ${profile.email}`
      )
    } catch {
      toast('Failed to update access', 'error')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="h-7 w-7 text-blue-500" />
          Admin panel
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Control who can edit the shared budget pool. You are signed in as{' '}
          <strong>{user?.email}</strong>.
        </p>
      </div>

      <Card className="border-blue-100 bg-blue-50/50">
        <CardContent className="pt-6 text-sm text-slate-700">
          <p>
            <strong>Viewers</strong> see the same data as everyone else but cannot add or change records.
          </p>
          <p className="mt-2">
            <strong>Editors</strong> can manage members, contributions, receivables, and payables.
          </p>
          <p className="mt-2">
            Ask teammates to <strong>sign up</strong> with their work email, then grant edit access below.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Users & access</CardTitle>
          <Button variant="outline" size="sm" onClick={() => refreshProfiles()}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Joined</th>
                  <th className="pb-3 font-medium text-right">Edit access</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => {
                  const isSelf = p.id === user?.id
                  const isAdminUser = p.role === 'admin'
                  return (
                    <tr key={p.id} className="border-b border-slate-50">
                      <td className="py-3">
                        {p.email}
                        {isSelf && (
                          <span className="ml-2 text-xs text-slate-400">(you)</span>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge variant={isAdminUser ? 'info' : p.can_edit ? 'success' : 'outline'}>
                          {p.role}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-500">{formatDateTime(p.created_at)}</td>
                      <td className="py-3 text-right">
                        {isAdminUser ? (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Pencil className="h-3 w-3" /> Full access
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant={p.can_edit ? 'outline' : 'primary'}
                            onClick={() => handleToggle(p)}
                          >
                            {p.can_edit ? (
                              <>
                                <Eye className="h-3 w-3" /> Revoke edit
                              </>
                            ) : (
                              <>
                                <Pencil className="h-3 w-3" /> Grant edit
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {profiles.length === 0 && (
              <p className="text-sm text-slate-500 py-8 text-center">No users yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
