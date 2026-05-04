// frontend/src/pages/auth/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import toast from "react-hot-toast"; // ← Toast
import "../../styles/Login.css";
import logo from "../../assets/logo.png";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error("Please fill in both fields");
      return;
    }

    setLoading(true);

    // This creates the beautiful loading → success → error flow
    toast
      .promise(
        login(formData.username, formData.password),
        {
          loading: "Signing you in...",
          success: "Welcome back, " + formData.username,
          error: (err) =>
            err.response?.data?.message || "Invalid username or password",
        },
        {
          style: {
            minWidth: "280px",
          },
          success: {
            duration: 4000,
            icon: "✔",
          },
          error: {
            duration: 5000,
            icon: "❌",
          },
        }
      )
      .then((res) => {
        if (res?.data?.user?.role === 'Client') {
          navigate("/client/dashboard");
        } else {
          navigate("/dashboard");
        }
      })
      .catch(() => {
        // toast.promise already shows error
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="login-container">
      {/* Left Side - Form */}
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h1>Sign In</h1>
          <p className="subtitle">
            Enter Your User Name and Password to Sign in.
          </p>
          <div className="divider"></div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>
                User Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Admin123"
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label>
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter Your Password"
                required
                disabled={loading}
              />
            </div>

            <div className="options">
              <label className="checkbox-label">
                <input type="checkbox" disabled={loading} />
                <span>Keep me Logged in</span>
              </label>
              <a href="#" className="forgot-link">
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="signin-btn" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="login-branding-section">
        <div className="branding-content">
          <img src={logo} alt="" id="logo" />
        </div>
      </div>
    </div>
  );
};

export default Login;
