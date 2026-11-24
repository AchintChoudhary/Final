import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Unified Auth Screens
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';

// Driver Screens
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { AddBusDetails } from './pages/driver/AddBusDetails';
import { RoutePreview } from './pages/driver/RoutePreview';
import { ActiveTrip } from './pages/driver/ActiveTrip';
import { DriverHistory } from './pages/driver/DriverHistory';

// Passenger Screens
import { SearchBuses } from './pages/passenger/SearchBuses';
import { AvailableBuses } from './pages/passenger/AvailableBuses';
import { LiveTracking } from './pages/passenger/LiveTracking';
import { MyTrip } from './pages/passenger/MyTrip';
import { PassengerHistory } from './pages/passenger/PassengerHistory';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing: Redirect straight to Unified Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Unified Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Legacy Auth Redirects */}
          <Route path="/driver/login" element={<Navigate to="/login?role=driver" replace />} />
          <Route path="/driver/signup" element={<Navigate to="/signup?role=driver" replace />} />
          <Route path="/passenger/login" element={<Navigate to="/login?role=passenger" replace />} />
          <Route path="/passenger/signup" element={<Navigate to="/signup?role=passenger" replace />} />

          {/* DRIVER ROUTES */}
          <Route
            path="/driver/dashboard"
            element={
              <ProtectedRoute allowedRoles={['DRIVER']}>
                <DriverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/bus-details"
            element={
              <ProtectedRoute allowedRoles={['DRIVER']}>
                <AddBusDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/route-preview"
            element={
              <ProtectedRoute allowedRoles={['DRIVER']}>
                <RoutePreview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/active-trip"
            element={
              <ProtectedRoute allowedRoles={['DRIVER']}>
                <ActiveTrip />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/history"
            element={
              <ProtectedRoute allowedRoles={['DRIVER']}>
                <DriverHistory />
              </ProtectedRoute>
            }
          />

          {/* PASSENGER ROUTES */}
          <Route
            path="/passenger/search"
            element={
              <ProtectedRoute allowedRoles={['PASSENGER']}>
                <SearchBuses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/passenger/available-buses"
            element={
              <ProtectedRoute allowedRoles={['PASSENGER']}>
                <AvailableBuses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/passenger/tracking/:tripId"
            element={
              <ProtectedRoute allowedRoles={['PASSENGER']}>
                <LiveTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/passenger/trip/:tripId"
            element={
              <ProtectedRoute allowedRoles={['PASSENGER']}>
                <MyTrip />
              </ProtectedRoute>
            }
          />
          <Route
            path="/passenger/history"
            element={
              <ProtectedRoute allowedRoles={['PASSENGER']}>
                <PassengerHistory />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
