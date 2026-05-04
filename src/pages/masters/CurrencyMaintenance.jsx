import { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Navbar from "../../components/layout/Navbar.jsx";
import Loading from "../../components/common/Loading.jsx";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import "../../styles/CurrencyMaintenance.css";

const API_BASE = "https://harbourb-production.up.railway.app/api/currencies";

const CurrencyMaintenance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    isLocal: false,
    buyRate: "",
    sellRate: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("sidebarOpen");
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
    fetchCurrencies();
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("sidebarOpen", JSON.stringify(newState));
  };

  const fetchCurrencies = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAllCurrencies`);
      const data = await res.json();
      if (data.success) setCurrencies(data.data);
    } catch (err) {
      toast.error("Failed to load currencies");
    }
  };

  const openEditModal = async () => {
    setLoading(true);
    await fetchCurrencies();
    setLoading(false);
    setShowEditModal(true);
    setSearchTerm("");
  };

  const selectForEdit = (currency) => {
    setFormData({
      code: currency.code,
      name: currency.name,
      isLocal: currency.isLocal,
      buyRate: currency.buyRate || "",
      sellRate: currency.sellRate || "",
    });
    setIsEditMode(true);
    setEditingId(currency._id);
    setShowEditModal(false);
    toast.success("Currency loaded for editing");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const isFormEmpty = () => {
    return (
      formData.code.trim() === "" &&
      formData.name.trim() === "" &&
      formData.buyRate.trim() === "" &&
      formData.sellRate.trim() === "" &&
      formData.isLocal === false
    );
  };

  const handleCancel = () => {
    if (!isFormEmpty()) {
      // First press → clear form
      setFormData({
        code: "",
        name: "",
        isLocal: false,
        buyRate: "",
        sellRate: "",
      });
      setIsEditMode(false);
      setEditingId(null);
      toast.success("Form cleared");
    } else {
      toast.success("Cancel successful");
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error("Code and Name are required!");
      return;
    }

    setLoading(true);

    const url = isEditMode
      ? `${API_BASE}/updateCurrency/${editingId}`
      : `${API_BASE}/createCurrency`;

    const method = isEditMode ? "PUT" : "POST";

    toast
      .promise(
        fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
          .then((res) => {
            if (!res.ok) throw new Error("Operation failed");
            return res.json();
          })
          .then((data) => {
            if (!data.success) throw new Error(data.message || "Failed");
            fetchCurrencies();

            if (!isEditMode) {
              setFormData({
                code: "",
                name: "",
                isLocal: false,
                buyRate: "",
                sellRate: "",
              });
            }

            setIsEditMode(false);
            setEditingId(null);
          }),
        {
          loading: isEditMode ? "Updating..." : "Saving...",
          success: isEditMode ? "Currency updated!" : "Currency added!",
          error: "Operation failed",
        }
      )
      .finally(() => setLoading(false));
  };

  const filtered = currencies.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      {loading && <Loading fullPage={true} message={isEditMode ? "Updating..." : "Processing..."} />}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`main-content ${sidebarOpen ? "sidebar-open" : "sidebar-closed"
          }`}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="page-content">
          <div className="page-wrapper">
            <div className="page-header">
              <h1 className="page-title">Currency Maintenance</h1>
              <p className="page-subtitle">
                Manage system currencies and exchange rates
              </p>
            </div>

            <div className="currency-card">
              <form onSubmit={handleSubmit} className="currency-form">
                <div className="form-grid">
                  <div className="input-group">
                    <label>
                      Code <span className="required">*</span>
                    </label>
                    <input
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      maxLength="3"
                    />
                  </div>

                  <div className="input-group">
                    <label>
                      Name <span className="required">*</span>
                    </label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="input-group">
                    <label>Buy Rate</label>
                    <input
                      type="number"
                      step="0.0001"
                      name="buyRate"
                      value={formData.buyRate}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <div className="input-group">
                    <label>Sell Rate</label>
                    <input
                      type="number"
                      step="0.0001"
                      name="sellRate"
                      value={formData.sellRate}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="checkbox-section">
                  <label
                    className="checkbox-item"
                    style={{ marginLeft: "20px" }}
                  >
                    <input
                      type="checkbox"
                      name="isLocal"
                      checked={formData.isLocal}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <span className="checkmark"></span>
                    This is Local Currency
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={openEditModal}
                  >
                    <span className="material-symbols-rounded">edit</span>
                    Edit Existing
                  </button>

                  <div style={{ flex: 1 }}></div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    <span className="material-symbols-rounded">save</span>
                    {loading
                      ? "Saving..."
                      : isEditMode
                        ? "Update Currency"
                        : "Add Currency"}
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <span className="material-symbols-rounded">close</span>
                    Cancel
                  </button>
                </div>
              </form>

              {/* Currency Table */}
              <div className="currency-table">
                <h3>All Currencies</h3>

                {currencies.length === 0 ? (
                  <p className="no-data">No currencies added yet</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Buy Rate</th>
                        <th>Sell Rate</th>
                        <th>Local</th>
                        <th>Created</th>
                      </tr>
                    </thead>

                    <tbody>
                      {currencies.map((c) => (
                        <tr
                          key={c._id}
                          className={c.isLocal ? "local-currency" : ""}
                        >
                          <td>
                            <strong>{c.code}</strong>
                          </td>
                          <td>{c.name}</td>
                          <td>{c.buyRate || "-"}</td>
                          <td>{c.sellRate || "-"}</td>
                          <td>{c.isLocal ? "Yes" : "No"}</td>
                          <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Currency to Edit</h2>
              <button
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-search">
              <input
                type="text"
                placeholder="Search by Code or Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modal-list">
              {filtered.length === 0 ? (
                <p className="no-data">No currencies found</p>
              ) : (
                filtered.map((currency) => (
                  <div
                    key={currency._id}
                    className="list-item"
                    onClick={() => selectForEdit(currency)}
                  >
                    <div>
                      <strong>{currency.code}</strong> - {currency.name}
                      {currency.isLocal && (
                        <span style={{ color: "#10b981", marginLeft: "8px" }}>
                          Local
                        </span>
                      )}
                    </div>
                    <span className="material-symbols-rounded">
                      arrow_forward_ios
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyMaintenance;
