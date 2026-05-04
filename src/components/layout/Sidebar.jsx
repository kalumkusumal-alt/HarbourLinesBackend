// frontend/src/components/layout/Sidebar.jsx
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "../../styles/Sidebar.css";
import logo from "../../assets/headerLogo.png";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth(); // Get user role
  const sidebarRef = useRef(null);
  const location = useLocation();

  const [mastersOpen, setMastersOpen] = useState(false);
  const [freightOpen, setFreightOpen] = useState(false);
  const [seaJobsOpen, setSeaJobsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [canadaOpen, setCanadaOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: "dashboard", path: "/dashboard" },

    {
      name: "Master Files",
      icon: "folder_open",
      isDropdown: true,
      isOpen: mastersOpen,
      onToggle: () => setMastersOpen(!mastersOpen),
      subItems: [
        { name: "Customer / Supplier", path: "/masters/customers", icon: "people" },
        { name: "Currency", path: "/masters/currency", icon: "currency_exchange" },
        { name: "Unit of Measurement", path: "/masters/uom", icon: "square_foot" },
        { name: "Bank Maintenance", path: "/masters/bank", icon: "account_balance" },
        { name: "Tax Maintenance", path: "/masters/tax", icon: "receipt_long" },
        { name: "Charges Maintenance", path: "/masters/charges", icon: "receipt" },
      ],
    },

    {
      name: "Freight Master",
      icon: "directions_boat",
      isDropdown: true,
      isOpen: freightOpen,
      onToggle: () => setFreightOpen(!freightOpen),
      subItems: [
        { name: "Vessel Maintenance", path: "/freight/vessel", icon: "directions_boat_filled" },
        { name: "Flight Maintenance", path: "/freight/flight", icon: "flight" },
        { name: "Sea Destination Maintenance", path: "/freight/sea-destination", icon: "anchor" },
        { name: "Air Destination Maintenance", path: "/freight/air-destination", icon: "flight" },
      ],
    },

    {
      name: "Sea Freight Jobs",
      icon: "anchor",
      isDropdown: true,
      isOpen: seaJobsOpen,
      onToggle: () => setSeaJobsOpen(!seaJobsOpen),
      subItems: [
        {
          name: "Import",
          icon: "input",
          isDropdown: true,
          isOpen: importOpen,
          onToggle: () => setImportOpen(!importOpen),
          subItems: [
            { name: "Job Master - Import", path: "/sea-freight/import/job-master", icon: "note_add" },
            { name: "Delivery Order", path: "/sea-freight/import/delivery-order", icon: "local_shipping" },
          ],
        },
        {
          name: "Sales Invoice",
          path: "/sea-freight/sales-invoice",
          icon: "receipt_long",
        },
        {
          name: "Manifest Reports - Import",
          path: "/imports/manifest-reports",
          icon: "list_alt",
        },
        {
          name: "E-Manifest Reports - Import",
          path: "/imports/e-manifest-reports",
          icon: "description",
        },
      ],
    },

    {
      name: "Export",
      icon: "output",
      path: "/export",
    },

    {
      name: "Canada Manifest",
      icon: "assignment",
      isDropdown: true,
      isOpen: canadaOpen,
      onToggle: () => setCanadaOpen(!canadaOpen),
      subItems: [
        { name: "New Booking", path: "/client/new", icon: "add_circle" },
        { name: "Booking History", path: "/client/history", icon: "history" },
      ],
    },

    { name: "Reports", icon: "bar_chart", path: "/reports" },
    { name: "Users", icon: "manage_accounts", path: "/users" },
    { name: "Settings", icon: "settings", path: "/settings" },
  ];

  // Role-based Menu Filtering
  const filteredMenuItems = menuItems.filter(item => {
    if (user?.role === 'Client') {
      // Clients only see specific items
      return ['Dashboard', 'Canada Manifest'].includes(item.name);
    }
    // Admins and others see everything (except maybe Client Dashboard if we wanted to hide it)
    return true;
  });

  // Special handling for Client Dashboard path
  if (user?.role === 'Client') {
    const dashboardItem = filteredMenuItems.find(i => i.name === 'Dashboard');
    if (dashboardItem) dashboardItem.path = '/client/dashboard';
  }

  useEffect(() => {
    if (location.pathname.startsWith("/masters/")) setMastersOpen(true);
    if (location.pathname.startsWith("/freight/")) setFreightOpen(true);
    if (
      location.pathname.startsWith("/sea-freight/") ||
      location.pathname.startsWith("/imports/manifest-reports") ||
      location.pathname.startsWith("/imports/e-manifest-reports")
    ) {
      setSeaJobsOpen(true);
      if (location.pathname.includes("/import/") && !location.pathname.includes("/sales-invoice")) {
        setImportOpen(true);
      }
    }
    if (location.pathname.startsWith("/client")) setCanadaOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        const menuBtn = document.querySelector(".menu-btn");
        if (menuBtn && menuBtn.contains(event.target)) return;
        toggleSidebar();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, toggleSidebar]);

  const isMasterFilesActive = location.pathname.startsWith("/masters/");
  const isFreightActive = location.pathname.startsWith("/freight/");
  const isSeaJobsActive =
    location.pathname.startsWith("/sea-freight/") ||
    location.pathname.startsWith("/imports/manifest-reports") ||
    location.pathname.startsWith("/imports/e-manifest-reports");
  const isCanadaActive = location.pathname === "/client" || location.pathname.startsWith("/client/");

  return (
    <div ref={sidebarRef} className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <img src={logo} alt="Harbour Lines" className="logo-img" />
          {isOpen && <span className="logo-text">Harbour Lines</span>}
        </div>
      </div>

      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => (
          <div key={item.name}>
            {item.isDropdown ? (
              <div
                className={`nav-item dropdown ${item.isOpen ? "open" : ""} ${!isOpen &&
                  ((item.name === "Master Files" && isMasterFilesActive) ||
                    (item.name === "Freight Master" && isFreightActive) ||
                    (item.name === "Sea Freight Jobs" && isSeaJobsActive) ||
                    (item.name === "Canada Manifest" && isCanadaActive))
                  ? "active"
                  : ""
                  }`}
                onClick={item.onToggle}
              >
                <span className="material-symbols-rounded nav-icon">
                  {item.icon}
                </span>
                {isOpen && (
                  <>
                    <span className="nav-text">{item.name}</span>
                    <span className="material-symbols-rounded dropdown-arrow">
                      {item.isOpen ? "expand_less" : "expand_more"}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <NavLink
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                onClick={() => window.innerWidth < 1024 && toggleSidebar()}
              >
                <span className="material-symbols-rounded nav-icon">
                  {item.icon}
                </span>
                {isOpen && <span className="nav-text">{item.name}</span>}
              </NavLink>
            )}

            {item.isDropdown && item.isOpen && isOpen && (
              <div className="submenu">
                {item.subItems.map((sub) => (
                  <div key={sub.name}>
                    {sub.isDropdown ? (
                      <div
                        className={`submenu-item dropdown ${sub.isOpen ? "open" : ""}`}
                        onClick={sub.onToggle}
                      >
                        <span className="material-symbols-rounded submenu-icon">
                          {sub.icon}
                        </span>
                        <span className="submenu-text">{sub.name}</span>
                        <span className="material-symbols-rounded dropdown-arrow small">
                          {sub.isOpen ? "expand_less" : "expand_more"}
                        </span>
                      </div>
                    ) : (
                      <NavLink
                        to={sub.path}
                        end
                        className={({ isActive }) => `submenu-item ${isActive ? "active" : ""}`}
                        onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                      >
                        <span className="material-symbols-rounded submenu-icon">
                          {sub.icon}
                        </span>
                        <span className="submenu-text">{sub.name}</span>
                      </NavLink>
                    )}

                    {sub.isDropdown && sub.isOpen && isOpen && (
                      <div className="nested-submenu">
                        {sub.subItems.map((nested) => (
                          <NavLink
                            key={nested.name}
                            to={nested.path}
                            className={({ isActive }) => `nested-item ${isActive ? "active" : ""}`}
                            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                          >
                            <span className="material-symbols-rounded nested-icon">
                              {nested.icon}
                            </span>
                            <span className="nested-text">{nested.name}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <button onClick={toggleSidebar} className="sidebar-toggle">
        <span className="material-symbols-rounded">
          {isOpen ? "chevron_left" : "chevron_right"}
        </span>
      </button>
    </div>
  );
};

export default Sidebar;