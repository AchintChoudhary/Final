# Real-Time Public Transport Tracking System

A full-stack MERN application built for college major project presentation and portfolio showcasing. Features real device GPS tracking, road geometry routing via Geoapify, middle-of-route bus discovery using Turf.js, Socket.IO live communication, and an 18-screen responsive UI matching modern transit standards.

---

## 📸 18-Screen Design Implementation

The system faithfully implements the 18 reference screens across 3 distinct role portals:

### Driver Portal
- **Screen 1 — Driver Signup** (`/driver/signup`): Full Name, Mobile Number, Password, Confirm Password, validation.
- **Screen 2 — Driver Login** (`/driver/login`): Mobile Number and Password authentication.
- **Screen 3 — Driver Dashboard** (`/driver/dashboard`): Sidebar `#1E304C`, Current Trip card, status badge, Start Trip, Quick Actions.
- **Screen 4 — Add Bus Details** (`/driver/bus-details`): Bus Name, Plate Number, Start Location, Final Destination with Geoapify autocomplete.
- **Screen 5 — Route Preview** (`/driver/route-preview`): Interactive Leaflet map with Geoapify road polyline, distance & estimated duration, route confirmation.
- **Screen 6 — Driver Active Trip** (`/driver/active-trip`): Real device GPS watching (`navigator.geolocation.watchPosition`), live Leaflet map, location pulse, Stop Trip with confirmation dialog.
- **Driver History** (`/driver/history`): Completed past trips log.

### Passenger Portal
- **Screen 7 — Passenger Signup** (`/passenger/signup`): Account registration with 10-digit mobile number.
- **Screen 8 — Passenger Login** (`/passenger/login`): Mobile authentication with JWT session.
- **Screen 9 — Search Buses** (`/passenger/search`): Pickup location with "Use Current Location" GPS button, destination input, Geoapify autocomplete.
- **Screen 10 — Available Buses** (`/passenger/available-buses`): Middle-of-route discovery results showing eligible approaching buses with plate numbers and route ETA badges.
- **Screen 11 — Passenger Live Tracking** (`/passenger/tracking/:tripId`): Real-time bus movement on Leaflet map via Socket.IO, pickup & destination markers, last GPS update timestamp.
- **Screen 12 — My Trip / Route Progress** (`/passenger/trip/:tripId`): Ordered stop timeline with passed stops (green check), approaching stop (blue pulsing badge), and upcoming stops.
- **Passenger History** (`/passenger/history`): History of tracked trips.

### Admin Portal
- **Screen 13 — Admin Login** (`/admin/login`): Controlled admin panel authentication.
- **Screen 14 — Admin Dashboard** (`/admin/dashboard`): 4 Stats cards (Total Buses, Total Drivers, Total Students, Active Trips), recent active trips table.
- **Screen 15 — Manage Buses** (`/admin/buses`): Bus fleet table, status badges, driver assignment, '+ Add Bus' modal.
- **Screen 16 — Add Route & Stops** (`/admin/routes`): Route creation, reorderable stops list with up/down controls, Geoapify road routing.
- **Screen 17 — Authorize Students** (`/admin/students`): Student access table, status toggling, CSV bulk import modal.
- **Screen 18 — Admin Live Map** (`/admin/live-map`): Interactive fleet map showing all live active buses simultaneously in real time with map legend.
- **Manage Drivers** (`/admin/drivers`): Driver registry.

---

## 🚀 Key Architectural Highlights

1. **Middle-of-Route Bus Discovery (`RouteMatchingService`)**:
   - Uses **Turf.js** to project passenger pickup and destination points onto confirmed road polylines.
   - Enforces topological ordering: `busProgress < pickupProgress < destinationProgress`.
   - **Excludes buses that have already passed the passenger's pickup location.**
   - Excludes buses traveling in reverse directions or on parallel roadways outside tolerance.

2. **Real GPS Tracking (`navigator.geolocation`)**:
   - High-accuracy GPS watch transmitted via Socket.IO (`driver:location`).
   - Plausibility checks, sequence numbers, and max accuracy filtering (<= 100m).
   - Stale GPS and connection watchdog emitting `trip:trackingUnavailable` when inactive.

3. **Strict Zero Dummy Data Policy**:
   - Empty states rendered cleanly when database records do not exist.
   - All buses, drivers, routes, trips, and GPS coordinates originate from real user input or actual device coordinates.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React icons, React Router DOM v7, Leaflet, Socket.IO Client, Axios.
- **Backend**: Node.js v22 (ES Modules), Express.js, MongoDB / Mongoose, Socket.IO, Turf.js, bcryptjs, JSON Web Tokens (JWT), express-validator, helmet, cors.
- **Maps & Geolocation**: Geoapify Routing & Autocomplete API, Leaflet map tiles (OpenStreetMap / CartoDB).

---

## ⚙️ Environment Configuration

### Backend Configuration (`backend/.env`):

```env
NODE_ENV=development
PORT=5000

# MongoDB URI (Set your local mongod or MongoDB Atlas connection string)
MONGODB_URI=mongodb://127.0.0.1:27017/transport_tracking

# JWT Configuration
JWT_SECRET=super_secret_transport_jwt_key_2026_dev
JWT_EXPIRES_IN=7d

# Geoapify API Key (Register free at https://www.geoapify.com/)
GEOAPIFY_API_KEY=your_geoapify_api_key_here

# Frontend Client URL
CLIENT_URL=http://localhost:5173

# GPS Thresholds
GPS_UPDATE_INTERVAL_MS=5000
GPS_STALE_WARNING_MS=30000
GPS_UNAVAILABLE_MS=120000

ROUTE_MATCH_TOLERANCE_METERS=500
GPS_MAX_ACCURACY_METERS=100
ETA_REFRESH_INTERVAL_MS=60000

# Default Initial Admin Credentials
ADMIN_EMAIL=admin@college.edu
ADMIN_PASSWORD=AdminPassword@123
```

---

## 🏃 Running the Application

### 1. Run Automated Backend Tests
```bash
cd backend
npm test
```
All unit and algorithmic tests for Turf.js geometry calculations, middle-of-route discovery, ETA estimation, and authentication validators will execute.

### 2. Start the Backend Server
```bash
cd backend
npm start
```
Server starts on `http://localhost:5000`. Health check available at `http://localhost:5000/api/health`.

### 3. Start the Frontend Application
```bash
cd frontend
npm run dev
```
Frontend development server starts on `http://localhost:5173`. Open your browser to explore the portal hub or specific driver, passenger, and admin screens!
