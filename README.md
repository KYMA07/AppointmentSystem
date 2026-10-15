# Snap Yourself – Online Appointment System

A full-stack MERN (MongoDB, Express, React, Node.js) web application for booking photo-studio sessions. Customers register, choose a package and backdrops, pick an available time slot, and pay through GCash. The studio admin confirms or cancels bookings, verifies payment references, and manages studio settings from a dashboard.

## Features

**Customers**
- Register, log in and log out (passwords hashed with bcrypt, sessions use JWT)
- Browse packages and book an appointment (package, backdrops, date, time slot, GCash reference)
- Time slots already taken by anyone are disabled in the date picker
- View, cancel and reschedule own appointments (a booking can be rescheduled once)
- Profile page: update name and phone, change password

**Admin**
- Dashboard with totals (bookings, active, revenue, cancelled) counted by the server
- Appointments log with server-side search, status filter and pagination
- Confirm, complete, cancel or delete any appointment
- Export the filtered appointments to CSV
- Settings page: studio information, hours, GCash details and admin password (stored in the database, shown to customers)

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, React Hooks, Axios, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Security | helmet, express-rate-limit, input validation, role-based access |

## Project structure

```
Snap Yourself/
├── package.json          # React client
├── src/
│   ├── api.js            # Axios instance (adds JWT, handles expired sessions)
│   ├── App.jsx           # Routes, route guards, global state
│   ├── main.jsx
│   ├── components/       # Navbar, AdminNavbar
│   └── pages/            # Packages, ChoosePackages, Date, ViewAppointment,
│                         # CancelReschedule, Login, Register, Profile,
│                         # AdminDashboard, AdminSettings
└── server/
    ├── server.js         # Express app, security middleware, routes
    ├── config/db.js      # MongoDB connection
    ├── controllers/      # authController, appointmentController
    ├── middleware/       # authMiddleware (protect, adminOnly)
    ├── models/           # User, Appointment (+ Settings)
    ├── routes/           # authRoutes, appointmentRoutes
    └── seed/createAdmin.js
```

## Getting started

### Prerequisites
- Node.js 18 or newer
- MongoDB (local installation or a MongoDB Atlas connection string)

### 1. Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/snap-yourself
JWT_SECRET=replace-with-a-long-random-string
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=choose-a-strong-password
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Create the admin account once, then start the server:

```bash
npm run seed:admin
npm run dev        # or: npm start
```

The API runs at `http://localhost:5000`. Check it at `http://localhost:5000/api/health`.

### 2. Frontend

In the project root (the folder that contains `src/`):

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. To point the client at a different API, set `VITE_API_URL` (default `http://localhost:5000/api`).

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `PORT` | server | API port (default 5000) |
| `MONGO_URI` | server | MongoDB connection string |
| `JWT_SECRET` | server | Secret used to sign tokens (use 32+ random characters) |
| `CLIENT_URL` | server | Allowed CORS origin (default `http://localhost:5173`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | server | Used by `npm run seed:admin` |
| `STUDIO_TIMEZONE` | server | Time zone for "today" checks (default `Asia/Manila`) |
| `VITE_API_URL` | client | API base URL |

Never commit `.env`. Add it to `.gitignore`.

## API reference

Base URL: `http://localhost:5000/api`. Protected routes need the header `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create a customer account, returns token and user |
| POST | `/auth/login` | Public | Log in, returns token and user |
| GET | `/auth/me` | Logged in | Current user |
| PATCH | `/auth/me` | Logged in | Update first name, last name, phone |
| PATCH | `/auth/password` | Logged in | Change password (`currentPassword`, `newPassword`) |

### Appointments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/appointments/booked?date=YYYY-MM-DD` | Public | Times already booked on a date (times only) |
| POST | `/appointments` | Logged in | Create a booking (status starts as Pending) |
| GET | `/appointments/mine` | Logged in | Own appointments |
| PATCH | `/appointments/:id/reschedule` | Owner | Change date and time (once only) |
| PATCH | `/appointments/:id/cancel` | Owner or admin | Cancel |
| GET | `/appointments` | Admin | List with `page`, `limit` (max 50), `status`, `search` |
| GET | `/appointments/stats` | Admin | Totals for the dashboard cards |
| PATCH | `/appointments/:id/status` | Admin | Set Pending, Confirmed, Completed or Cancelled |
| DELETE | `/appointments/:id` | Admin | Delete permanently |

### Settings and health

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/settings` | Public | Studio info and GCash details |
| PUT | `/settings` | Admin | Update studio settings |
| GET | `/health` | Public | Server status |

### Error format

Errors return JSON with a `message`, for example `{ "message": "That time slot is already booked. Please choose another." }`. Common codes: 400 invalid input, 401 not logged in or token expired, 403 not an admin, 404 not found, 409 conflict (duplicate email, slot or GCash reference), 429 too many attempts.

## Frontend routes

| Path | Access | Page |
|---|---|---|
| `/` | Public | Packages |
| `/book` | Public (requires a selected package) | Booking form |
| `/login`, `/register` | Public | Authentication |
| `/appointments` | Logged in | My appointments |
| `/manage` | Logged in | Cancel or reschedule |
| `/profile` | Logged in | Profile and password |
| `/admin` | Admin | Dashboard |
| `/admin/settings` | Admin | Studio settings |

## Business rules

- Six daily slots: 10:00 AM, 11:30 AM, 01:00 PM, 02:30 PM, 04:00 PM, 05:30 PM.
- One active appointment per date and time. This is enforced by a unique database index, so two customers cannot book the same slot, even simultaneously.
- Prices are calculated by the server. The five packages cost ₱400, ₱800, ₱1,500, ₱2,000 and ₱2,500, plus ₱100 if any extra backdrop is chosen.
- A booking can be rescheduled only once and only while Pending or Confirmed.
- A GCash reference must be exactly 13 digits and can be used only once.

## Security measures

- Passwords hashed with bcrypt, never returned by the API
- JWT authentication middleware and a separate admin-only middleware; the role comes from the database, not the request
- Server-side validation and type checks on all inputs; the client's price and total are ignored
- Rate limiting on login and registration (10 failed attempts per 15 minutes per IP)
- `helmet` security headers, restricted CORS origin, 10 KB request body limit
- Generic login error message so account existence is not revealed
- Ownership checks: customers can only reschedule or cancel their own appointments
- Expired tokens log the user out automatically
- React escapes rendered values by default, which helps prevent XSS

## Known limitations

- The JWT is stored in `localStorage`. This is simple but exposed to XSS; httpOnly cookies would be safer for production.
- Opening hours and advance-booking settings are displayed but do not yet change the available slots.
- Receipt image upload is not implemented; payments are verified by the GCash reference number.
- Email notifications are not implemented.

## Manual test checklist

1. Register with an invalid email, a short password and a duplicate email: each shows an error.
2. Log in as a customer, book a package, and confirm the booked time is greyed out for others.
3. Reschedule once, then confirm a second reschedule is refused.
4. Cancel a booking and confirm the slot becomes available again.
5. Log in as admin: search, filter and paginate; confirm, complete and delete bookings; export CSV.
6. Change the GCash number in Settings and confirm a logged-out visitor sees the new number.
7. Visit `/admin` as a customer and while logged out: both are redirected.
8. Make 11 failed logins: the 11th is rate limited.
9. Resend a booking request with a lower `total`: the saved total is still the real price.