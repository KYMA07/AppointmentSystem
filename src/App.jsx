import { useEffect, useState } from "react";

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

export default function App() {
  const [currentView, setCurrentView] = useState("packages");

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("snapYourselfLoggedIn") === "true";
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("snapYourselfIsAdmin") === "true";
  });

  const [selectedPackage, setSelectedPackage] = useState(null);

  /* GLOBAL STUDIO SETTINGS STATE */
  const [studioSettings, setStudioSettings] = useState(() => {
    const saved = localStorage.getItem("snapYourselfSettings");
    if (saved) return JSON.parse(saved);
    
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

  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem("snapYourselfAppointments");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Could not load appointments:", error);
      return [];
    }
  });

  const [showLoginPopup, setShowLoginPopup] = useState(false);

  /* SAVE SETTINGS TO LOCAL STORAGE */
  useEffect(() => {
    localStorage.setItem("snapYourselfSettings", JSON.stringify(studioSettings));
  }, [studioSettings]);

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

  useEffect(() => {
    try {
      localStorage.setItem("snapYourselfAppointments", JSON.stringify(appointments));
    } catch (error) {
      console.error("Could not save appointments:", error);
    }
  }, [appointments]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "snapYourselfAppointments") {
        try {
          const updatedAppointments = event.newValue ? JSON.parse(event.newValue) : [];
          if (Array.isArray(updatedAppointments)) {
            setAppointments(updatedAppointments);
          }
        } catch (error) {
          console.error("Could not sync appointments:", error);
        }
      }
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

  const handleBookingConfirm = (bookingData) => {
    if (!isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }

    if (isSlotBooked(bookingData.date, bookingData.time)) {
      alert(`Sorry, ${bookingData.date} at ${bookingData.time} is already booked.\n\nPlease choose another available time slot.`);
      setCurrentView("choose");
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }

    const newAppointment = {
      id: Date.now() + Math.random().toString(36).substring(2, 8),
      ...bookingData,
      package: selectedPackage,
      packageName: selectedPackage?.name || "Photography Package",
      packagePrice: selectedPackage?.price || 0,
      packageIcon: selectedPackage?.icon || "📷",
      packagePeople: selectedPackage?.people || "",
      packageDuration: selectedPackage?.duration || "",
      status: "Pending", // Starts pending for admin approval
      rescheduleCount: 0,
      createdAt: new Date().toISOString(),
      gcashReceiptPreview:
        bookingData.gcashReceipt && typeof bookingData.gcashReceipt !== "string"
          ? URL.createObjectURL(bookingData.gcashReceipt)
          : bookingData.gcashReceipt || null,
    };

    setAppointments((prev) => {
      const alreadyBooked = prev.some(
        (appointment) =>
          appointment.date === newAppointment.date &&
          appointment.time === newAppointment.time &&
          appointment.status !== "Cancelled"
      );

      if (alreadyBooked) {
        alert(`Sorry, ${newAppointment.date} at ${newAppointment.time} was just booked by another customer.\n\nPlease choose another available time slot.`);
        return prev;
      }
      return [...prev, newAppointment];
    });

    setCurrentView("view");
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleLoginFromPopup = () => {
    setShowLoginPopup(false);
    setCurrentView("login");
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleLoginSuccess = (email, password) => {
    const isAdminEmail = email === "admin@snapyourself.com" || email === "admin@gmail.com";

    if (isAdminEmail) {
      if (password === "admin123") {
        setIsLoggedIn(true);
        setIsAdmin(true);
        setCurrentView("adminDashboard");
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      } else {
        alert("Incorrect admin password.");
        return; 
      }
    } else {
      setIsLoggedIn(true);
      setIsAdmin(false);
      setCurrentView("packages");
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  const handleRegister = (userData) => {
    alert("Account created successfully! You can now login.");
    setCurrentView("login");
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleSetCurrentView = (view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleSetIsLoggedIn = (value) => {
    setIsLoggedIn(value);
    if (!value) {
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
        {currentView === "packages" && (
          <Packages onSelectPackage={handleSelectPackage} />
        )}

        {currentView === "choose" && (
          <ChoosePackages
            selectedPackage={selectedPackage}
            onConfirm={handleBookingConfirm}
            setCurrentView={handleSetCurrentView}
            appointments={appointments}
            studioSettings={studioSettings} // Pass settings to Booking Form
          />
        )}

        {currentView === "view" && (
          <ViewAppointment
            appointments={appointments}
            setCurrentView={handleSetCurrentView}
          />
        )}

        {currentView === "cancel" && (
          <CancelReschedule
            appointments={appointments}
            setAppointments={setAppointments}
          />
        )}

        {currentView === "login" && (
          <Login
            setIsLoggedIn={setIsLoggedIn}
            setCurrentView={handleSetCurrentView}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {currentView === "register" && (
          <Register
            onRegister={handleRegister}
            setCurrentView={handleSetCurrentView}
          />
        )}

        {currentView === "adminDashboard" && isAdmin && (
          <AdminDashboard
            appointments={appointments}
            setAppointments={setAppointments}
            studioSettings={studioSettings} // Pass to Admin Dashboard
          />
        )}

        {currentView === "adminSettings" && isAdmin && (
          <AdminSettings 
            studioSettings={studioSettings} 
            setStudioSettings={setStudioSettings} // Pass to Settings to edit
          />
        )}
      </main>

      {/* LOGIN POPUP (Omitted for brevity, keep your existing one here) */}
    </div>
  );
}