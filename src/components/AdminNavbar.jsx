import React from "react";

export default function AdminNavbar({
  currentView,
  setCurrentView,
  setIsLoggedIn,
}) {
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView("login");
  };

  return (
    <header className="navbar">
      <div
        className="navbar-brand"
        onClick={() => setCurrentView("adminDashboard")}
      >
        <div className="brand-icon">
          A
        </div>
        <div className="brand-text">
          <div className="brand-name">
            Snap Admin
          </div>
          <div className="brand-subtitle">
            Management Portal
          </div>
        </div>
      </div>

      <nav className="navbar-links">
        <button
          className={
            currentView === "adminDashboard"
              ? "nav-link active"
              : "nav-link"
          }
          onClick={() => setCurrentView("adminDashboard")}
        >
          Dashboard
        </button>

        <button
          className={
            currentView === "adminSettings"
              ? "nav-link active"
              : "nav-link"
          }
          onClick={() => setCurrentView("adminSettings")}
        >
          Settings
        </button>

        <button
          className="nav-register"
          onClick={handleLogout}
        >
          Logout
        </button>
      </nav>
    </header>
  );
}