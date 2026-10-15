import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import CancelReschedule from "./pages/CancelReschedule";
import ChoosePackages from "./pages/ChoosePackages";
import Login from "./pages/Login";
import Packages from "./pages/Packages";
import Register from "./pages/Register";
import ViewAppointment from "./pages/ViewAppointment";

export default function App() {
  const [currentView, setCurrentView] = useState("packages");

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return (
      localStorage.getItem("snapYourselfLoggedIn") === "true"
    );
  });

  const [selectedPackage, setSelectedPackage] = useState(null);

  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "snapYourselfAppointments"
      );

      if (!saved) {
        return [];
      }

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed;
    } catch (error) {
      console.error(
        "Could not load appointments:",
        error
      );

      return [];
    }
  });

  const [showLoginPopup, setShowLoginPopup] =
    useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem(
        "snapYourselfLoggedIn",
        "true"
      );
    } else {
      localStorage.removeItem(
        "snapYourselfLoggedIn"
      );
    }
  }, [isLoggedIn]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "snapYourselfAppointments",
        JSON.stringify(appointments)
      );
    } catch (error) {
      console.error(
        "Could not save appointments:",
        error
      );
    }
  }, [appointments]);

  /*
    Sync appointments when another browser tab
    changes the appointment list.
  */
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (
        event.key !==
        "snapYourselfAppointments"
      ) {
        return;
      }

      try {
        const updatedAppointments =
          event.newValue
            ? JSON.parse(event.newValue)
            : [];

        if (Array.isArray(updatedAppointments)) {
          setAppointments(updatedAppointments);
        }
      } catch (error) {
        console.error(
          "Could not sync appointments:",
          error
        );
      }
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setCurrentView("choose");

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  /*
    Check if a date/time combination is already booked.

    Cancelled appointments do NOT block the slot.
  */
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

    /*
      IMPORTANT DUPLICATE CHECK

      This is the final protection before creating
      the appointment.

      It checks the date + time only.

      Package does NOT matter.

      Example:
      Solo Package
      2026-08-29
      10:00 AM

      blocks:

      Universal Package
      2026-08-29
      10:00 AM
    */
    if (
      isSlotBooked(
        bookingData.date,
        bookingData.time
      )
    ) {
      alert(
        `Sorry, ${bookingData.date} at ${bookingData.time} is already booked.\n\nPlease choose another available time slot.`
      );

      setCurrentView("choose");

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });

      return;
    }

    const newAppointment = {
      id:
        Date.now() +
        Math.random()
          .toString(36)
          .substring(2, 8),

      ...bookingData,

      package: selectedPackage,

      packageName:
        selectedPackage?.name ||
        "Photography Package",

      packagePrice:
        selectedPackage?.price || 0,

      packageIcon:
        selectedPackage?.icon || "📷",

      packagePeople:
        selectedPackage?.people || "",

      packageDuration:
        selectedPackage?.duration || "",

      status: "Confirmed",

      rescheduleCount: 0,

      createdAt:
        new Date().toISOString(),
    };

    setAppointments((prev) => {
      /*
        Check AGAIN using the latest state.

        This prevents accidentally adding a duplicate
        if the appointment list changed before React
        processed the update.
      */
      const alreadyBooked = prev.some(
        (appointment) =>
          appointment.date ===
            newAppointment.date &&
          appointment.time ===
            newAppointment.time &&
          appointment.status !== "Cancelled"
      );

      if (alreadyBooked) {
        alert(
          `Sorry, ${newAppointment.date} at ${newAppointment.time} was just booked by another customer.\n\nPlease choose another available time slot.`
        );

        return prev;
      }

      return [
        ...prev,
        newAppointment,
      ];
    });

    setCurrentView("view");

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  const handleLoginFromPopup = () => {
    setShowLoginPopup(false);
    setCurrentView("login");

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setCurrentView("packages");

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  const handleRegister = (userData) => {
    console.log(
      "Registered user:",
      userData
    );

    alert(
      "Account created successfully! You can now login."
    );

    setCurrentView("login");

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  const handleSetCurrentView = (view) => {
    setCurrentView(view);

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  const handleSetIsLoggedIn = (value) => {
    setIsLoggedIn(value);

    if (!value) {
      localStorage.removeItem(
        "snapYourselfLoggedIn"
      );

      setCurrentView("packages");

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans">
      <Navbar
        currentView={currentView}
        setCurrentView={
          handleSetCurrentView
        }
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={
          handleSetIsLoggedIn
        }
      />

      <main className="w-full">
        {currentView === "packages" && (
          <Packages
            onSelectPackage={
              handleSelectPackage
            }
          />
        )}

        {currentView === "choose" && (
          <ChoosePackages
            selectedPackage={
              selectedPackage
            }
            onConfirm={
              handleBookingConfirm
            }
            setCurrentView={
              handleSetCurrentView
            }
            appointments={
              appointments
            }
          />
        )}

        {currentView === "view" && (
          <ViewAppointment
            appointments={
              appointments
            }
            setCurrentView={
              handleSetCurrentView
            }
          />
        )}

        {currentView === "cancel" && (
          <CancelReschedule
            appointments={
              appointments
            }
            setAppointments={
              setAppointments
            }
          />
        )}

        {currentView === "login" && (
          <Login
            setIsLoggedIn={
              setIsLoggedIn
            }
            setCurrentView={
              handleSetCurrentView
            }
            onLoginSuccess={
              handleLoginSuccess
            }
          />
        )}

        {currentView === "register" && (
          <Register
            onRegister={
              handleRegister
            }
            setCurrentView={
              handleSetCurrentView
            }
          />
        )}
      </main>

      {showLoginPopup && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-4"
          onClick={() =>
            setShowLoginPopup(false)
          }
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-3xl">
              🔒
            </div>

            <h2 className="mt-5 text-center text-2xl font-bold text-slate-950">
              Please Login First
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-slate-500">
              You need to login to your account
              before you can confirm your
              photography booking.
            </p>

            <div className="mt-7 flex flex-col gap-3">
              <button
                type="button"
                onClick={
                  handleLoginFromPopup
                }
                className="w-full rounded-xl bg-sky-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-sky-700"
              >
                Login to Continue →
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowLoginPopup(false)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-sky-400 hover:text-sky-700"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}