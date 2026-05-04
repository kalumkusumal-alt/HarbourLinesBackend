// frontend/src/pages/freight/AirDestinationMaintenance.jsx
import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import Navbar from '../../components/layout/Navbar.jsx';
import Loading from '../../components/common/Loading.jsx';
import toast from 'react-hot-toast';
import '../../styles/AirDestinationMaintenance.css';

const API_BASE = 'https://harbourb-production.up.railway.app/api/air-destinations';

const AirDestinationMaintenance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [destinations, setDestinations] = useState([]);

  // Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    country: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
    fetchDestinations();
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const fetchDestinations = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAllDestinations`);
      const data = await res.json();
      if (data.success) setDestinations(data.data);
    } catch (err) {
      toast.error('Failed to load air destinations');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.country) {
      toast.error('Code, Name and Country are required!');
      return;
    }

    setLoading(true);

    const url = isEditMode
      ? `${API_BASE}/updateDestination/${editingId}`
      : `${API_BASE}/createDestination`;

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
          fetchDestinations();
          if (!isEditMode) {
            setFormData({ code: '', name: '', country: '' });
          }
          setIsEditMode(false);
          setEditingId(null);
        }),
      {
        loading: isEditMode ? 'Updating...' : 'Saving...',
        success: isEditMode ? 'Destination updated!' : 'Destination added!',
        error: 'Operation failed'
      }
    ).finally(() => setLoading(false));
  };

  const handleCancel = () => {
    setFormData({ code: '', name: '', country: '' });
    setIsEditMode(false);
    setEditingId(null);
    toast.success('Form cleared');
  };

  const openEditModal = async () => {
    setLoading(true);
    await fetchDestinations();
    setLoading(false);
    setShowEditModal(true);
    setSearchTerm('');
  };

  const selectForEdit = (dest) => {
    setFormData({ code: dest.code, name: dest.name, country: dest.country });
    setIsEditMode(true);
    setEditingId(dest._id);
    setShowEditModal(false);
    toast.success('Destination loaded for editing');
  };

  const filtered = destinations.filter(d =>
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.country.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h1 className="page-title">Air Destination Maintenance</h1>
              <p className="page-subtitle">Manage global airports and air destinations</p>
            </div>

            <div className="air-destination-card">
              <form onSubmit={handleSubmit} className="air-destination-form">
                <div className="form-grid">
                  <div className="input-group">
                    <label>Airport Code <span className="required">*</span></label>
                    <input
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      maxLength="5"
                      placeholder="e.g. SIN, DXB, LHR"
                    />
                  </div>
                  <div className="input-group">
                    <label>Airport Name <span className="required">*</span></label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="e.g. Changi Airport, Dubai International"
                    />
                  </div>
                  <div className="input-group">
                    <label>Country <span className="required">*</span></label>
                    <input
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="e.g. Singapore, UAE, United Kingdom"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-edit" onClick={openEditModal}>
                    Edit Existing
                  </button>

                  <div style={{ flex: 1 }}></div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (isEditMode ? 'Update Airport' : 'Add Airport')}
                  </button>

                  <button type="button" className="btn-secondary" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </button>
                </div>
              </form>

              {/* Table */}
              <div className="air-destination-table">
                <h3>All Air Destinations</h3>
                {destinations.length === 0 ? (
                  <p className="no-data">No airports added yet</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Airport Name</th>
                        <th>Country</th>
                        <th>Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {destinations.map(dest => (
                        <tr key={dest._id}>
                          <td><strong>{dest.code}</strong></td>
                          <td>{dest.name}</td>
                          <td>{dest.country}</td>
                          <td>{new Date(dest.createdAt).toLocaleDateString()}</td>
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
              <h2>Select Airport to Edit</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-search">
              <input
                type="text"
                placeholder="Search by Code, Name or Country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-list">
              {filtered.length === 0 ? (
                <p className="no-data">No airports found</p>
              ) : (
                filtered.map(dest => (
                  <div key={dest._id} className="list-item" onClick={() => selectForEdit(dest)}>
                    <div>
                      <strong>{dest.code}</strong> — {dest.name}
                      <br />
                      <small>{dest.country}</small>
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

export default AirDestinationMaintenance;
