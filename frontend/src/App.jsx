import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Home
import { Home } from './pages/Home';

// Driver Screens (Screens 1 to 6)
import { DriverSignup } from './pages/driver/DriverSignup';
import { DriverLogin } from './pages/driver/DriverLogin';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { AddBusDetails } from './pages/driver/AddBusDetails';
import { RoutePreview } from './pages/driver/RoutePreview';
import { ActiveTrip } from './pages/driver/ActiveTrip';
import { DriverHistory } from './pages/driver/DriverHistory';

// Passenger Screens (Screens 7 to 12)
import { PassengerSignup } from './pages/passenger/PassengerSignup';
import { PassengerLogin } from './pages/passenger/PassengerLogin';
import { SearchBuses } from './pages/passenger/SearchBuses';
import { AvailableBuses } from './pages/passenger/AvailableBuses';
import { LiveTracking } from './pages/passenger/LiveTracking';
import { MyTrip } from './pages/passenger/MyTrip';
import { PassengerHistory } from './pages/passenger/PassengerHistory';

// Admin Screens (Screens 13 to 18)
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageBuses } from './pages/admin/ManageBuses';
import { AddRoute } from './pages/admin/AddRoute';
import { AuthorizeStudents } from './pages/admin/AuthorizeStudents';
import { AdminLiveMap } from './pages/admin/AdminLiveMap';
import { ManageDrivers } from './pages/admin/ManageDrivers';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Portal Selection */}
          <Route path="/" element={<Home />} />

          {/* DRIVER SCREENS */}
          {/* Screen 1: Driver Signup */}
          <Route path="/driver/signup" element={<DriverSignup />} />
          {/* Screen 2: Driver Login */}
          <Route path="/driver/login" element={<DriverLogin />} />
          {/* Screen 3: Driver Dashboard */}
          <Route
            path="/driver/dashboard"
            element={
              <ProtectedRoute allowedRoles={['DRIVER']}>
                <DriverDashboard />
              </ProtectedRoute>
            }
          />
          {/* Screen 4: Add Bus Details */}
          <Route
            path="/driver/bus-details"
            element={
              <ProtectedRoute allowedRoles={['DRIVER']}>
                <AddBusDetails />
              </ProtectedRoute>
            }
          />
          {/* Screen 5: Route Preview */}
          <Route
            path="/driver/route-preview"
            element={
              <ProtectedRoute allowedRoles={['DRIVER']}>
                <RoutePreview />
              </ProtectedRoute>
            }
          />
          {/* Screen 6: Driver Active Trip */}
          <Route
            path="/driver/active-trip"
            element={
              <ProtectedRoute allowedRoles={['DRIVER']}>
                <ActiveTrip />
              </ProtectedRoute>
            }
          />
          {/* Driver Trip History */}
          <Route
            path="/driver/history"
            element={
              <ProtectedRoute allowedRoles={['DRIVER']}>
                <DriverHistory />
              </ProtectedRoute>
            }
          />

          {/* PASSENGER SCREENS */}
          {/* Screen 7: Passenger Signup */}
          <Route path="/passenger/signup" element={<PassengerSignup />} />
          {/* Screen 8: Passenger Login */}
          <Route path="/passenger/login" element={<PassengerLogin />} />
          {/* Screen 9: Search Buses */}
          <Route
            path="/passenger/search"
            element={
              <ProtectedRoute allowedRoles={['PASSENGER']}>
                <SearchBuses />
              </ProtectedRoute>
            }
          />
          {/* Screen 10: Available Buses */}
          <Route
            path="/passenger/available-buses"
            element={
              <ProtectedRoute allowedRoles={['PASSENGER']}>
                <AvailableBuses />
              </ProtectedRoute>
            }
          />
          {/* Screen 11: Passenger Live Tracking */}
          <Route
            path="/passenger/tracking/:tripId"
            element={
              <ProtectedRoute allowedRoles={['PASSENGER']}>
                <LiveTracking />
              </ProtectedRoute>
            }
          />
          {/* Screen 12: Passenger My Trip / Route Progress */}
          <Route
            path="/passenger/trip/:tripId"
            element={
              <ProtectedRoute allowedRoles={['PASSENGER']}>
                <MyTrip />
              </ProtectedRoute>
            }
          />
          {/* Passenger History */}
          <Route
            path="/passenger/history"
            element={
              <ProtectedRoute allowedRoles={['PASSENGER']}>
                <PassengerHistory />
              </ProtectedRoute>
            }
          />

          {/* ADMIN SCREENS */}
          {/* Screen 13: Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />
          {/* Screen 14: Admin Dashboard */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          {/* Screen 15: Manage Buses */}
          <Route
            path="/admin/buses"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ManageBuses />
              </ProtectedRoute>
            }
          />
          {/* Screen 16: Add Route & Stops */}
          <Route
            path="/admin/routes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AddRoute />
              </ProtectedRoute>
            }
          />
          {/* Screen 17: Authorize Students */}
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AuthorizeStudents />
              </ProtectedRoute>
            }
          />
          {/* Screen 18: Admin Fleet Live Map */}
          <Route
            path="/admin/live-map"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLiveMap />
              </ProtectedRoute>
            }
          />
          {/* Admin Drivers */}
          <Route
            path="/admin/drivers"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ManageDrivers />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
