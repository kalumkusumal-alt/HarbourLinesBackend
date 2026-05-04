import React, { useState, useEffect } from 'react';
import {
    FileText, Package, Anchor, ArrowUpRight, Plus, History, TrendingUp, Ship
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import Sidebar from '../../components/layout/Sidebar.jsx';
import Navbar from '../../components/layout/Navbar.jsx';
import Loading from '../../components/common/Loading.jsx';
import '../../styles/Dashboard.css';

const CanadaDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('sidebarOpen');
        if (saved !== null) setSidebarOpen(JSON.parse(saved));
        fetchStats();
    }, []);

    const toggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', JSON.stringify(newState));
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('https://harbourb-production.up.railway.app/api/stats/canada-dashboard');
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="dashboard-layout">
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
            <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                <Navbar toggleSidebar={toggleSidebar} />

                <div className="page-content" style={{ background: 'var(--bg-primary)', minHeight: 'calc(100vh - 70px)' }}>
                    <div className="page-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                        <div className="dashboard-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', padding: '12px', borderRadius: '16px', color: 'white' }}>
                                    <Anchor size={28} />
                                </div>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800' }}>Client Portal</h1>
                                    <p style={{ margin: 0, opacity: 0.7, fontWeight: '500' }}>Welcome back, {user?.username || 'Client'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="stats-grid" style={{ marginTop: '2.5rem' }}>
                            <div className="stat-card">
                                <div className="stat-icon blue">
                                    <FileText size={24} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">Total Bookings</span>
                                    <div className="stat-value">{stats?.summary.totalBookings || 0}</div>
                                    <span className="stat-trend positive">
                                        <ArrowUpRight size={16} /> Updated just now
                                    </span>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon green">
                                    <Package size={24} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">Total Packages</span>
                                    <div className="stat-value">{(stats?.summary.totalPackages || 0).toLocaleString()}</div>
                                    <span className="stat-trend positive">
                                        <TrendingUp size={16} /> Total items
                                    </span>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon orange">
                                    <Ship size={24} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">Total HBLs</span>
                                    <div className="stat-value">{(stats?.summary.totalHBLs || 0).toLocaleString()}</div>
                                    <span className="stat-trend positive">
                                        <ArrowUpRight size={16} /> Bills of Lading
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bottom-grid" style={{ marginTop: '2.5rem' }}>
                            {/* Recent Bookings Table */}
                            <div className="recent-jobs" style={{ flex: 2 }}>
                                <div className="section-header">
                                    <h3>Recent Manifest Bookings</h3>
                                    <button onClick={() => navigate('/client/history')}>View All</button>
                                </div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Master BL</th>
                                            <th>Booking #</th>
                                            <th>Vessel</th>
                                            <th>ETD Departure</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats?.recentBookings.map((booking, idx) => (
                                            <tr key={idx}>
                                                <td className="job-ref" style={{ color: '#3b82f6', fontWeight: '800' }}>{booking.masterBL || '-'}</td>
                                                <td><span className="badge" style={{ background: '#10b98115', color: '#10b981' }}>{booking.bookingNum || 'N/A'}</span></td>
                                                <td>{booking.vessel}</td>
                                                <td>{booking.etd}</td>
                                            </tr>
                                        ))}
                                        {(!stats?.recentBookings || stats.recentBookings.length === 0) && (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>No recent bookings found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Quick Actions */}
                            <div className="quick-actions" style={{ flex: 1 }}>
                                <h3>Quick Operations</h3>
                                <div className="actions-grid">
                                    <button className="action-btn" onClick={() => navigate('/client/new')} style={{ padding: '2rem' }}>
                                        <Plus size={24} />
                                        <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>New Booking</span>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: '5px 0 0' }}>Create a new manifest</p>
                                    </button>
                                    <button className="action-btn" onClick={() => navigate('/client/history')} style={{ padding: '2rem' }}>
                                        <History size={24} />
                                        <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>Booking History</span>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: '5px 0 0' }}>Manage previous records</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CanadaDashboard;
