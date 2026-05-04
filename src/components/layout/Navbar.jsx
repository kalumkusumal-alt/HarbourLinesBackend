import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import toast from "react-hot-toast";
import "../../styles/Navbar.css";

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button onClick={toggleSidebar} className="menu-btn">
          <span className="material-symbols-rounded">menu</span>
        </button>

        <div className="search-bar">
          <span className="material-symbols-rounded">search</span>
          <input type="text" placeholder="Search or Type ......" />
        </div>
      </div>

      <div className="navbar-right">
        <label className="switch">
          <input
            id="theme-input"
            type="checkbox"
            checked={theme === 'dark'}
            onChange={toggleTheme}
          />
          <div className="slider round">
            <div className="sun-moon">
              <svg id="moon-dot-1" className="moon-dot" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="moon-dot-2" className="moon-dot" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="moon-dot-3" className="moon-dot" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="light-ray-1" className="light-ray" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="light-ray-2" className="light-ray" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="light-ray-3" className="light-ray" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>

              <svg id="cloud-1" className="cloud-dark" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="cloud-2" className="cloud-dark" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="cloud-3" className="cloud-dark" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="cloud-4" className="cloud-light" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="cloud-5" className="cloud-light" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="cloud-6" className="cloud-light" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
            </div>
            <div className="stars">
              <svg id="star-1" className="star" viewBox="0 0 20 20">
                <path
                  d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
                ></path>
              </svg>
              <svg id="star-2" className="star" viewBox="0 0 20 20">
                <path
                  d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
                ></path>
              </svg>
              <svg id="star-3" className="star" viewBox="0 0 20 20">
                <path
                  d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
                ></path>
              </svg>
              <svg id="star-4" className="star" viewBox="0 0 20 20">
                <path
                  d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
                ></path>
              </svg>
            </div>
          </div>
        </label>

        <button className="notification-btn">
          <span className="material-symbols-rounded">notifications</span>
          <span className="badge">3</span>
        </button>

        <div
          className="user-profile"
          onClick={() => setShowProfile(!showProfile)}
        >
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin123"
            alt="User"
            className="user-avatar"
          />
          <span className="user-name">{user?.username || "User"}</span>
          <span className="material-symbols-rounded dropdown-arrow">
            keyboard_arrow_down
          </span>

          {showProfile && (
            <div className="profile-dropdown">
              <div className="dropdown-item">
                <span className="material-symbols-rounded">person</span>
                Profile
              </div>
              <div className="dropdown-item">
                <span className="material-symbols-rounded">settings</span>
                Settings
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item text-danger" onClick={handleLogout}>
                <span className="material-symbols-rounded">logout</span>
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
