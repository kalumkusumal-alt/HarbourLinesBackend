// frontend/src/pages/reports/Reports.jsx
import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import Navbar from '../../components/layout/Navbar.jsx';
import { Link } from 'react-router-dom';

const reportTypes = [
  {
    title: 'Delivery Order Reports',
    description: 'Print Custom Copy, SLPA forms, etc. for Delivery Orders',
    icon: 'local_shipping',
    path: '/reports/delivery-orders'
  },
  {
    title: 'Sales Invoice Reports',
    description: 'Print sales invoices for import jobs',
    icon: 'receipt_long',
    path: '/reports/sales-invoices'
  },
  {
    title: 'Manifest Reports',
    description: 'Generate and print manifest reports for sea import jobs',
    icon: 'assignment',
    path: '/imports/manifest-reports'
  },
  {
    title: 'E-Manifest Reports',
    description: 'Generate XML files for customs E-Manifest submission',
    icon: 'xml',
    path: '/imports/e-manifest-reports'
  },
  {
    title: 'Export B/L Creation',
    description: 'Create and save new Export Bill of Lading',
    icon: 'sailing',
    path: '/export'
  },
  // Add more in future
  // {
  //   title: 'Purchase Invoice Reports',
  //   description: 'Print purchase invoices',
  //   icon: 'receipt',
  //   path: '/reports/purchase-invoices'
  // },
];

const Reports = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`main-content ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="page-content">
          <div className="page-wrapper">
            <div className="page-header">
              <h1 className="page-title">Reports</h1>
              <p className="page-subtitle">Select a report type to view and print</p>
            </div>

            <div className="grid" style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
              {reportTypes.map((report) => (
                <Link
                  key={report.path}
                  to={report.path}
                  className="card-link"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="report-card" style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: 'var(--card-shadow)',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--card-shadow)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: '48px', color: '#3b82f6' }}>
                        {report.icon}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{report.title}</h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{report.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;