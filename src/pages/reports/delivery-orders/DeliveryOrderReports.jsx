// frontend/src/pages/reports/delivery-orders/DeliveryOrderReports.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Sidebar from "../../../components/layout/Sidebar.jsx";
import Navbar from "../../../components/layout/Navbar.jsx";
import Loading from "../../../components/common/Loading.jsx";

const API_BASE = "https://harbourb-production.up.railway.app/api/delivery-orders";

const DeliveryOrderReports = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("sidebarOpen");
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
    fetchDOs();
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("sidebarOpen", JSON.stringify(newState));
  };

  const fetchDOs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/getAllDOs`);
      const data = await res.json();
      if (data.success) {
        setDeliveryOrders(data.data);
      }
    } catch (err) {
      toast.error("Failed to load Delivery Orders");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (id) => {
    const reportUrl = `/src/assets/reports/format/index.html?id=${id}`;
    window.open(reportUrl, '_blank');
  };

  const filteredDOs = deliveryOrders.filter(doItem =>
    doItem.doNum?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doItem.jobNum?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doItem.consigneeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      {loading && <Loading fullPage={true} message="Loading Delivery Orders..." />}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`main-content ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="page-content">
          <div className="page-wrapper">
            <div className="page-header">
              <h1 className="page-title">Reports</h1>
              <p className="page-subtitle">Print Delivery Orders and other reports</p>
            </div>

            <div className="maintenance-card">
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Search by DO Number, Job Number or Consignee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    width: '100%',
                    maxWidth: '400px',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)'
                  }}
                />
                {/* <button 
                  onClick={fetchDOs} 
                  className="btn-secondary"
                  style={{ minWidth: 'auto' }}
                >
                  <span className="material-symbols-rounded">refresh</span>
                </button> */}
              </div>

              <div className="table-container" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--table-header)' }}>
                      <th style={{ padding: '12px', fontWeight: '600', color: 'white' }}>DO Number</th>
                      <th style={{ padding: '12px', fontWeight: '600', color: 'white' }}>Job Number</th>
                      <th style={{ padding: '12px', fontWeight: '600', color: 'white' }}>Consignee</th>
                      <th style={{ padding: '12px', fontWeight: '600', color: 'white' }}>Created Date</th>
                      <th style={{ padding: '12px', fontWeight: '600', color: 'white' }}>Status</th>
                      <th style={{ padding: '12px', fontWeight: '600', color: 'white' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDOs.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No Delivery Orders found</td>
                      </tr>
                    ) : (
                      filteredDOs.map((item) => (
                        <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                          <td style={{ padding: '12px' }}>{item.doNum}</td>
                          <td style={{ padding: '12px' }}>{item.jobNum}</td>
                          <td style={{ padding: '12px' }}>{item.consigneeName || '-'}</td>
                          <td style={{ padding: '12px' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.85rem',
                              background: item.status === 'Approved' ? 'var(--highlight-success)' : 'var(--bg-primary)',
                              color: item.status === 'Approved' ? '#10b981' : 'var(--text-secondary)'
                            }}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <button
                              onClick={() => handlePrint(item._id)}
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                              <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>print</span>
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

export default DeliveryOrderReports;
