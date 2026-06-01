import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent } from '../components/ui/Card'

export default function Login() {
  const { signIn, signUp, user, isCloudEnabled, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isCloudEnabled) {
    return <Navigate to="/dashboard" replace />
  }

  if (!loading && user) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'signin') await signIn(email.trim(), password)
      else await signUp(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 mb-4">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Budget Pool</h1>
            <p className="text-sm text-slate-500 mt-1 text-center">
              Sign in to view shared team finances
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'signin' ? (
              <>
                New here?{' '}
                <button type="button" className="text-blue-600 font-medium" onClick={() => setMode('signup')}>
                  Create account
                </button>
              </>
            ) : (
              <>
                Have an account?{' '}
                <button type="button" className="text-blue-600 font-medium" onClick={() => setMode('signin')}>
                  Sign in
                </button>
              </>
            )}
          </p>
          <p className="mt-4 text-xs text-slate-400 text-center">
            The email in VITE_ADMIN_EMAIL is granted admin on first login.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
