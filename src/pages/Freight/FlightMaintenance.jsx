// frontend/src/pages/freight/FlightMaintenance.jsx
import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import Navbar from '../../components/layout/Navbar.jsx';
import Loading from '../../components/common/Loading.jsx';
import toast from 'react-hot-toast';
import '../../styles/flightMaintenance.css';

const API_BASE = 'https://harbourb-production.up.railway.app/api/flights';

const FlightMaintenance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState([]);

  // Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    flightNo: '',
    airlineName: '',
    airlineCode: '',
    localAgent: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
    fetchFlights();
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const fetchFlights = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAllFlights`);
      const data = await res.json();
      if (data.success) setFlights(data.data);
    } catch (err) {
      toast.error('Failed to load flights');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.flightNo || !formData.airlineName) {
      toast.error('Flight No and Airline Name are required!');
      return;
    }

    setLoading(true);

    const url = isEditMode
      ? `${API_BASE}/updateFlight/${editingId}`
      : `${API_BASE}/createFlight`;

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
          fetchFlights();
          if (!isEditMode) {
            setFormData({ flightNo: '', airlineName: '', airlineCode: '', localAgent: '' });
          }
          setIsEditMode(false);
          setEditingId(null);
        }),
      {
        loading: isEditMode ? 'Updating...' : 'Saving...',
        success: isEditMode ? 'Flight updated!' : 'Flight added!',
        error: 'Operation failed'
      }
    ).finally(() => setLoading(false));
  };

  const isFormEmpty = () => {
    return (
      !formData.flightNo.trim() &&
      !formData.airlineName.trim() &&
      !formData.airlineCode.trim() &&
      !formData.localAgent.trim()
    );
  };

  const handleCancel = () => {
    if (!isFormEmpty()) {
      // Clear form
      setFormData({
        flightNo: '',
        airlineName: '',
        airlineCode: '',
        localAgent: ''
      });

      setIsEditMode(false);
      setEditingId(null);

      toast.success('Form cleared');
    } else {
      // Redirect if nothing is typed
      window.location.href = '/dashboard';
    }
  };


  const openEditModal = async () => {
    setLoading(true);
    await fetchFlights();
    setLoading(false);
    setShowEditModal(true);
    setSearchTerm('');
  };

  const selectForEdit = (flight) => {
    setFormData({ ...flight });
    setIsEditMode(true);
    setEditingId(flight._id);
    setShowEditModal(false);
    toast.success('Flight loaded for editing');
  };

  const filtered = flights.filter(f =>
    f.flightNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.airlineName.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h1 className="page-title">Flight Maintenance</h1>
              <p className="page-subtitle">Manage airline flights and local agents</p>
            </div>

            <div className="flight-card">
              <form onSubmit={handleSubmit} className="flight-form">
                <div className="form-grid">
                  <div className="input-group">
                    <label>Flight No <span className="required">*</span></label>
                    <input name="flightNo" value={formData.flightNo} onChange={handleChange} required disabled={loading} maxLength="10" placeholder="e.g. SQ318" />
                  </div>
                  <div className="input-group">
                    <label>Airline Name <span className="required">*</span></label>
                    <input name="airlineName" value={formData.airlineName} onChange={handleChange} required disabled={loading} placeholder="e.g. Singapore Airlines" />
                  </div>
                  <div className="input-group">
                    <label>Airline Code</label>
                    <input name="airlineCode" value={formData.airlineCode} onChange={handleChange} disabled={loading} placeholder="e.g. SQ, EK, CX" />
                  </div>
                  <div className="input-group">
                    <label>Local Agent</label>
                    <input name="localAgent" value={formData.localAgent} onChange={handleChange} disabled={loading} placeholder="e.g. Global Air Services" />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-edit" onClick={openEditModal}>
                    Edit Existing
                  </button>

                  <div style={{ flex: 1 }}></div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (isEditMode ? 'Update Flight' : 'Add Flight')}
                  </button>

                  <button type="button" className="btn-secondary" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </button>
                </div>
              </form>

              {/* Table */}
              <div className="flight-table">
                <h3>All Flights</h3>
                {flights.length === 0 ? (
                  <p className="no-data">No flights added yet</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Flight No</th>
                        <th>Airline</th>
                        <th>Code</th>
                        <th>Local Agent</th>
                        <th>Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flights.map(f => (
                        <tr key={f._id}>
                          <td><strong>{f.flightNo}</strong></td>
                          <td>{f.airlineName}</td>
                          <td>{f.airlineCode || '-'}</td>
                          <td>{f.localAgent || '-'}</td>
                          <td>{new Date(f.createdAt).toLocaleDateString()}</td>
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
              <h2>Select Flight to Edit</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-search">
              <input
                type="text"
                placeholder="Search by Flight No or Airline..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-list">
              {filtered.length === 0 ? (
                <p className="no-data">No flights found</p>
              ) : (
                filtered.map(flight => (
                  <div key={flight._id} className="list-item" onClick={() => selectForEdit(flight)}>
                    <div>
                      <strong>{flight.flightNo}</strong> - {flight.airlineName}
                      {flight.airlineCode && (
                        <span style={{ marginLeft: '8px', color: '#64748b' }}>
                          ({flight.airlineCode})
                        </span>
                      )}
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

export default FlightMaintenance;
