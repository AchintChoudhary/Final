import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Home / Role Selection
import { Home } from './pages/Home';

// Driver Screens
import { DriverSignup } from './pages/driver/DriverSignup';
import { DriverLogin } from './pages/driver/DriverLogin';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { AddBusDetails } from './pages/driver/AddBusDetails';
import { RoutePreview } from './pages/driver/RoutePreview';
import { ActiveTrip } from './pages/driver/ActiveTrip';
import { DriverHistory } from './pages/driver/DriverHistory';

// Passenger Screens
import { PassengerSignup } from './pages/passenger/PassengerSignup';
import { PassengerLogin } from './pages/passenger/PassengerLogin';
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
          {/* Landing Role Selection */}
          <Route path="/" element={<Home />} />

          {/* DRIVER ROUTES */}
          <Route path="/driver/signup" element={<DriverSignup />} />
          <Route path="/driver/login" element={<DriverLogin />} />
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
          <Route path="/passenger/signup" element={<PassengerSignup />} />
          <Route path="/passenger/login" element={<PassengerLogin />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
