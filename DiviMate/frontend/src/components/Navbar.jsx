import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Notifications from "./Notifications";
import {
  FiHome,
  FiUsers,
  FiCheckCircle,
  FiCpu,
  FiLogOut,
  FiMenu,
  FiX,
  FiUser,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import "../styles/navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef(null);

  // Close avatar dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false);
      }
    };
    if (avatarOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [avatarOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: <FiHome /> },
    { to: "/groups", label: "Groups", icon: <FiUsers /> },
    { to: "/settlements", label: "Settlements", icon: <FiCheckCircle /> },
    { to: "/menu-analyzer", label: "AI Split", icon: <FiCpu /> },
  ];

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/dashboard" className="nav-brand">
          DiviMate
        </Link>

        <div className={`nav-links ${mobileOpen ? "open" : ""}`}>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link ${location.pathname === l.to ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              {l.icon}
              <span>{l.label}</span>
            </Link>
          ))}
        </div>

        <div className="nav-right">
          <Notifications />
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button>

          {/* Avatar Dropdown */}
          <div className="avatar-wrapper" ref={avatarRef}>
            <button
              className="avatar-btn"
              onClick={() => setAvatarOpen((prev) => !prev)}
              title="Profile"
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </button>

            {avatarOpen && (
              <div className="avatar-dropdown">
                <div className="avatar-dropdown-header">
                  <span className="avatar-dropdown-name">{user?.name}</span>
                  <span className="avatar-dropdown-email">{user?.email}</span>
                </div>
                <div className="avatar-dropdown-divider" />
                <Link
                  to="/profile"
                  className="avatar-dropdown-item"
                  onClick={() => setAvatarOpen(false)}
                >
                  <FiUser /> Profile
                </Link>
                <button
                  className="avatar-dropdown-item logout"
                  onClick={() => {
                    setAvatarOpen(false);
                    handleLogout();
                  }}
                >
                  <FiLogOut /> Logout
                </button>
              </div>
            )}
          </div>

          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
