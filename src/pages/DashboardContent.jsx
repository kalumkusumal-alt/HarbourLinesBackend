import React, { useState, useEffect } from 'react';
import {
    Users, Ship, Package, DollarSign, FileText,
    ArrowUpRight, ArrowDownRight, TrendingUp,
    Clock, Plus, CheckCircle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from '../components/common/Loading.jsx';
import '../styles/Dashboard.css';

const DashboardContent = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('https://harbourb-production.up.railway.app/api/stats/dashboard');
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

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    if (loading) return <Loading />;

    return (
        <div className="dashboard-content">
            <div className="dashboard-header">
                <h1>Welcome back, {user?.username || 'User'}</h1>
                <p>Operational overview for Harbour Lines System</p>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <Ship size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Jobs (Combined)</span>
                        <div className="stat-value">{stats?.summary.totalJobs}</div>
                        <span className="stat-trend positive">
                            <ArrowUpRight size={16} /> 12% from last month
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Monthly Revenue</span>
                        <div className="stat-value">LKR {stats?.summary.totalRevenue.toLocaleString()}</div>
                        <span className="stat-trend positive">
                            <ArrowUpRight size={16} /> 8% vs projected
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon orange">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Outstanding Invoices</span>
                        <div className="stat-value">{stats?.summary.outstandingInvoices}</div>
                        <span className="stat-trend negative">
                            <ArrowDownRight size={16} /> 3 overdue
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon purple">
                        <FileText size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Canada Manifests</span>
                        <div className="stat-value">{stats?.summary.canadaHblCount}</div>
                        <span className="stat-trend positive">
                            <CheckCircle size={16} /> All synced
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                <div className="chart-container">
                    <h3>6-Month Revenue Trend (LKR)</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats?.revenueTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-container">
                    <h3>Job Distribution by Type</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats?.jobDistribution}
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats?.jobDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bottom-grid">
                {/* Recent Jobs Table */}
                <div className="recent-jobs">
                    <div className="section-header">
                        <h3>Recent Activity</h3>
                        <button onClick={() => navigate('/reports')}>View All</button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Job Reference</th>
                                <th>Type</th>
                                <th>Created At</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recentJobs.map((job, idx) => (
                                <tr key={idx}>
                                    <td className="job-ref">{job.ref}</td>
                                    <td><span className={`badge ${job.type.replace(' ', '-').toLowerCase()}`}>{job.type}</span></td>
                                    <td>{new Date(job.createdAt).toLocaleDateString()}</td>
                                    <td><span className="status-dot"></span> Active</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                    <h3>Operations Hub</h3>
                    <div className="actions-grid">
                        <button className="action-btn" onClick={() => navigate('/export')}>
                            <Plus size={20} />
                            <span>New Export Job</span>
                        </button>
                        <button className="action-btn" onClick={() => navigate('/sea-freight/import/job-master')}>
                            <Plus size={20} />
                            <span>New Import Job</span>
                        </button>
                        <button className="action-btn" onClick={() => navigate('/masters/customers')}>
                            <Users size={20} />
                            <span>Add Customer</span>
                        </button>
                        <button className="action-btn" onClick={() => navigate('/reports/sales-invoices')}>
                            <FileText size={20} />
                            <span>Generate Invoice</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardContent;
