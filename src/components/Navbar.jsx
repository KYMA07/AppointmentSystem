export default function Navbar({
  currentView,
  setCurrentView,
  isLoggedIn,
  setIsLoggedIn,
}) {
  const goHome = () => {
    setCurrentView("packages");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView("packages");
  };

  return (
    <header className="navbar">

      <div
        className="navbar-brand"
        onClick={goHome}
      >

        <div className="brand-icon">
          S
        </div>

        <div className="brand-text">

          <div className="brand-name">
            Snap Yourself
          </div>

          <div className="brand-subtitle">
            Photography Appointment
          </div>

        </div>

      </div>

      <nav className="navbar-links">

        <button
          className={
            currentView === "packages"
              ? "nav-link active"
              : "nav-link"
          }
          onClick={goHome}
        >
          Home
        </button>

        {!isLoggedIn ? (
          <>
            <button
              className={
                currentView === "login"
                  ? "nav-link active-dark"
                  : "nav-link"
              }
              onClick={() =>
                setCurrentView("login")
              }
            >
              Login
            </button>

            <button
              className="nav-register"
              onClick={() =>
                setCurrentView("register")
              }
            >
              Register
            </button>
          </>
        ) : (
          <>
            <button
              className="nav-link"
              onClick={() =>
                setCurrentView("view")
              }
            >
              My Appointments
            </button>

            <button
              className="nav-link"
              onClick={() =>
                setCurrentView("cancel")
              }
            >
              Manage
            </button>

            <button
              className="nav-link"
              onClick={() => setCurrentView("profile")}
            >
              Profile
            </button>

            <button
              className="nav-register"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}

      </nav>

    </header>
  );
}