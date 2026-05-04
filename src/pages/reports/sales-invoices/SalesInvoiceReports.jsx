// frontend/src/pages/reports/sales-invoices/SalesInvoiceReports.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Sidebar from "../../../components/layout/Sidebar.jsx";
import Navbar from "../../../components/layout/Navbar.jsx";
import Loading from "../../../components/common/Loading.jsx";

const API_BASE = "https://harbourb-production.up.railway.app/api/sales-invoices";

const SalesInvoiceReports = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("sidebarOpen");
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
    fetchInvoices();
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("sidebarOpen", JSON.stringify(newState));
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/getAllInvoices`);
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data || []);
      } else {
        toast.error("Failed to load invoices");
      }
    } catch (err) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (id) => {
    // Opens in NEW TAB (same browser)
    const reportUrl = `/src/assets/reports/SalesInvoiceReport/SALES_INVOICE_FORMAT.html?id=${id}`;
    window.open(reportUrl, '_blank', 'noopener,noreferrer');
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.jobNum?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      {loading && <Loading fullPage={true} message="Loading Invoices..." />}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`main-content ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="page-content">
          <div className="page-wrapper">
            <div className="page-header">
              <h1 className="page-title">Sales Invoice Reports</h1>
              <p className="page-subtitle">Select an invoice to print</p>
            </div>

            <div className="maintenance-card">
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Search by Invoice No, Job No or Customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    width: '100%',
                    maxWidth: '500px',
                    fontSize: '1rem',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div className="table-container" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--table-header)', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '14px', textAlign: 'left', color: 'white' }}>Invoice No.</th>
                      <th style={{ padding: '14px', textAlign: 'left', color: 'white' }}>Job Number</th>
                      <th style={{ padding: '14px', textAlign: 'left', color: 'white' }}>Customer</th>
                      <th style={{ padding: '14px', textAlign: 'left', color: 'white' }}>Invoice Date</th>
                      <th style={{ padding: '14px', textAlign: 'left', color: 'white' }}>Total Amount</th>
                      <th style={{ padding: '14px', textAlign: 'left', color: 'white' }}>Status</th>
                      <th style={{ padding: '14px', textAlign: 'left', color: 'white' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          No sales invoices found
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <tr key={invoice._id} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                          <td style={{ padding: '14px', fontWeight: '600' }}>{invoice.invoiceNo}</td>
                          <td style={{ padding: '14px' }}>{invoice.jobNum || '-'}</td>
                          <td style={{ padding: '14px' }}>{invoice.customerName || '-'}</td>
                          <td style={{ padding: '14px' }}>{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                          <td style={{ padding: '14px', fontWeight: '600' }}>
                            {invoice.totalAmount?.toLocaleString('en-LK', { minimumFractionDigits: 2 }) || '0.00'}
                          </td>
                          <td style={{ padding: '14px' }}>
                            <span style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.9rem',
                              background: invoice.status === 'Paid' ? 'var(--highlight-success)' : 'var(--highlight-warning)',
                              color: invoice.status === 'Paid' ? '#10b981' : '#f59e0b'
                            }}>
                              {invoice.status || 'Issued'}
                            </span>
                          </td>
                          <td style={{ padding: '14px' }}>
                            <button
                              onClick={() => handlePrint(invoice._id)}
                              className="btn-primary"
                              style={{
                                padding: '10px 16px',
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              <span className="material-symbols-rounded">print</span>
                              Print
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesInvoiceReports;
