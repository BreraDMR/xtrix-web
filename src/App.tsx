import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Visits from './pages/Visits'
import CalendarPage from './pages/CalendarPage'
import Services from './pages/Services'
import SpecialistProfile from './pages/SpecialistProfile'
import Employees from './pages/Employees'
import MySalary from './pages/MySalary'
import EmployeeSalary from './pages/EmployeeSalary'
import Layout from './components/Layout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  // Сначала проверяем синхронно при рендере
  const initialToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!initialToken)
  
  React.useEffect(() => {
    if (typeof window === 'undefined') {
      setIsAuthenticated(false)
      return
    }
    
    // Проверяем токен из localStorage
    const token = localStorage.getItem('auth_token')
    const hasToken = !!token
    
    // Подробное логирование
    const logMsg = `[PrivateRoute] Auth check: ${hasToken ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}, token length: ${token?.length || 0}`
    console.log(logMsg)
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]')
      logs.push(`[${new Date().toISOString()}] ${logMsg}`)
      if (logs.length > 100) logs.shift()
      localStorage.setItem('app_logs', JSON.stringify(logs))
    } catch {}
    
    if (!hasToken) {
      console.error('[PrivateRoute] No token found! Redirecting to login.')
      setIsAuthenticated(false)
      return
    }
    
    setIsAuthenticated(true)
    
    // Синхронизируем store с localStorage
    const storeToken = useAuthStore.getState().token
    if (!storeToken || storeToken !== token) {
      console.log('[PrivateRoute] Syncing store with localStorage')
      const userStr = localStorage.getItem('auth_user')
      let user = null
      try {
        user = userStr ? JSON.parse(userStr) : null
      } catch {}
      if (user) {
        useAuthStore.getState().setAuth(token, user)
      } else {
        useAuthStore.setState({ token })
      }
    }
  }, [])
  
  // Если не авторизован, сразу редиректим
  if (!isAuthenticated) {
    console.log('[PrivateRoute] Not authenticated, rendering Navigate')
    return <Navigate to="/login" replace />
  }
  
  console.log('[PrivateRoute] Authenticated, rendering children')
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="visits" element={<Visits />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="services" element={<Services />} />
          <Route path="profile" element={<SpecialistProfile />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id/salary" element={<EmployeeSalary />} />
          <Route path="my-salary" element={<MySalary />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

