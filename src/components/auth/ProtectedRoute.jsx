import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageSkeleton } from '../ui/Skeleton'

export function ProtectedRoute({ children }) {
  const { isCloudEnabled, user, loading } = useAuth()
  const location = useLocation()

  if (!isCloudEnabled) return children

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-full max-w-4xl px-6">
          <PageSkeleton />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}
