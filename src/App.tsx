import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import PrivateRoute from './components/PrivateRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientWorkspace from './components/clients/ClientWorkspace'
import Visits from './pages/Visits'
import CalendarPage from './pages/CalendarPage'
import Schedule from './pages/Schedule'
import Services from './pages/Services'
import Questionnaires from './pages/Questionnaires'
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
import NotificationSettings from './pages/NotificationSettings'
import Waitlist from './pages/Waitlist'
import NotFound from './pages/NotFound'
import BookingPage from './pages/booking/BookingPage'
import ManageBookingPage from './pages/booking/ManageBooking'
import WaitlistOfferPage from './pages/booking/WaitlistOffer'
import QuestionnairePage from './pages/booking/Questionnaire'
import PaymentReturn, { SandboxCheckout } from './pages/booking/PaymentReturn'
import PortalLogin from './pages/client/PortalLogin'
import ClientPortal from './pages/client/Portal'
import LegacyHistory from './pages/client/LegacyHistory'
import Layout from './components/Layout'
import { LegacyRedirect, ParameterizedLegacyRedirect } from './utils/routing'

function App() {
  useTheme()
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/booking/:slug" element={<BookingPage />} />
        <Route path="/manage" element={<ManageBookingPage />} />
        <Route path="/waitlist/offer" element={<WaitlistOfferPage />} />
        <Route path="/questionnaire" element={<QuestionnairePage />} />
        <Route path="/payment/sandbox" element={<SandboxCheckout />} />
        <Route path="/payment/return" element={<PaymentReturn />} />
        <Route path="/client" element={<ClientPortal />} />
        <Route path="/client/portal" element={<PortalLogin />} />
        <Route path="/client/history" element={<LegacyHistory />} />

        {/* Legacy CRM routes redirecting to /app/... while preserving query and hash */}
        <Route path="/clients" element={<LegacyRedirect target="/app/clients" />} />
        <Route path="/visits" element={<LegacyRedirect target="/app/visits" />} />
        <Route path="/calendar" element={<LegacyRedirect target="/app/calendar" />} />
        <Route path="/services" element={<LegacyRedirect target="/app/services" />} />
        <Route path="/profile" element={<LegacyRedirect target="/app/profile" />} />
        <Route path="/employees" element={<LegacyRedirect target="/app/employees" />} />
        <Route
          path="/employees/:id/salary"
          element={
            <ParameterizedLegacyRedirect
              targetTemplate={(params) => `/app/employees/${params.id}/salary`}
            />
          }
        />
        <Route path="/my-salary" element={<LegacyRedirect target="/app/my-salary" />} />
        <Route path="/business" element={<LegacyRedirect target="/app/business" />} />
        <Route path="/inventory" element={<LegacyRedirect target="/app/inventory" />} />
        <Route path="/finance" element={<LegacyRedirect target="/app/finance" />} />
        <Route path="/analytics" element={<LegacyRedirect target="/app/analytics" />} />
        <Route path="/loyalty" element={<LegacyRedirect target="/app/loyalty" />} />
        <Route path="/subscription" element={<LegacyRedirect target="/app/subscription" />} />
        <Route path="/settings" element={<LegacyRedirect target="/app/settings" />} />

        {/* Authenticated workspace */}
        <Route
          path="/app"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:clientId" element={<ClientWorkspace />} />
          <Route path="visits" element={<Visits />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="schedules" element={<Schedule />} />
          <Route path="services" element={<Services />} />
          <Route path="questionnaires" element={<Questionnaires />} />
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
          <Route path="notifications" element={<NotificationSettings />} />
          <Route path="waitlist" element={<Waitlist />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 handler */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
