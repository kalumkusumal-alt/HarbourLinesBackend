// frontend/src/pages/master/ChargesMaintenance.jsx
import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import Navbar from '../../components/layout/Navbar.jsx';
import Loading from '../../components/common/Loading.jsx';
import toast from 'react-hot-toast';

const API_BASE = 'https://harbourb-production.up.railway.app/api/charges';

const ChargesMaintenance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [charges, setCharges] = useState([]);

  // Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    rate: '',
    plGroup: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
    fetchCharges();
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const fetchCharges = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAllCharges`);
      const data = await res.json();
      if (data.success) {
        setCharges(data.data || []);
      } else {
        toast.error('Failed to load charges');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load charges');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.name || !formData.rate) {
      toast.error('Code, Name, and Rate are required!');
      return;
    }

    setLoading(true);

    const url = isEditMode
      ? `${API_BASE}/updateCharge/${editingId}`
      : `${API_BASE}/createCharge`;

    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          rate: parseFloat(formData.rate),
          plGroup: formData.plGroup.trim() || undefined
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed');
      }

      await fetchCharges();
      handleCancel();
      toast.success(isEditMode ? 'Charge updated!' : 'Charge created!');
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      code: '',
      name: '',
      rate: '',
      plGroup: ''
    });
    setIsEditMode(false);
    setEditingId(null);
  };

  const openEditModal = async () => {
    setLoading(true);
    await fetchCharges();
    setLoading(false);
    setShowEditModal(true);
    setSearchTerm('');
  };

  const selectForEdit = (charge) => {
    setFormData({
      code: charge.code,
      name: charge.name,
      rate: charge.rate.toString(),
      plGroup: charge.plGroup || ''
    });
    setIsEditMode(true);
    setEditingId(charge._id);
    setShowEditModal(false);
    toast.success('Charge loaded for editing');
  };

  const filtered = charges.filter(c =>
    c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.plGroup?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h1 className="page-title">Charges Maintenance</h1>
              <p className="page-subtitle">Manage charge codes, rates, and P&L groups</p>
            </div>

            <div className="job-card">
              <form onSubmit={handleSubmit} className="job-form">
                <div className="section">
                  <h3>{isEditMode ? 'Edit Charge' : 'Create New Charge'}</h3>
                  <div className="form-grid">
                    <div className="input-group">
                      <label>Charge Code <span className="required">*</span></label>
                      <input
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="e.g. THC"
                        required
                        disabled={loading || isEditMode}
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>

                    <div className="input-group">
                      <label>Charge Name <span className="required">*</span></label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Terminal Handling Charge"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="input-group">
                      <label>Rate (LKR) <span className="required">*</span></label>
                      <input
                        type="number"
                        name="rate"
                        value={formData.rate}
                        onChange={handleChange}
                        placeholder="e.g. 25000"
                        min="0"
                        step="0.01"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="input-group">
                      <label>P&L Group (Optional)</label>
                      <input
                        name="plGroup"
                        value={formData.plGroup}
                        onChange={handleChange}
                        placeholder="e.g. Revenue - Freight"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-edit" onClick={openEditModal}>
                    Edit Existing Charge
                  </button>

                  <div style={{ flex: 1 }}></div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (isEditMode ? 'Update Charge' : 'Create Charge')}
                  </button>

                  <button type="button" className="btn-secondary" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </button>
                </div>
              </form>

              {/* Charges Table */}
              <div className="job-table">
                <h3>All Charges</h3>
                {charges.length === 0 ? (
                  <p className="no-data">No charges created yet</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Rate (LKR)</th>
                        <th>P&L Group</th>
                      </tr>
                    </thead>
                    <tbody>
                      {charges.map(charge => (
                        <tr key={charge._id}>
                          <td><strong>{charge.code}</strong></td>
                          <td>{charge.name}</td>
                          <td>{charge.rate.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</td>
                          <td>{charge.plGroup || '-'}</td>
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Charge to Edit</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
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
                <p className="no-data">No charges found</p>
              ) : (
                filtered.map(charge => (
                  <div key={charge._id} className="list-item" onClick={() => selectForEdit(charge)}>
                    <div>
                      <strong>{charge.code}</strong> - {charge.name}
                      <br />
                      <small>Rate: LKR {charge.rate.toLocaleString()} • Group: {charge.plGroup || '—'}</small>
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

export default ChargesMaintenance;
