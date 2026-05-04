// frontend/src/pages/masters/BankMaintenance.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar.jsx";
import Navbar from "../../components/layout/Navbar.jsx";
import Loading from "../../components/common/Loading.jsx";
import toast from "react-hot-toast";
import "../../styles/BankMaintenance.css";

const API_BASE = "https://harbourb-production.up.railway.app/api/banks";

const BankMaintenance = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("tab1");
  const [loading, setLoading] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [banks, setBanks] = useState([]);

  const [formData, setFormData] = useState({
    bankCode: "",
    bankName: "",
    accountName: "",
    accountAddress: "",
    accountStreet: "",
    accountCity: "",
    accountNumber: "",
    bankAddress: "",
    bankStreet: "",
    bankCity: "",
    telephone: "",
    swiftCode: "",
    isCompanyAccount: false,
    chequeNo: "",
    bankChargesCode: "",
    bankChargesName: "",
    glAccountCode: "",
    glAccountName: "",
  });

  const isFormEmpty = () => {
    return Object.values(formData).every((v) => v === "" || v === false);
  };

  useEffect(() => {
    const saved = localStorage.getItem("sidebarOpen");
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
    fetchBanks();
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("sidebarOpen", JSON.stringify(newState));
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAllBanks`);
      const data = await res.json();
      if (data.success) setBanks(data.data);
    } catch {
      toast.error("Failed to load banks");
    }
  };

  const isTab1Valid = () => {
    return (
      formData.bankCode &&
      formData.bankName &&
      formData.accountName &&
      formData.accountNumber
    );
  };

  const handleNext = () => {
    if (!isTab1Valid()) {
      toast.error("Please fill all required fields in Bank and Company info");
      return;
    }
    setActiveTab("tab2");
    toast.success("Bank info complete. Continue to Bank Details & GL Accounts");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeTab === "tab1") {
      handleNext();
      return;
    }

    setLoading(true);

    const url = isEditMode
      ? `${API_BASE}/updateBank/${editingId}`
      : `${API_BASE}/createBank`;

    const method = isEditMode ? "PUT" : "POST";

    toast
      .promise(
        fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
          .then((res) => {
            if (!res.ok) throw new Error("Failed");
            return res.json();
          })
          .then((data) => {
            if (!data.success) throw new Error(data.message);
            fetchBanks();

            // ✔ ALWAYS clear form after Create or Update
            resetForm();
            setIsEditMode(false);
            setEditingId(null);
          }),
        {
          loading: isEditMode ? "Updating..." : "Saving...",
          success: isEditMode ? "Bank updated!" : "Bank added!",
          error: "Operation failed",
        }
      )
      .finally(() => setLoading(false));
  };

  const resetForm = () => {
    setFormData({
      bankCode: "",
      bankName: "",
      bankAddress: "",
      bankStreet: "",
      bankCity: "",
      accountName: "",
      accountAddress: "",
      accountStreet: "",
      accountCity: "",
      accountNumber: "",
      telephone: "",
      swiftCode: "",
      isCompanyAccount: false,
      chequeNo: "",
      bankChargesCode: "",
      bankChargesName: "",
      glAccountCode: "",
      glAccountName: "",
    });
    setActiveTab("tab1");
  };

  const handleCancel = () => {
    if (isFormEmpty()) {
      // ✔ Form already empty → redirect
      navigate("/dashboard");
      return;
    }

    // ✔ Form has data → clear only
    resetForm();
    setIsEditMode(false);
    setEditingId(null);
    toast.success("Form cleared");
  };

  const openEditModal = async () => {
    setLoading(true);
    await fetchBanks();
    setLoading(false);
    setShowEditModal(true);
    setSearchTerm("");
  };

  const selectForEdit = (bank) => {
    setFormData({ ...bank });
    setIsEditMode(true);
    setEditingId(bank._id);
    setShowEditModal(false);
    setActiveTab("tab1");
    toast.success("Bank loaded for editing");
  };

  const filtered = banks.filter(
    (b) =>
      b.bankCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bankName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      {loading && <Loading fullPage={true} message={activeTab === "tab1" && !isEditMode ? "Processing..." : (isEditMode ? "Updating..." : "Saving...")} />}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`main-content ${sidebarOpen ? "sidebar-open" : "sidebar-closed"
          }`}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="page-content">
          <div className="page-wrapper">
            <div className="page-header">
              <h1 className="page-title">Bank Maintenance</h1>
              <p className="page-subtitle">
                Manage bank and company account details
              </p>
            </div>

            <div className="bank-card">
              <div className="tab-header">
                <button
                  className={`tab-btn ${activeTab === "tab1" ? "active" : ""}`}
                  onClick={() => setActiveTab("tab1")}
                >
                  Bank & Company Info
                </button>
                <button
                  className={`tab-btn ${activeTab === "tab2" ? "active" : ""}`}
                  onClick={() => handleNext()}
                >
                  Bank Details & GL Accounts
                </button>
              </div>

              <form onSubmit={handleSubmit} className="bank-form">
                {/* TAB 1 */}
                {activeTab === "tab1" && (
                  <div className="tab-content">
                    <div className="section">
                      <h3>Bank Information</h3>
                      <div className="form-grid">
                        <div className="input-group">
                          <label>
                            Bank Code <span className="required">*</span>
                          </label>
                          <input
                            name="bankCode"
                            value={formData.bankCode}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bankCode: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="input-group">
                          <label>
                            Bank Name <span className="required">*</span>
                          </label>
                          <input
                            name="bankName"
                            value={formData.bankName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bankName: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="section">
                      <h3>Company Account Information</h3>
                      <div className="form-grid">
                        <div className="input-group">
                          <label>
                            Account Name <span className="required">*</span>
                          </label>
                          <input
                            name="accountName"
                            value={formData.accountName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                accountName: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="input-group full">
                          <label>Address</label>
                          <input
                            name="accountAddress"
                            value={formData.accountAddress}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                accountAddress: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="input-group">
                          <label>Street</label>
                          <input
                            name="accountStreet"
                            value={formData.accountStreet}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                accountStreet: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="input-group">
                          <label>City</label>
                          <input
                            name="accountCity"
                            value={formData.accountCity}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                accountCity: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="input-group">
                          <label>
                            Account Number <span className="required">*</span>
                          </label>
                          <input
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                accountNumber: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2 */}
                {activeTab === "tab2" && (
                  <div className="tab-content">
                    <div className="section">
                      <h3>Bank Contact Information</h3>
                      <div className="form-grid">
                        <div className="input-group full">
                          <label>Bank Address</label>
                          <input
                            name="bankAddress"
                            value={formData.bankAddress}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bankAddress: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="input-group">
                          <label>Street</label>
                          <input
                            name="bankStreet"
                            value={formData.bankStreet}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bankStreet: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="input-group">
                          <label>City</label>
                          <input
                            name="bankCity"
                            value={formData.bankCity}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bankCity: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="input-group">
                          <label>Telephone</label>
                          <input
                            name="telephone"
                            value={formData.telephone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                telephone: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="input-group">
                          <label>SWIFT Code</label>
                          <input
                            name="swiftCode"
                            value={formData.swiftCode}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                swiftCode: e.target.value,
                              })
                            }
                          />
                        </div>

                        <label
                          className="checkbox-item"
                          style={{ marginLeft: "10px" }}
                        >
                          <input
                            type="checkbox"
                            name="isCompanyAccount"
                            checked={formData.isCompanyAccount}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                isCompanyAccount: e.target.checked,
                              })
                            }
                          />
                          <span className="checkmark"></span>
                          This is Company Account
                        </label>
                      </div>

                      <div className="checkbox-section">
                        <div className="input-group inline">
                          <label>Cheque No. Prefix</label>
                          <input
                            name="chequeNo"
                            value={formData.chequeNo}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                chequeNo: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="section">
                      <h3>GL Account Details</h3>
                      <div className="form-grid">
                        <div className="input-group">
                          <label>Bank Charges Account Code</label>
                          <input
                            name="bankChargesCode"
                            value={formData.bankChargesCode}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bankChargesCode: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="input-group">
                          <label>Bank Charges Account Name</label>
                          <input
                            name="bankChargesName"
                            value={formData.bankChargesName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bankChargesName: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div></div>

                        <div className="input-group">
                          <label>GL Account Code</label>
                          <input
                            name="glAccountCode"
                            value={formData.glAccountCode}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                glAccountCode: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="input-group">
                          <label>GL Account Name</label>
                          <input
                            name="glAccountName"
                            value={formData.glAccountName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                glAccountName: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={openEditModal}
                    disabled={loading}
                  >
                    Edit Existing
                  </button>

                  <div style={{ flex: 1 }}></div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {activeTab === "tab1"
                      ? "Next"
                      : loading
                        ? "Saving..."
                        : isEditMode
                          ? "Update Bank"
                          : "Save Bank"}
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancel}
                    disabled={loading}
                  >
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
              <h2>Select Bank to Edit</h2>
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
                <p className="no-data">No banks found</p>
              ) : (
                filtered.map((bank) => (
                  <div
                    key={bank._id}
                    className="list-item"
                    onClick={() => selectForEdit(bank)}
                  >
                    <div>
                      <strong>{bank.bankCode}</strong> - {bank.bankName}
                      <br />
                      <small>
                        {bank.accountName} • {bank.accountNumber}
                      </small>
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

export default BankMaintenance;
