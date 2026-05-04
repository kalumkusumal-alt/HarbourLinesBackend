// frontend/src/pages/UserMaintenance.jsx
import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import Loading from '../components/common/Loading.jsx';
import toast from 'react-hot-toast';
import '../styles/UserMaintenance.css';

const API_BASE = 'https://harbourb-production.up.railway.app/api/users';

const UserMaintenance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  // Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    username: '',
    password: '',
    role: 'Admin',
    isActive: true
  });

  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
    fetchUsers();
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAllUsers`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        toast.error('Failed to load users');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
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

    if (!formData.code || !formData.username) {
      toast.error('Code and Username are required!');
      return;
    }

    if (!isEditMode && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    setLoading(true);

    const url = isEditMode
      ? `${API_BASE}/updateUser/${editingId}`
      : `${API_BASE}/createUser`;

    const body = isEditMode
      ? {
        code: formData.code,
        username: formData.username,
        role: formData.role,
        isActive: formData.isActive
      }
      : {
        code: formData.code,
        username: formData.username,
        password: formData.password,
        role: formData.role
      };

    try {
      const res = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed');
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      await fetchUsers();
      handleCancel();
      toast.success(isEditMode ? 'User updated!' : 'User created!');
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      code: '',
      username: '',
      password: '',
      role: 'Admin',
      isActive: true
    });
    setIsEditMode(false);
    setEditingId(null);
  };

  const openEditModal = async () => {
    setLoading(true);
    await fetchUsers();
    setLoading(false);
    setShowEditModal(true);
    setSearchTerm('');
  };

  const selectForEdit = (user) => {
    setFormData({
      code: user.code,
      username: user.username,
      password: '',
      role: user.role || 'Admin',
      isActive: user.isActive ?? true
    });
    setIsEditMode(true);
    setEditingId(user._id);
    setShowEditModal(false);
    toast.success('User loaded for editing');
  };

  const filtered = users.filter(u =>
    u.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h1 className="page-title">User Maintenance</h1>
              <p className="page-subtitle">Create and manage system users</p>
            </div>

            <div className="job-card">
              <form onSubmit={handleSubmit} className="job-form">

                <div className="section">
                  <h3>{isEditMode ? 'Edit User' : 'Create New User'}</h3>
                  <div className="form-grid">

                    <div className="input-group">
                      <label>User Code <span className="required">*</span></label>
                      <input
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="e.g. ADMIN001"
                        required
                        disabled={loading || isEditMode}
                      />
                    </div>

                    <div className="input-group">
                      <label>User Name <span className="required">*</span></label>
                      <input
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="e.g. John Doe"
                        required
                        disabled={loading}
                      />
                    </div>

                    {!isEditMode && (
                      <div className="input-group">
                        <label>Password <span className="required">*</span></label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="••••••••"
                          required
                          disabled={loading}
                        />
                      </div>
                    )}

                    <div className="input-group">
                      <label>User Role <span className="required">*</span></label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '12px',
                          border: '1.5px solid var(--border-color)',
                          background: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: '1rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Power User">Power User</option>
                        <option value="Import Manager">Import Manager</option>
                        <option value="Operations Executive">Operations Executive</option>
                        <option value="Operations Manager">Operations Manager</option>
                        <option value="Client">Client</option>
                      </select>
                    </div>

                    <div className="input-group" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem' }}>
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleChange}
                          style={{
                            width: '24px',
                            height: '24px',
                            accentColor: formData.isActive ? '#10b981' : '#ef4444',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ fontWeight: '700', color: formData.isActive ? '#10b981' : '#ef4444' }}>
                          User is Active
                        </span>
                      </label>
                      <small style={{ color: 'var(--text-secondary)', marginLeft: '36px' }}>
                        Uncheck to deactivate user account
                      </small>
                    </div>

                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-edit" onClick={openEditModal}>
                    Edit Existing User
                  </button>

                  <div style={{ flex: 1 }}></div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
                  </button>

                  <button type="button" className="btn-secondary" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </button>
                </div>
              </form>

              {/* Users Table */}
              <div className="job-table">
                <h3>All Users</h3>
                {users.length === 0 ? (
                  <p className="no-data">No users created yet</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user._id}>
                          <td><strong>{user.code}</strong></td>
                          <td>{user.username}</td>
                          <td><span style={{ fontWeight: '600', color: '#3b82f6' }}>{user.role}</span></td>
                          <td>
                            <span style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '0.9rem',
                              backgroundColor: user.isActive ? 'var(--highlight-success)' : 'var(--highlight-danger)',
                              color: user.isActive ? '#10b981' : '#ef4444',
                              fontWeight: '600'
                            }}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
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
              <h2>Select User to Edit</h2>
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
                <p className="no-data">No users found</p>
              ) : (
                filtered.map(user => (
                  <div key={user._id} className="list-item" onClick={() => selectForEdit(user)}>
                    <div>
                      <strong>{user.code}</strong> - {user.username}
                      <br />
                      <small>Role: {user.role} | Status: {user.isActive ? 'Active' : 'Inactive'}</small>
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

export default UserMaintenance;
