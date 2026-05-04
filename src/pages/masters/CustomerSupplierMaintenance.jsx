import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Navbar from "../../components/layout/Navbar.jsx";
import Loading from "../../components/common/Loading.jsx";
import "../../styles/CustomerSupplier.css";

const API_BASE = "https://harbourb-production.up.railway.app/api/customersuppliers";

const emptyForm = {
  code: "",
  name: "",
  address: "",
  street: "",
  city: "",
  country: "",
  telNo: "",
  email: "",
  customerType: "",
  category: "",
  isConsignee: false,
  isNotifyParty: false,
  isSupplier: false,
  isAgent: false,
};

const CustomerSupplierMaintenance = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("customer");
  const [loading, setLoading] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [allEntries, setAllEntries] = useState([]);

  const [formData, setFormData] = useState(emptyForm);

  const [hasClearedOnce, setHasClearedOnce] = useState(false);

  const customerTypes = [
    "Boi",
    "Foreing",
    "General",
    "Local",
    "Principle 01",
    "Principle 02",
    "Principle 03",
    "Trico",
  ];
  const categories = ["Normal", "Bad Outstanding"];

  useEffect(() => {
    const saved = localStorage.getItem("sidebarOpen");
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("sidebarOpen", JSON.stringify(newState));
  };

  const fetchAllEntries = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAllCustomerSuppliers`);
      const data = await res.json();
      if (data.success) setAllEntries(data.data);
    } catch (err) {
      toast.error("Failed to load data");
    }
  };

  const openEditModal = async () => {
    setLoading(true);
    await fetchAllEntries();
    setLoading(false);
    setShowEditModal(true);
    setSearchTerm("");
  };

  const selectForEdit = (entry) => {
    setFormData({
      code: entry.code,
      name: entry.name,
      address: entry.address || "",
      street: entry.street || "",
      city: entry.city || "",
      country: entry.country || "",
      telNo: entry.telNo || "",
      email: entry.email || "",
      customerType: entry.customerType || "",
      category: entry.category || "",
      isConsignee: entry.isConsignee || false,
      isNotifyParty: entry.isNotifyParty || false,
      isSupplier: entry.isSupplier || false,
      isAgent: entry.isAgent || false,
    });

    setActiveTab(entry.type);
    setIsEditMode(true);
    setEditingId(entry._id);
    setShowEditModal(false);
    setHasClearedOnce(false);

    toast.success(
      `${entry.type === "customer" ? "Customer" : "Supplier"
      } loaded for editing`
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      toast.error("Code and Name are required!");
      return;
    }

    setLoading(true);

    const url = isEditMode
      ? `${API_BASE}/updateCustomerSupplier/${editingId}`
      : `${API_BASE}/createCustomerSupplier`;

    const method = isEditMode ? "PUT" : "POST";

    toast
      .promise(
        fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: activeTab, ...formData }),
        })
          .then((res) => {
            if (!res.ok) throw new Error("Operation failed");
            return res.json();
          })
          .then((data) => {
            if (!data.success) throw new Error(data.message || "Failed");

            // After save or update → reset
            setFormData(emptyForm);
            setIsEditMode(false);
            setEditingId(null);
            setHasClearedOnce(false);

            return data;
          }),
        {
          loading: isEditMode ? "Updating..." : "Saving...",
          success: isEditMode
            ? `${activeTab === "customer" ? "Customer" : "Supplier"
            } updated successfully!`
            : `${activeTab === "customer" ? "Customer" : "Supplier"
            } saved successfully!`,
          error: (err) => err.message || "Operation failed",
        }
      )
      .finally(() => setLoading(false));
  };

  // ============================
  // CANCEL BUTTON LOGIC
  // ============================
  const handleCancel = () => {
    if (
      !hasClearedOnce &&
      Object.values(formData).some((v) => v !== "" && v !== false)
    ) {
      // First click → clear form
      setFormData(emptyForm);
      setIsEditMode(false);
      setEditingId(null);
      setHasClearedOnce(true);

      toast.success("Form cleared");
      return;
    }

    // Second click → redirect
    toast.success("Cancelled");
    navigate("/dashboard");
  };

  const filtered = allEntries.filter(
    (e) =>
      e.type === activeTab &&
      (e.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
              <h1 className="page-title">Customer / Supplier Maintenance</h1>
              <p className="page-subtitle">
                Add and manage customers and suppliers
              </p>
            </div>

            <div className="maintenance-card">
              <div className="modern-tabs">
                <button
                  className={`tab-btn ${activeTab === "customer" ? "active" : ""
                    }`}
                  onClick={() => {
                    setActiveTab("customer");
                    setHasClearedOnce(false);
                  }}
                >
                  <span className="material-symbols-rounded">person</span>
                  Customer
                </button>

                <button
                  className={`tab-btn ${activeTab === "supplier" ? "active" : ""
                    }`}
                  onClick={() => {
                    setActiveTab("supplier");
                    setHasClearedOnce(false);
                  }}
                >
                  <span className="material-symbols-rounded">
                    local_shipping
                  </span>
                  Supplier
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modern-form">
                <div className="form-grid">
                  <div className="input-group">
                    <label>Code *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="input-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="input-group full">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <div className="input-group">
                    <label>Street</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <div className="input-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <div className="input-group">
                    <label>Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <div className="input-group">
                    <label>Tel No.</label>
                    <input
                      type="tel"
                      name="telNo"
                      value={formData.telNo}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <div className="input-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <div className="input-group">
                    <label>Customer Type</label>
                    <select
                      name="customerType"
                      value={formData.customerType}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Select Type</option>
                      {customerTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="checkbox-grid">
                  {activeTab === "customer" ? (
                    <>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="isConsignee"
                          checked={formData.isConsignee}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <span className="checkmark"></span> Consignee
                      </label>

                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="isNotifyParty"
                          checked={formData.isNotifyParty}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <span className="checkmark"></span> Notify Party
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="isSupplier"
                          checked={formData.isSupplier}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <span className="checkmark"></span> Supplier
                      </label>

                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="isAgent"
                          checked={formData.isAgent}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <span className="checkmark"></span> Origin/Destination
                        Agent
                      </label>
                    </>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={openEditModal}
                  >
                    <span className="material-symbols-rounded">edit</span> Edit
                    Existing
                  </button>

                  <div style={{ flex: 1 }}></div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    <span className="material-symbols-rounded">save</span>
                    {isEditMode
                      ? `Update ${activeTab === "customer" ? "Customer" : "Supplier"
                      }`
                      : `Save ${activeTab === "customer" ? "Customer" : "Supplier"
                      }`}
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
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                Select {activeTab === "customer" ? "Customer" : "Supplier"} to
                Edit
              </h2>
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
                <p className="no-data">No {activeTab}s found</p>
              ) : (
                filtered.map((entry) => (
                  <div
                    key={entry._id}
                    className="list-item"
                    onClick={() => selectForEdit(entry)}
                  >
                    <div>
                      <strong>{entry.code}</strong> - {entry.name}
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

export default CustomerSupplierMaintenance;
