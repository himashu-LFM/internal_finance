import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PoolProvider } from './context/PoolContext'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Contributions from './pages/Contributions'
import Receivables from './pages/Receivables'
import Payables from './pages/Payables'
import Ledger from './pages/Ledger'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Admin from './pages/Admin'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <PoolProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="members" element={<Members />} />
                <Route path="contributions" element={<Contributions />} />
                <Route path="receivables" element={<Receivables />} />
                <Route path="payables" element={<Payables />} />
                <Route path="ledger" element={<Ledger />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="admin" element={<Admin />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PoolProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
