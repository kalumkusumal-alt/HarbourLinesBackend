// frontend/src/pages/masters/TaxMaintenance.jsx
import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import Navbar from '../../components/layout/Navbar.jsx';
import Loading from '../../components/common/Loading.jsx';
import toast from 'react-hot-toast';
import '../../styles/TaxMaintenance.css';

const API_BASE = 'https://harbourb-production.up.railway.app/api/taxes';

const TaxMaintenance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [taxes, setTaxes] = useState([]);

  // NEW: cancel click tracker
  const [cancelPressed, setCancelPressed] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    rate: '',
    registrationNo: '',
    operator: 'multiply',
    divideBy: '',
    invoiceHeader: '',
    displayOnly: false,

    priority: '1',

    revenueAccountStatus: 'Income',
    revenuePayableCode: '',
    costAccountStatus: 'Expense',
    costPayableCode: ''
  });

  const accountStatusOptions = ['Payable', 'Income', 'Receivable', 'Expense'];

  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
    fetchTaxes();
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const fetchTaxes = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAllTaxes`);
      const data = await res.json();
      if (data.success) setTaxes(data.data);
    } catch (err) {
      toast.error('Failed to load taxes');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.rate) {
      toast.error('Tax Code, Name and Rate are required!');
      return;
    }

    setLoading(true);

    const url = isEditMode
      ? `${API_BASE}/updateTax/${editingId}`
      : `${API_BASE}/createTax`;

    const method = isEditMode ? 'PUT' : 'POST';

    toast.promise(
      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed');
          return res.json();
        })
        .then(data => {
          if (!data.success) throw new Error(data.message);
          fetchTaxes();
          if (!isEditMode) resetForm();

          setIsEditMode(false);
          setEditingId(null);

          // RESET CANCEL BUTTON COUNTER
          setCancelPressed(false);
        }),
      {
        loading: isEditMode ? 'Updating...' : 'Saving...',
        success: isEditMode ? 'Tax updated!' : 'Tax added!',
        error: 'Operation failed'
      }
    ).finally(() => setLoading(false));
  };

  const resetForm = () => {
    setFormData({
      code: '', name: '', rate: '', registrationNo: '', operator: 'multiply',
      divideBy: '', invoiceHeader: '', displayOnly: false,
      priority: '1',
      revenueAccountStatus: 'Income', revenuePayableCode: '',
      costAccountStatus: 'Expense', costPayableCode: ''
    });
  };

  // UPDATED CANCEL LOGIC (Two-step)
  const handleCancel = () => {
    if (!cancelPressed) {
      resetForm();
      setIsEditMode(false);
      setEditingId(null);
      setCancelPressed(true);
      toast.success("Form cleared. Press again to exit.");
      return;
    }

    // SECOND CLICK → redirect
    window.location.href = "/dashboard";
  };

  const openEditModal = async () => {
    setLoading(true);
    await fetchTaxes();
    setLoading(false);
    setShowEditModal(true);
    setSearchTerm('');
  };

  const selectForEdit = (tax) => {
    setFormData({
      ...tax,
      priority: tax.priority?.toString() || '1'
    });

    setIsEditMode(true);
    setEditingId(tax._id);
    setShowEditModal(false);

    // Reset cancel step counter
    setCancelPressed(false);

    toast.success('Tax loaded for editing');
  };

  const filtered = taxes.filter(t =>
    t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      {loading && <Loading fullPage={true} message={isEditMode ? "Updating..." : "Processing..."} />}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="page-content">
          <div className="page-wrapper">
            <div className="page-header">
              <h1 className="page-title">Tax Maintenance</h1>
              <p className="page-subtitle">Configure tax codes, rates, and GL mapping</p>
            </div>

            <div className="tax-card">
              <form onSubmit={handleSubmit} className="tax-form">

                {/* TAX INFORMATION */}
                <div className="section">
                  <h3>Tax Information</h3>
                  <div className="form-grid">
                    <div className="input-group">
                      <label>Tax Code <span className="required">*</span></label>
                      <input name="code" value={formData.code} onChange={handleChange} required disabled={loading} maxLength="10" />
                    </div>
                    <div className="input-group">
                      <label>Tax Name <span className="required">*</span></label>
                      <input name="name" value={formData.name} onChange={handleChange} required disabled={loading} />
                    </div>
                  </div>
                </div>

                {/* RATE INFORMATION */}
                <div className="section">
                  <h3>Rate Information</h3>
                  <div className="form-grid">
                    <div className="input-group">
                      <label>Rate (%) <span className="required">*</span></label>
                      <input type="number" step="0.01" name="rate" value={formData.rate} onChange={handleChange} required disabled={loading} />
                    </div>
                    <div className="input-group">
                      <label>Registration No.</label>
                      <input name="registrationNo" value={formData.registrationNo} onChange={handleChange} disabled={loading} />
                    </div>
                    <div className="input-group">
                      <label>Operator</label>
                      <select name="operator" value={formData.operator} onChange={handleChange} disabled={loading}>
                        <option value="multiply">Multiply (×)</option>
                        <option value="divide">Divide (÷)</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Divide By</label>
                      <input type="number" step="0.01" name="divideBy" value={formData.divideBy} onChange={handleChange} disabled={loading} />
                    </div>
                    <div className="input-group">
                      <label>Invoice Header</label>
                      <input name="invoiceHeader" value={formData.invoiceHeader} onChange={handleChange} disabled={loading} placeholder="e.g. VAT 15%" />
                    </div>
                    <div className="input-group checkbox-inline">
                      <label className="checkbox-item">
                        <input type="checkbox" name="displayOnly" checked={formData.displayOnly} onChange={handleChange} disabled={loading} />
                        <span className="checkmark"></span>
                        Display Only (No Calculation)
                      </label>
                    </div>
                  </div>

                  {/* SINGLE PRIORITY FIELD */}
                  <div className="form-grid">
                    <div className="input-group">
                      <label>Priority (1)</label>
                      <select name="priority" value={formData.priority} onChange={handleChange} disabled={loading}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? '(Highest)' : n === 10 ? '(Lowest)' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* REVENUE & COST */}
                <div className="section">
                  <h3>Revenue GL Mapping</h3>
                  <div className="form-grid">
                    <div className="input-group">
                      <label>Account Status</label>
                      <select name="revenueAccountStatus" value={formData.revenueAccountStatus} onChange={handleChange} disabled={loading}>
                        {accountStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Payable / Receivable Code</label>
                      <input name="revenuePayableCode" value={formData.revenuePayableCode} onChange={handleChange} disabled={loading} />
                    </div>
                  </div>
                </div>

                <div className="section">
                  <h3>Cost GL Mapping</h3>
                  <div className="form-grid">
                    <div className="input-group">
                      <label>Account Status</label>
                      <select name="costAccountStatus" value={formData.costAccountStatus} onChange={handleChange} disabled={loading}>
                        {accountStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Payable / Receivable Code</label>
                      <input name="costPayableCode" value={formData.costPayableCode} onChange={handleChange} disabled={loading} />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-edit" onClick={openEditModal}>
                    Edit Existing
                  </button>
                  <div style={{ flex: 1 }}></div>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (isEditMode ? 'Update Tax' : 'Add Tax')}
                  </button>
                  <button type="button" className="btn-secondary" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Tax to Edit</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-search">
              <input
                type="text"
                placeholder="Search by Code or Name..."
                autoFocus
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="modal-list">
              {filtered.length === 0 ? (
                <p className="no-data">No taxes found</p>
              ) : (
                filtered.map(tax => (
                  <div
                    key={tax._id}
                    className="list-item"
                    onClick={() => selectForEdit(tax)}
                  >
                    <div>
                      <strong>{tax.code}</strong> - {tax.name}
                      <br />
                      <small>{tax.rate}% • Priority: {tax.priority}</small>
                    </div>
                    <span className="material-symbols-rounded">arrow_forward_ios</span>
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

export default TaxMaintenance;
