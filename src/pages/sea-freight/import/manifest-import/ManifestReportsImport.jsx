// frontend/src/pages/reports/manifest-import/ManifestReportsImport.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Sidebar from "../../../../components/layout/Sidebar.jsx";
import Navbar from "../../../../components/layout/Navbar.jsx";

const VESSEL_API = "https://harbourb-production.up.railway.app/api/vessels/getAllVessels";
const JOB_API = "https://harbourb-production.up.railway.app/api/jobs/sea-import/getAllJobs";
const DO_API = "https://harbourb-production.up.railway.app/api/delivery-orders/getAllDOs";

const ManifestReportsImport = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [vessels, setVessels] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [deliveryOrders, setDeliveryOrders] = useState([]);

  const [selectedVessel, setSelectedVessel] = useState(null);
  const [selectedVoyage, setSelectedVoyage] = useState('');
  const [selectedMBL, setSelectedMBL] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  const [vesselSearch, setVesselSearch] = useState('');
  const [showVesselDropdown, setShowVesselDropdown] = useState(false);

  const [selectedHBLs, setSelectedHBLs] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarOpen");
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
    fetchVessels();
    fetchJobs();
    fetchDeliveryOrders();
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("sidebarOpen", JSON.stringify(newState));
  };

  const fetchVessels = async () => {
    try {
      const res = await fetch(VESSEL_API);
      const data = await res.json();
      if (data.success) setVessels(data.data);
    } catch (err) {
      toast.error("Failed to load vessels");
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(JOB_API);
      const data = await res.json();
      if (data.success) setJobs(data.data);
    } catch (err) {
      toast.error("Failed to load jobs");
    }
  };

  const fetchDeliveryOrders = async () => {
    try {
      const res = await fetch(DO_API);
      const data = await res.json();
      if (data.success) setDeliveryOrders(data.data);
    } catch (err) {
      toast.error("Failed to load delivery orders");
    }
  };

  const voyages = [...new Set(
    jobs
      .filter(j => j.vesselId?._id === selectedVessel?._id || j.vesselId === selectedVessel?._id)
      .map(j => j.voyage)
      .filter(Boolean)
  )].sort();

  const mbls = [...new Set(
    jobs
      .filter(j =>
        (j.vesselId?._id === selectedVessel?._id || j.vesselId === selectedVessel?._id) &&
        j.voyage === selectedVoyage
      )
      .map(j => j.mblNumber)
      .filter(Boolean)
  )].sort();

  const mblJobs = jobs.filter(j => j.mblNumber === selectedMBL);

  const jobDOs = deliveryOrders.filter(doItem => doItem.jobId === selectedJob?._id);

  const handleVesselSelect = (vessel) => {
    setSelectedVessel(vessel);
    setSelectedVoyage('');
    setSelectedMBL('');
    setSelectedJob(null);
    setSelectedHBLs(new Set());
    setSelectAll(false);
    setVesselSearch(`${vessel.code} - ${vessel.name}`);
    setShowVesselDropdown(false);
  };

  const filteredVessels = vessels.filter(v =>
    v.code?.toLowerCase().includes(vesselSearch.toLowerCase()) ||
    v.name?.toLowerCase().includes(vesselSearch.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedHBLs(new Set());
    } else {
      const allIds = new Set(jobDOs.map(doItem => doItem._id));
      setSelectedHBLs(allIds);
    }
    setSelectAll(!selectAll);
  };

  const handleRowSelect = (doId) => {
    const newSelected = new Set(selectedHBLs);
    if (newSelected.has(doId)) {
      newSelected.delete(doId);
    } else {
      newSelected.add(doId);
    }
    setSelectedHBLs(newSelected);
    setSelectAll(newSelected.size === jobDOs.length);
  };

  const handleGenerateReport = () => {
    if (selectedHBLs.size === 0) {
      toast.error("Please select at least one HBL");
      return;
    }

    const ids = Array.from(selectedHBLs).join(',');
    const reportUrl = `/src/assets/reports/ManifestReport/MANIFEST_REPORT.html?hbls=${ids}`;
    window.open(reportUrl, '_blank');
    toast.success(`Manifest report opened for ${selectedHBLs.size} HBL(s)`);
  };

  const handleExportPDF = () => {
    if (selectedHBLs.size === 0) {
      toast.error("Please select at least one HBL");
      return;
    }
    const ids = Array.from(selectedHBLs).join(',');
    const reportUrl = `/src/assets/reports/ManifestReport/MANIFEST_REPORT.html?hbls=${ids}&download=true`;
    window.open(reportUrl, '_blank');
    toast.success(`PDF Export started for ${selectedHBLs.size} HBL(s)`);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`main-content ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="page-content">
          <div className="page-wrapper">
            <div className="page-header">
              <h1 className="page-title">Manifest Reports - Import</h1>
              <p className="page-subtitle">Select vessel → voyage → MBL → job → HBLs for manifest</p>
            </div>

            <div className="section-card">
              <h3>Select Criteria</h3>
              <div className="form-grid">
                {/* Vessel */}
                <div className="input-group" style={{ position: 'relative', gridColumn: '1 / -1' }}>
                  <label>Vessel (Code - Name) <span className="required">*</span></label>
                  <input
                    type="text"
                    value={vesselSearch}
                    onChange={(e) => {
                      setVesselSearch(e.target.value);
                      setShowVesselDropdown(true);
                    }}
                    onFocus={() => setShowVesselDropdown(true)}
                    placeholder="Search vessel..."
                  />
                  {showVesselDropdown && (
                    <div className="autocomplete-dropdown">
                      {filteredVessels.length === 0 ? (
                        <div className="autocomplete-item no-result">No vessel found</div>
                      ) : (
                        filteredVessels.map(vessel => (
                          <div
                            key={vessel._id}
                            className="autocomplete-item"
                            onClick={() => handleVesselSelect(vessel)}
                          >
                            <strong>{vessel.code}</strong> — {vessel.name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Voyage */}
                {selectedVessel && (
                  <div className="input-group">
                    <label>Voyage</label>
                    <select value={selectedVoyage} onChange={(e) => { setSelectedVoyage(e.target.value); setSelectedMBL(''); setSelectedJob(null); }}>
                      <option value="">Select Voyage</option>
                      {voyages.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                )}

                {/* MBL */}
                {selectedVoyage && (
                  <div className="input-group">
                    <label>MBL Number</label>
                    <select value={selectedMBL} onChange={(e) => { setSelectedMBL(e.target.value); setSelectedJob(null); }}>
                      <option value="">Select MBL</option>
                      {mbls.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                )}

                {/* Job Number */}
                {selectedMBL && mblJobs.length > 0 && (
                  <div className="input-group">
                    <label>Job Number</label>
                    <select value={selectedJob?._id || ''} onChange={(e) => {
                      const job = mblJobs.find(j => j._id === e.target.value);
                      setSelectedJob(job);
                    }}>
                      <option value="">Select Job</option>
                      {mblJobs.map(job => (
                        <option key={job._id} value={job._id}>{job.jobNum}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {selectedJob && (
              <div className="section-card">
                <h3>House Bills for Job: {selectedJob.jobNum}</h3>
                <div className="table-container">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--highlight-info)' }}>
                        <th style={{ padding: '12px' }}>
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                          /> Select All
                        </th>
                        <th style={{ padding: '12px' }}>HBL Number</th>
                        <th style={{ padding: '12px' }}>HBL Date</th>
                        <th style={{ padding: '12px' }}>Shipper</th>
                        <th style={{ padding: '12px' }}>Notify Party</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobDOs.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No Delivery Orders found for this job
                          </td>
                        </tr>
                      ) : (
                        jobDOs.map((doItem) => (
                          <tr key={doItem._id}>
                            <td style={{ padding: '12px' }}>
                              <input
                                type="checkbox"
                                checked={selectedHBLs.has(doItem._id)}
                                onChange={() => handleRowSelect(doItem._id)}
                              />
                            </td>
                            <td style={{ padding: '12px' }}>{doItem.houseBl || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>{new Date(doItem.createdAt).toLocaleDateString()}</td>
                            <td style={{ padding: '12px' }}>{doItem.shipperName || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>{doItem.notifyPartyName || doItem.consigneeName || 'N/A'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="form-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <button
                    className="btn-primary"
                    onClick={handleGenerateReport}
                    disabled={selectedHBLs.size === 0}
                  >
                    Generate Manifest Report ({selectedHBLs.size} selected)
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={handleExportPDF}
                    disabled={selectedHBLs.size === 0}
                    style={{ background: '#27ae60', color: 'white' }}
                  >
                    Export as PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManifestReportsImport;
