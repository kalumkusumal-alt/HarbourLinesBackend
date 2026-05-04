// frontend/src/pages/freight/VesselMaintenance.jsx
import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import Navbar from '../../components/layout/Navbar.jsx';
import Loading from '../../components/common/Loading.jsx';
import toast from 'react-hot-toast';
import '../../styles/VesselMaintenance.css';

const API_BASE = 'https://harbourb-production.up.railway.app/api/vessels';

const VesselMaintenance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vessels, setVessels] = useState([]);

  // Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    country: '',
    agentName: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
    fetchVessels();
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const fetchVessels = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAllVessels`);
      const data = await res.json();
      if (data.success) setVessels(data.data);
    } catch (err) {
      toast.error('Failed to load vessels');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Vessel Code and Name are required!');
      return;
    }

    setLoading(true);

    const url = isEditMode
      ? `${API_BASE}/updateVessel/${editingId}`
      : `${API_BASE}/createVessel`;

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
          fetchVessels();
          if (!isEditMode) {
            setFormData({ code: '', name: '', country: '', agentName: '' });
          }
          setIsEditMode(false);
          setEditingId(null);
        }),
      {
        loading: isEditMode ? 'Updating...' : 'Saving...',
        success: isEditMode ? 'Vessel updated!' : 'Vessel added!',
        error: 'Operation failed'
      }
    ).finally(() => setLoading(false));
  };

  const isFormEmpty = () => {
    return (
      !formData.code.trim() &&
      !formData.name.trim() &&
      !formData.country.trim() &&
      !formData.agentName.trim()
    );
  };

  const handleCancel = () => {
    if (!isFormEmpty()) {
      setFormData({ code: '', name: '', country: '', agentName: '' });
      setIsEditMode(false);
      setEditingId(null);
      toast.success('Form cleared');
    } else {
      window.location.href = '/dashboard';
    }
  };

  const openEditModal = async () => {
    setLoading(true);
    await fetchVessels();
    setLoading(false);
    setShowEditModal(true);
    setSearchTerm('');
  };

  const selectForEdit = (vessel) => {
    setFormData({ ...vessel });
    setIsEditMode(true);
    setEditingId(vessel._id);
    setShowEditModal(false);
    toast.success('Vessel loaded for editing');
  };

  const filtered = vessels.filter(v =>
    v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h1 className="page-title">Vessel Maintenance</h1>
              <p className="page-subtitle">Manage shipping vessels and their agents</p>
            </div>

            <div className="vessel-card">
              <form onSubmit={handleSubmit} className="vessel-form">
                <div className="form-grid">
                  <div className="input-group">
                    <label>Vessel Code <span className="required">*</span></label>
                    <input name="code" value={formData.code} onChange={handleChange} required disabled={loading} maxLength="10" />
                  </div>
                  <div className="input-group">
                    <label>Vessel Name <span className="required">*</span></label>
                    <input name="name" value={formData.name} onChange={handleChange} required disabled={loading} />
                  </div>
                  <div className="input-group">
                    <label>Country</label>
                    <input name="country" value={formData.country} onChange={handleChange} disabled={loading} placeholder="e.g. Singapore, Panama" />
                  </div>
                  <div className="input-group">
                    <label>Agent Name</label>
                    <input name="agentName" value={formData.agentName} onChange={handleChange} disabled={loading} />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-edit" onClick={openEditModal}>
                    Edit Existing
                  </button>

                  <div style={{ flex: 1 }}></div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (isEditMode ? 'Update Vessel' : 'Add Vessel')}
                  </button>

                  <button type="button" className="btn-secondary" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </button>
                </div>
              </form>

              {/* Table */}
              <div className="vessel-table">
                <h3>All Vessels</h3>
                {vessels.length === 0 ? (
                  <p className="no-data">No vessels added yet</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Country</th>
                        <th>Agent</th>
                        <th>Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vessels.map(v => (
                        <tr key={v._id}>
                          <td><strong>{v.code}</strong></td>
                          <td>{v.name}</td>
                          <td>{v.country || '-'}</td>
                          <td>{v.agentName || '-'}</td>
                          <td>{new Date(v.createdAt).toLocaleDateString()}</td>
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
              <h2>Select Vessel to Edit</h2>
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
                <p className="no-data">No vessels found</p>
              ) : (
                filtered.map(vessel => (
                  <div key={vessel._id} className="list-item" onClick={() => selectForEdit(vessel)}>
                    <div>
                      <strong>{vessel.code}</strong> - {vessel.name}
                      {vessel.country && <span style={{ marginLeft: '8px', color: '#64748b' }}>• {vessel.country}</span>}
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

export default VesselMaintenance;
