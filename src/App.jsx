import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import api, { clearToken, getToken, saveToken } from "./api";

import AdminNavbar from "./components/AdminNavbar";
import Navbar from "./components/Navbar";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettings from "./pages/AdminSettings"; // Import Settings
import CancelReschedule from "./pages/CancelReschedule";
import ChoosePackages from "./pages/ChoosePackages";
import Login from "./pages/Login";
import Packages from "./pages/Packages";
import Register from "./pages/Register";
import ViewAppointment from "./pages/ViewAppointment";
import Profile from "./pages/Profile";

/* view name -> URL (the navbars and pages still call setCurrentView("name")) */
const VIEW_PATHS = {
  packages: "/",
  choose: "/book",
  view: "/appointments",
  cancel: "/manage",
  login: "/login",
  register: "/register",
  adminDashboard: "/admin",
  adminSettings: "/admin/settings",
  profile: "/profile",
};
const PATH_VIEWS = Object.fromEntries(
  Object.entries(VIEW_PATHS).map(([view, path]) => [path, view])
);

/* Logged-in users only */
function ProtectedRoute({ isLoggedIn, children }) {
  const location = useLocation();
  return isLoggedIn ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  );
}

/* Admins only */
function AdminRoute({ isLoggedIn, isAdmin, children }) {
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/" replace />;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  /* Derived from the URL, used by the navbars for the active highlight */
  const currentView =
    PATH_VIEWS[location.pathname.replace(/\/+$/, "") || "/"] || "";

  const setCurrentView = (view) => navigate(VIEW_PATHS[view] || "/");

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("snapYourselfLoggedIn") === "true";
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("snapYourselfIsAdmin") === "true";
  });

  const [selectedPackage, setSelectedPackage] = useState(null);

  /* GLOBAL STUDIO SETTINGS STATE */
  const [studioSettings, setStudioSettings] = useState(() => {

    
    // Default Settings if none exist
    return {
      studioName: "Snap Yourself Studio",
      contactEmail: "hello@snapyourself.com",
      contactPhone: "0912 345 6789",
      address: "123 Photography Lane, Metro Manila",
      openTime: "09:00",
      closeTime: "18:00",
      advanceBooking: "24",
      gcashName: "Snap Yourself Studio",
      gcashNumber: "09123456789",
      emailAlerts: true
    };
  });

  const [appointments, setAppointments] = useState([]);

  const [showLoginPopup, setShowLoginPopup] = useState(false);

  /* LOAD STUDIO SETTINGS FROM THE SERVER (public endpoint) */
  useEffect(() => {
    api
      .get("/settings")
      .then(({ data }) => setStudioSettings(data.settings))
      .catch((error) => console.error("Could not load settings:", error));
  }, []);

  /* SAVE STUDIO SETTINGS (admin only, enforced by the server) */
  const saveStudioSettings = async (data) => {
    const res = await api.put("/settings", data);
    setStudioSettings(res.data.settings);
  };

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem("snapYourselfLoggedIn", "true");
    } else {
      localStorage.removeItem("snapYourselfLoggedIn");
      localStorage.removeItem("snapYourselfIsAdmin");
      setIsAdmin(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isAdmin) {
      localStorage.setItem("snapYourselfIsAdmin", "true");
    } else {
      localStorage.removeItem("snapYourselfIsAdmin");
    }
  }, [isAdmin]);

  /* LOAD APPOINTMENTS FROM THE SERVER */
  const loadAppointments = async (admin) => {
    try {
      const { data } = admin
        ? { data: { appointments: [] } } // the admin dashboard loads its own pages
        : await api.get("/appointments/mine");
      setAppointments(data.appointments);
    } catch (error) {
      console.error("Could not load appointments:", error);
    }
  };

  /* VERIFY THE SAVED TOKEN WITH THE SERVER ON STARTUP */
  useEffect(() => {
    const verifySession = async () => {
      if (!getToken()) {
        setIsLoggedIn(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        const admin = data.user.role === "admin";
        setIsLoggedIn(true);
        setIsAdmin(admin);
        loadAppointments(admin);
      } catch (error) {
        clearToken();
        setIsLoggedIn(false);
      }
    };

    verifySession();
  }, []);

  useEffect(() => {
    const handleStorageChange = (event) => {

      // Sync settings across tabs
      if (event.key === "snapYourselfSettings") {
        try {
          const updatedSettings = event.newValue ? JSON.parse(event.newValue) : null;
          if (updatedSettings) setStudioSettings(updatedSettings);
        } catch (error) {
          console.error("Could not sync settings:", error);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setCurrentView("choose");
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const isSlotBooked = (date, time) => {
    return appointments.some(
      (appointment) =>
        appointment.date === date &&
        appointment.time === time &&
        appointment.status !== "Cancelled"
    );
  };

  const handleBookingConfirm = async (bookingData) => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: "/book" } });
      return;
    }

    if (isSlotBooked(bookingData.date, bookingData.time)) {
      alert(`Sorry, ${bookingData.date} at ${bookingData.time} is already booked.\n\nPlease choose another available time slot.`);
      setCurrentView("choose");
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }

    try {
      const { data } = await api.post("/appointments", {
        packageName: selectedPackage?.name || "Photography Package",
        packagePrice: selectedPackage?.price || 0,
        packageIcon: selectedPackage?.icon || "📷",
        packagePeople: selectedPackage?.people || "",
        packageDuration: selectedPackage?.duration || "",
        date: bookingData.date,
        time: bookingData.time,
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        email: bookingData.email,
        phone: bookingData.phone,
        smsConsent: bookingData.smsConsent,
        paymentMethod: bookingData.paymentMethod,
        gcashReference: bookingData.gcashReference,
        freeBackdrops: bookingData.freeBackdrops,
        extraBackdrops: bookingData.extraBackdrops,
        total: bookingData.total,
        gcashReceipt: bookingData.gcashReceipt,
      });

      setAppointments((prev) => [data.appointment, ...prev]);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Could not book your appointment. Please try again."
      );
      return;
    }

    setCurrentView("view");
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleLoginFromPopup = () => {
    setShowLoginPopup(false);
    setCurrentView("login");
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleLoginSuccess = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      saveToken(data.token);

      const admin = data.user.role === "admin";
      setIsLoggedIn(true);
      setIsAdmin(admin);
      await loadAppointments(admin);
      navigate(admin ? "/admin" : location.state?.from || "/");
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Could not reach the server. Is it running?"
      );
    }
  };

  const handleRegister = async (userData) => {
    try {
      await api.post("/auth/register", userData);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Could not reach the server. Is it running?"
      );
      return;
    }

    alert("Account created successfully! You can now login.");
    setCurrentView("login");
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleSetCurrentView = (view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  /* A 401 on a logged-in request (expired token) logs the user out */
  useEffect(() => {
    const onExpired = () => {
      setIsLoggedIn(false);
      setIsAdmin(false);
      setAppointments([]);
      navigate("/login");
    };

    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const handleSetIsLoggedIn = (value) => {
    setIsLoggedIn(value);
    if (!value) {
      clearToken();
      setAppointments([]);
      setIsAdmin(false);
      localStorage.removeItem("snapYourselfLoggedIn");
      localStorage.removeItem("snapYourselfIsAdmin");
      setCurrentView("packages");
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans">
      {isAdmin && isLoggedIn ? (
        <AdminNavbar
          currentView={currentView}
          setCurrentView={handleSetCurrentView}
          setIsLoggedIn={handleSetIsLoggedIn}
        />
      ) : (
        <Navbar
          currentView={currentView}
          setCurrentView={handleSetCurrentView}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={handleSetIsLoggedIn}
          studioSettings={studioSettings} // Pass settings to Navbar
        />
      )}

            <main className="w-full">
        <Routes>
          <Route
            path="/"
            element={<Packages onSelectPackage={handleSelectPackage} />}
          />

          <Route
            path="/book"
            element={
              selectedPackage ? (
                <ChoosePackages
                  selectedPackage={selectedPackage}
                  onConfirm={handleBookingConfirm}
                  setCurrentView={handleSetCurrentView}
                  appointments={appointments}
                  studioSettings={studioSettings}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/appointments"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <ViewAppointment
                  appointments={appointments}
                  setCurrentView={handleSetCurrentView}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manage"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <CancelReschedule
                  appointments={appointments}
                  setAppointments={setAppointments}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/login"
            element={
              <Login
                setIsLoggedIn={setIsLoggedIn}
                setCurrentView={handleSetCurrentView}
                onLoginSuccess={handleLoginSuccess}
              />
            }
          />

          <Route
            path="/register"
            element={
              <Register
                onRegister={handleRegister}
                setCurrentView={handleSetCurrentView}
              />
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute isLoggedIn={isLoggedIn} isAdmin={isAdmin}>
                <AdminDashboard
                  appointments={appointments}
                  setAppointments={setAppointments}
                  studioSettings={studioSettings}
                />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <AdminRoute isLoggedIn={isLoggedIn} isAdmin={isAdmin}>
                <AdminSettings
                  studioSettings={studioSettings}
                  setStudioSettings={saveStudioSettings}
                />
              </AdminRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

    </div>
  );
}