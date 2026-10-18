import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import PrivateRoute from './components/PrivateRoute'
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
import Business from './pages/Business'
import Subscription from './pages/Subscription'
import Inventory from './pages/Inventory'
import Finance from './pages/Finance'
import Analytics from './pages/Analytics'
import Loyalty from './pages/Loyalty'
import Settings from './pages/Settings'
import Layout from './components/Layout'

function App() {
  useTheme()
  return (
    <BrowserRouter>
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
          <Route path="business" element={<Business />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="finance" element={<Finance />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="loyalty" element={<Loyalty />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

