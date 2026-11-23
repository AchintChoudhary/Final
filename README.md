# Real-Time Public Transport Tracking System

A streamlined, modern MERN web application built for real-time transit tracking. Featuring **two dedicated user roles: DRIVER and PASSENGER**, real device GPS watching, Geoapify road geometry routing, Turf.js middle-of-route bus discovery, and Socket.IO real-time communication.

---

## 🚌 Roles & Functionality

The application is purposefully designed with **ONLY TWO ROLES**:

### 1. Driver Portal
- **Driver Signup** (`/driver/signup`): Name, 10-digit Indian mobile number, password, secure JWT session.
- **Driver Login** (`/driver/login`): Authentication with mobile number and password.
- **Driver Dashboard** (`/driver/dashboard`): Status card of current trip, quick actions for bus and route details.
- **Bus Details** (`/driver/bus-details`): Register bus name, registration plate number, origin, and destination with Geoapify autocomplete.
- **Route Preview** (`/driver/route-preview`): Interactive Leaflet map displaying real road geometry from Geoapify, start/dest markers, distance, and duration.
- **Active Trip** (`/driver/active-trip`): Real device GPS watching (`navigator.geolocation.watchPosition`), live Leaflet tracking map, live location pulse indicator, and Stop Trip confirmation modal.
- **Trip History** (`/driver/history`): Log of past completed trips.

### 2. Passenger Portal
- **Passenger Signup** (`/passenger/signup`): Passenger registration.
- **Passenger Login** (`/passenger/login`): Authentication with mobile number and password.
- **Search Buses** (`/passenger/search`): Origin/pickup location (with **"Use Current Location" GPS button**), final destination, and Geoapify autocomplete.
- **Available Buses** (`/passenger/available-buses`): Middle-of-route bus discovery displaying eligible approaching buses with plate numbers and route ETA badges.
- **Live Tracking** (`/passenger/tracking/:tripId`): Real-time bus movement on Leaflet map powered by Socket.IO, pickup & destination markers, and last update timestamp.
- **My Trip / Route Progress** (`/passenger/trip/:tripId`): Ordered stops timeline showing passed stops, approaching stop with pulsing indicator, and upcoming stops with arrival progress.
- **Passenger History** (`/passenger/history`): History of tracked trips.

---

## 🧠 Core Technical Feature: Middle-of-Route Bus Discovery

Implemented in `backend/services/routeMatchingService.js` using **Turf.js**:
1. **Active Trip Inspection**: Queries trips currently marked `ACTIVE` with confirmed road geometry.
2. **Passenger Pickup & Destination Snapping**: Projects pickup and destination points onto the road `LineString` using `turf.nearestPointOnLine`.
3. **Route Direction & Topological Ordering**: Validates:
   $$\text{busProgressKm} < \text{pickupProgressKm} < \text{destinationProgressKm}$$
4. **Passed Bus Exclusion**: Strictly excludes buses where $\text{busProgressKm} \ge \text{pickupProgressKm}$.
5. **Accurate Road ETA**: Computes remaining distance along the confirmed route polyline and calculates travel ETA.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React icons, React Router DOM v7, Leaflet, Socket.IO Client, Axios.
- **Backend**: Node.js v22 (ES Modules), Express.js, MongoDB / Mongoose, Socket.IO, Turf.js, bcryptjs, JSON Web Tokens (JWT), express-validator, helmet, cors.
- **Maps & Geolocation**: Geoapify Routing & Autocomplete API, Leaflet map tiles.

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`):
```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://127.0.0.1:27017/transport_tracking

JWT_SECRET=super_secret_transport_jwt_key_2026_dev
JWT_EXPIRES_IN=7d

# Geoapify API Key (from https://www.geoapify.com/)
GEOAPIFY_API_KEY=your_key_here

CLIENT_URL=http://localhost:5173

GPS_UPDATE_INTERVAL_MS=5000
GPS_STALE_WARNING_MS=30000
GPS_UNAVAILABLE_MS=120000

ROUTE_MATCH_TOLERANCE_METERS=500
GPS_MAX_ACCURACY_METERS=100
ETA_REFRESH_INTERVAL_MS=60000

BCRYPT_SALT_ROUNDS=12
```

---

## 🏃 Running the Application

### 1. Run Automated Backend Tests
```bash
cd backend
npm test
```

### 2. Start Backend Server
```bash
cd backend
npm start
```
*Runs on port 5000 (`http://localhost:5000/api/health`).*

### 3. Start Frontend Client
```bash
cd frontend
npm run dev
```
*Runs on port 5173 (`http://localhost:5173`).*
