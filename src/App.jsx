import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PoolProvider } from './context/PoolContext'
import { ToastProvider } from './context/ToastContext'
import { Layout } from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Contributions from './pages/Contributions'
import Receivables from './pages/Receivables'
import Payables from './pages/Payables'
import Ledger from './pages/Ledger'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

export default function App() {
  return (
    <PoolProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="members" element={<Members />} />
              <Route path="contributions" element={<Contributions />} />
              <Route path="receivables" element={<Receivables />} />
              <Route path="payables" element={<Payables />} />
              <Route path="ledger" element={<Ledger />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </PoolProvider>
  )
}
