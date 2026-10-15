import { useState } from "react";
import cameraBg from "./camerabg.png";

export default function Login({
  setIsLoggedIn,
  setCurrentView,
  onLoginSuccess,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("snapYourselfRememberMe") === "true";
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    /* REMEMBER ME LOGIC */
    if (rememberMe) {
      localStorage.setItem("snapYourselfRememberMe", "true");
      localStorage.setItem("snapYourselfRememberedLogin", "true");
    } else {
      localStorage.removeItem("snapYourselfRememberMe");
      localStorage.removeItem("snapYourselfRememberedLogin");
    }

    /* LOGIN SUCCESS HANDLER */
    if (onLoginSuccess) {
      // Pass email AND password to App.jsx to handle admin verification
      onLoginSuccess(email, password);
    } else {
      setIsLoggedIn(true);
      setCurrentView("packages");
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        {/* LEFT SIDE */}
        <div className="auth-form-side">
          <div className="auth-card">
            {/* BRAND */}
            <div className="auth-card-header">
              <div className="auth-card-icon">
                <img src={cameraBg} alt="Camera" />
              </div>
              <div>
                <div className="auth-card-brand">SNAP YOURSELF</div>
                <div className="auth-card-subtitle">
                  Photography Appointment
                </div>
              </div>
            </div>

            {/* WELCOME */}
            <div className="auth-label">WELCOME BACK</div>
            <h1 className="auth-title">
              Login to Your <span>Account.</span>
            </h1>
            <p className="auth-description">
              Login to continue with your photography appointment and manage
              your bookings.
            </p>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
              {/* EMAIL */}
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              {/* PASSWORD */}
              <div className="form-group">
                <label>Password *</label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {/* OPTIONS */}
              <div className="auth-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() => alert("Password recovery coming soon.")}
                >
                  Forgot Password?
                </button>
              </div>

              {/* SUBMIT BUTTON */}
              <button type="submit" className="auth-submit-button">
                Login <span>→</span>
              </button>
            </form>

            {/* DIVIDER */}
            <div className="auth-divider">
              <span>OR</span>
            </div>

            {/* REGISTER */}
            <div className="auth-switch">
              <span>Don't have an account?</span>
              <button
                type="button"
                onClick={() => {
                  setCurrentView("register");
                  window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: "instant",
                  });
                }}
              >
                Create an Account
              </button>
            </div>

            {/* BACK */}
            <button
              type="button"
              className="auth-back"
              onClick={() => {
                setCurrentView("packages");
                window.scrollTo({
                  top: 0,
                  left: 0,
                  behavior: "instant",
                });
              }}
            >
              ← Continue Browsing
            </button>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="auth-visual">
          <div className="auth-decoration"></div>
          <div className="auth-camera-card">
            <div className="auth-camera-icon">
              <img src={cameraBg} alt="Camera" />
            </div>
            <div className="auth-camera-content">
              <div className="auth-camera-label">SNAP YOURSELF</div>
              <h2>
                Own Your
                <br />
                Moment.
              </h2>
              <p>
                Your studio.
                <br />
                Your style.
                <br />
                Your story.
              </p>
            </div>
            <div className="auth-camera-bottom">PHOTOGRAPHY APPOINTMENT</div>
          </div>
        </div>
      </div>
    </div>
  );
}