import { useState } from "react";
import { validateRegister } from "../validators";
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

  const [touched, setTouched] = useState({});

  const errors = validateRegister({
    firstName,
    lastName,
    email,
    phone,
    password,
    confirmPassword,
  });

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((current) => ({ ...current, [name]: true }));
  };

  const fieldError = (name) => (touched[name] ? errors[name] : "");

  const handleSubmit = (e) => {
    if (Object.keys(errors).length > 0) {
      e.preventDefault();
      setTouched({
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        password: true,
        confirmPassword: true,
      });
      return;
    }
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

            <form onSubmit={handleSubmit} noValidate>

              {/* FIRST + LAST NAME */}

              <div className="form-row">

                <div className="form-group">

                  <label>
                    First Name *
                    {fieldError("firstName") && (
                      <span className="field-error">{fieldError("firstName")}</span>
                    )}
                  </label>

                  <input
                    className="form-control"
                    type="text"
                    placeholder="First name"
                    name="firstName"
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldError("firstName"))}
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
                    {fieldError("lastName") && (
                      <span className="field-error">{fieldError("lastName")}</span>
                    )}
                  </label>

                  <input
                    className="form-control"
                    type="text"
                    placeholder="Last name"
                    name="lastName"
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldError("lastName"))}
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
                  {fieldError("email") && (
                    <span className="field-error">{fieldError("email")}</span>
                  )}
                </label>

                <input
                  className="form-control"
                  type="email"
                  placeholder="you@example.com"
                  name="email"
                  onBlur={handleBlur}
                  aria-invalid={Boolean(fieldError("email"))}
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
                  {fieldError("phone") && (
                    <span className="field-error">{fieldError("phone")}</span>
                  )}
                </label>

                <input
                  className="form-control"
                  type="tel"
                  placeholder="09XXXXXXXXX"
                  name="phone"
                  onBlur={handleBlur}
                  aria-invalid={Boolean(fieldError("phone"))}
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
                    {fieldError("password") && (
                      <span className="field-error">{fieldError("password")}</span>
                    )}
                  </label>

                  <input
                    className="form-control"
                    type="password"
                    placeholder="Create password"
                    name="password"
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldError("password"))}
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
                    {fieldError("confirmPassword") && (
                      <span className="field-error">{fieldError("confirmPassword")}</span>
                    )}
                  </label>

                  <input
                    className="form-control"
                    type="password"
                    placeholder="Confirm password"
                    name="confirmPassword"
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldError("confirmPassword"))}
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