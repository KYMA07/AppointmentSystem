import { useState } from "react";
import cameraBg from "./camerabg.png";

export default function Register({
  onRegister,
  setCurrentView,
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      alert("Please complete all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!/^[0-9+()\s-]{7,20}$/.test(phone)) {
      alert("Please enter a valid phone number.");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (onRegister) {
      onRegister({
        firstName,
        lastName,
        email,
        phone,
        password,
      });
    } else {
      setCurrentView("login");
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-layout register-layout">

        {/* 
            LEFT SIDE - REGISTER FORM
       */}

        <div className="auth-form-side">

          <div className="auth-card register-card">

            <div className="auth-card-header">

               <div className="auth-card-icon">
                    <img
                      src={cameraBg}
                       alt="Camera"
                       />
                  </div>

              <div>

                <div className="auth-card-brand">
                  SNAP YOURSELF
                </div>

                <div className="auth-card-subtitle">
                  Photography Appointment
                </div>

              </div>

            </div>

            <div className="auth-label">
              JOIN SNAP YOURSELF
            </div>

            <h1 className="auth-title register-title">
              Create Your
              <span> Account.</span>
            </h1>

            <p className="auth-description">
              Create an account to manage your photography
              appointments and capture your best moments.
            </p>

            <form onSubmit={handleSubmit}>

              {/* FIRST + LAST NAME */}

              <div className="form-row">

                <div className="form-group">

                  <label>
                    First Name *
                  </label>

                  <input
                    className="form-control"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) =>
                      setFirstName(e.target.value)
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Last Name *
                  </label>

                  <input
                    className="form-control"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) =>
                      setLastName(e.target.value)
                    }
                    required
                  />

                </div>

              </div>

              {/* EMAIL */}

              <div className="form-group">

                <label>
                  Email Address *
                </label>

                <input
                  className="form-control"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />

              </div>

              {/* PHONE */}

              <div className="form-group">

                <label>
                  Phone Number *
                </label>

                <input
                  className="form-control"
                  type="tel"
                  placeholder="09XXXXXXXXX"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  required
                />

              </div>

              {/* PASSWORD */}

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Password *
                  </label>

                  <input
                    className="form-control"
                    type="password"
                    placeholder="Create password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Confirm Password *
                  </label>

                  <input
                    className="form-control"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    required
                  />

                </div>

              </div>

              {/* REGISTER BUTTON */}

              <button
                type="submit"
                className="auth-submit-button"
              >
                Create Account
                <span>→</span>
              </button>

            </form>

            {/* DIVIDER */}

            <div className="auth-divider">
              <span>OR</span>
            </div>

            {/* LOGIN */}

            <div className="auth-switch">

              <span>
                Already have an account?
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentView("login")
                }
              >
                Login
              </button>

            </div>

            {/* BACK */}

            <button
              className="auth-back"
              onClick={() =>
                setCurrentView("packages")
              }
            >
              ← Continue Browsing
            </button>

          </div>

        </div>

        {/* 
            RIGHT SIDE - VISUAL
         */}

        <div className="auth-visual">

          <div className="auth-decoration"></div>

          <div className="auth-camera-card">

             <div className="auth-camera-icon">
                <img
                  src={cameraBg}
                  alt="Camera"
                />
             </div>
            <div className="auth-camera-content">

              <div className="auth-camera-label">
                CREATE YOUR
              </div>

              <h2>
                Your Story.
                <br />
                Your Style.
              </h2>

              <p>
                Book your studio.
                <br />
                Choose your package.
                <br />
                Capture your moment.
              </p>

            </div>

            <div className="auth-camera-bottom">
              SNAP YOURSELF
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}