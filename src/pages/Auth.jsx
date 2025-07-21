import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

const Auth = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    company: "",
    city: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setStep(1);
    setFormData({
      email: "",
      phone: "",
      company: "",
      city: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setSuccessMessage("");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateStep = () => {
    let newErrors = {};

    if (step === 1) {
      if (!formData.email) newErrors.email = "Email is required.";
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = "Enter a valid email.";
    } else if (isSignUp && step === 2) {
      if (!formData.phone) newErrors.phone = "Phone number is required.";
      else if (!/^\+?\d{10,14}$/.test(formData.phone))
        newErrors.phone = "Enter a valid phone number.";

      if (!formData.company) newErrors.company = "Company name is required.";
      if (!formData.city) newErrors.city = "City is required.";
    } else if (step === 2 || (isSignUp && step === 3)) {
      if (!formData.password) newErrors.password = "Password is required.";
      else if (!/^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/.test(formData.password))
        newErrors.password =
          "Password must have 6+ chars, 1 uppercase letter & 1 number.";

      if (isSignUp && !formData.confirmPassword)
        newErrors.confirmPassword = "Confirm password is required.";
      else if (isSignUp && formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep()) return;
    setStep(step + 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    if (isSignUp) {
      console.log("Signup Data:", formData);
      setSuccessMessage("Account created successfully! 🎉");
      setTimeout(() => navigate("/dashboard"), 2000);
    } else {
      console.log("Login Data:", formData);
      navigate("/dashboard");
    }
  };

  return (
    <section className="auth-section">
      <div className="label-section">
        <div className="label-holder">
          <div className="dots auth"></div>
          <div className="label-brand">
            ryfty <div className="courier-bransd">Courier</div>
          </div>
        </div>
      </div>
      <div className="auth-container">
        <h2>{isSignUp ? "Courier Sign Up" : "Courier Login"}</h2>

        {successMessage ? (
          <p className="success-message">{successMessage}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                <p className="subhead">Enter your email</p>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="error">{errors.email}</p>}

                <button
                  type="button"
                  className="auth-btn"
                  onClick={handleNextStep}
                >
                  Next
                </button>
              </>
            )}

            {isSignUp && step === 2 && (
              <>
                <p className="subhead">Enter your company details</p>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number (e.g. +254712345678)"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {errors.phone && <p className="error">{errors.phone}</p>}

                <input
                  type="text"
                  name="company"
                  placeholder="Courier Company Name"
                  value={formData.company}
                  onChange={handleChange}
                />
                {errors.company && <p className="error">{errors.company}</p>}

                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                />
                {errors.city && <p className="error">{errors.city}</p>}

                <button
                  type="button"
                  className="auth-btn"
                  onClick={handleNextStep}
                >
                  Next
                </button>
              </>
            )}

            {(step === 2 && !isSignUp) || (isSignUp && step === 3) ? (
              <>
                <p className="subhead">Set your password</p>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && <p className="error">{errors.password}</p>}

                {isSignUp && (
                  <>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    {errors.confirmPassword && (
                      <p className="error">{errors.confirmPassword}</p>
                    )}
                  </>
                )}

                <button type="submit" className="auth-btn">
                  {isSignUp ? "Sign Up" : "Login"}
                </button>
              </>
            ) : null}
          </form>
        )}

        <p onClick={toggleForm} className="toggle-text">
          {isSignUp
            ? "Already have an account? Login"
            : "Don't have an account? Sign up"}
        </p>
      </div>
    </section>
  );
};

export default Auth;
