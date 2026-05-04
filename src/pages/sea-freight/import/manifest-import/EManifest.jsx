// frontend/src/pages/sea-freight/import/manifest-reports/EManifest.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../../../../components/layout/Sidebar.jsx';
import Navbar from '../../../../components/layout/Navbar.jsx';
import Loading from '../../../../components/common/Loading.jsx';
import { generateEManifestXML } from '../../../../helpers/generateEManifestXML';

const VESSEL_API = 'https://harbourb-production.up.railway.app/api/vessels/getAllVessels';
const JOB_API = 'https://harbourb-production.up.railway.app/api/jobs/sea-import/getAllJobs';
const DO_API = 'https://harbourb-production.up.railway.app/api/delivery-orders/getAllDOs';
const UPDATE_JOB_API = 'https://harbourb-production.up.railway.app/api/jobs/sea-import/updateJob';

const EManifest = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [vessels, setVessels] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [deliveryOrders, setDeliveryOrders] = useState([]);

  const [selectedVessel, setSelectedVessel] = useState(null);
  const [selectedVoyage, setSelectedVoyage] = useState('');
  const [selectedMBL, setSelectedMBL] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [eManifestType, setEManifestType] = useState('');

  // Section 2 fields
  const [customsOfficeCode, setCustomsOfficeCode] = useState('');
  const [lastPortDeparture, setLastPortDeparture] = useState('');
  const [etaDate, setEtaDate] = useState('');
  const [pod, setPod] = useState('');

  const [totalPackages, setTotalPackages] = useState(0);
  const [totalGrossWeight, setTotalGrossWeight] = useState(0);
  const [totalCBM, setTotalCBM] = useState(0);

  const [vesselSearch, setVesselSearch] = useState('');
  const [showVesselDropdown, setShowVesselDropdown] = useState(false);

  // Min date for ETA (today or future)
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) setSidebarOpen(JSON.parse(saved));

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchVessels(), fetchJobs(), fetchDeliveryOrders()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const fetchVessels = async () => {
    try {
      const res = await fetch(VESSEL_API);
      const data = await res.json();
      if (data.success) setVessels(data.data);
    } catch (err) {
      toast.error('Failed to load vessels');
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(JOB_API);
      const data = await res.json();
      if (data.success) setJobs(data.data);
    } catch (err) {
      toast.error('Failed to load jobs');
    }
  };

  const fetchDeliveryOrders = async () => {
    try {
      const res = await fetch(DO_API);
      const data = await res.json();
      if (data.success) setDeliveryOrders(data.data);
    } catch (err) {
      toast.error('Failed to load delivery orders');
    }
  };

  const handleVesselSelect = (vessel) => {
    setSelectedVessel(vessel);
    setSelectedVoyage('');
    setSelectedMBL('');
    setVesselSearch(`${vessel.code} - ${vessel.name}`);
    setShowVesselDropdown(false);
  };

  const filteredVessels = vessels.filter(v =>
    v.code?.toLowerCase().includes(vesselSearch.toLowerCase()) ||
    v.name?.toLowerCase().includes(vesselSearch.toLowerCase())
  );

  // Filtered jobs based on vessel/voyage/MBL
  const matchingJobs = jobs.filter(job =>
    (!selectedVessel || job.vesselId?._id === selectedVessel._id) &&
    (!selectedVoyage || job.voyage === selectedVoyage) &&
    (!selectedMBL || job.mblNumber === selectedMBL)
  );

  const matchingJobIds = matchingJobs.map(j => j._id);

  // Filtered DOs (HBLs) based on all criteria
  const filteredDOs = deliveryOrders.filter(doItem => {
    if (!matchingJobIds.includes(doItem.jobId)) return false;

    // HS Code filter
    if (hsCode && doItem.hsCodes) {
      if (!doItem.hsCodes.some(hs => hs.code.includes(hsCode))) return false;
    }

    // E-Manifest Type → fclLcl mapping
    let mappedType = '';
    switch (doItem.fclLcl) {
      case 'FCL/FCL':
        mappedType = 'FCL';
        break;
      case 'FCL/LCL':
      case 'LCL/LCL':
        mappedType = 'Consolidated Cargo';
        break;
      default:
        mappedType = doItem.fclLcl || '';
    }

    if (eManifestType && mappedType !== eManifestType) return false;

    return true;
  });

  // Auto-fill ETA, POD, and totals when filteredDOs change
  useEffect(() => {
    if (filteredDOs.length > 0) {
      const firstDO = filteredDOs[0];
      const job = jobs.find(j => j._id === firstDO.jobId);
      if (job) {
        const originalETA = job.etaDateTime?.slice(0, 10) || '';
        setEtaDate(originalETA);
        setPod(job.portDischargeName || '');
      }

      const packages = filteredDOs.reduce((sum, d) => sum + (d.noOfPackages || 0), 0);
      const weight = filteredDOs.reduce((sum, d) => sum + (d.grossWeight || 0), 0);
      const cbm = filteredDOs.reduce((sum, d) => sum + (d.cbm || 0), 0);

      setTotalPackages(packages);
      setTotalGrossWeight(weight);
      setTotalCBM(cbm.toFixed(3));
    } else {
      setEtaDate('');
      setPod('');
      setTotalPackages(0);
      setTotalGrossWeight(0);
      setTotalCBM(0);
    }
  }, [filteredDOs, jobs]);

  // Update ETA in backend (only future dates)
  const updateETAInJob = async (newETA) => {
    if (filteredDOs.length === 0) return;

    const firstDO = filteredDOs[0];
    const job = jobs.find(j => j._id === firstDO.jobId);
    if (!job) return;

    if (newETA < today) {
      toast.error('ETA cannot be set to a past date');
      setEtaDate(job.etaDateTime?.slice(0, 10) || '');
      return;
    }

    try {
      const res = await fetch(`${UPDATE_JOB_API}/${job._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etaDateTime: newETA + 'T00:00:00Z' })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('ETA updated in job successfully');
        setJobs(prev => prev.map(j => j._id === job._id ? data.data : j));
      } else {
        toast.error('Failed to update ETA');
        setEtaDate(job.etaDateTime?.slice(0, 10) || '');
      }
    } catch (err) {
      toast.error('Failed to update ETA');
      setEtaDate(job.etaDateTime?.slice(0, 10) || '');
    }
  };

  const handleETAChange = (e) => {
    const newETA = e.target.value;
    setEtaDate(newETA);
    if (newETA >= today) {
      updateETAInJob(newETA);
    }
  };

  // Generate XML download
  const handleGenerateXML = () => {
    if (filteredDOs.length === 0) {
      toast.error('No data available to generate manifest');
      return;
    }

    try {
      const xmlString = generateEManifestXML({
        filteredDOs,
        selectedVoyage,
        lastPortDeparture,
        customsOfficeCode,
        selectedMBL,
        jobs
      });

      const blob = new Blob([xmlString], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `E-Manifest_${selectedVoyage || 'UNKNOWN'}_${new Date().toISOString().split('T')[0]}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('E-Manifest XML downloaded successfully!');
    } catch (err) {
      toast.error('Failed to generate XML');
      console.error(err);
    }
  };

  return (
    <div className="dashboard-layout">
      {loading && <Loading fullPage={true} message="Loading Manifest Data..." />}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`main-content ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="page-content">
          <div className="page-wrapper">
            <div className="page-header">
              <h1 className="page-title">E-Manifest Reports - Import</h1>
              <p className="page-subtitle">Select criteria to auto-load E-Manifest data</p>
            </div>

            {/* Section 1: Select Criteria */}
            <div className="section-card">
              <h3>1. Select Criteria</h3>
              <div className="form-grid">
                {/* Vessel */}
                <div className="input-group" style={{ position: 'relative', gridColumn: '1 / -1' }}>
                  <label>Vessel <span className="required">*</span></label>
                  <input
                    type="text"
                    value={vesselSearch}
                    onChange={(e) => {
                      setVesselSearch(e.target.value);
                      setShowVesselDropdown(true);
                    }}
                    onFocus={() => setShowVesselDropdown(true)}
                    placeholder="Search by Vessel Code or Name..."
                    style={{ fontSize: '1.1rem' }}
                  />
                  {showVesselDropdown && (
                    <div className="autocomplete-dropdown">
                      {filteredVessels.length === 0 ? (
                        <div className="autocomplete-item no-result">No vessels found</div>
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
                    <select value={selectedVoyage} onChange={(e) => setSelectedVoyage(e.target.value)}>
                      <option value="">All Voyages</option>
                      {[...new Set(jobs.filter(j => j.vesselId?._id === selectedVessel._id).map(j => j.voyage))].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* MBL */}
                {selectedVessel && (
                  <div className="input-group">
                    <label>MBL</label>
                    <select value={selectedMBL} onChange={(e) => setSelectedMBL(e.target.value)}>
                      <option value="">All MBLs</option>
                      {[...new Set(jobs.filter(j =>
                        j.vesselId?._id === selectedVessel._id &&
                        (!selectedVoyage || j.voyage === selectedVoyage)
                      ).map(j => j.mblNumber))].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* HS Code */}
                <div className="input-group">
                  <label>HS Code</label>
                  <input
                    type="text"
                    value={hsCode}
                    onChange={(e) => setHsCode(e.target.value.toUpperCase())}
                    placeholder="Filter by HS Code (e.g. 8704.21)"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                {/* E-Manifest Type */}
                <div className="input-group">
                  <label>E-Manifest Type</label>
                  <select value={eManifestType} onChange={(e) => setEManifestType(e.target.value)}>
                    <option value="">All Types</option>
                    <option value="FCL">FCL</option>
                    <option value="Consolidated Cargo">Consolidated Cargo</option>
                    <option value="S.O.C">S.O.C</option>
                    <option value="Main Manifest">Main Manifest</option>
                    <option value="Break Bulk">Break Bulk</option>
                    <option value="S.L.P.A EDI">S.L.P.A EDI</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Auto-loaded */}
            {filteredDOs.length > 0 && (
              <div className="section-card">
                <h3>2. E-Manifest Details (Auto-loaded)</h3>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Customs Office Code</label>
                    <input
                      type="text"
                      value={customsOfficeCode}
                      onChange={(e) => setCustomsOfficeCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SECMB"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>

                  <div className="input-group">
                    <label>Last Port Departure Date</label>
                    <input
                      type="date"
                      value={lastPortDeparture}
                      onChange={(e) => setLastPortDeparture(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label>ETA Date (Future dates only)</label>
                    <input
                      type="date"
                      value={etaDate}
                      min={today}
                      onChange={handleETAChange}
                      style={{
                        backgroundColor: 'var(--highlight-warning)',
                        border: '2px solid #f59e0b',
                        padding: '10px',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <small style={{ color: '#d97706' }}>
                      Original ETA: {etaDate || 'Not set'} | You can only set today or future dates
                    </small>
                  </div>

                  <div className="input-group">
                    <label>POD (Port of Discharge)</label>
                    <input value={pod} readOnly style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)' }} />
                  </div>

                  <div className="input-group">
                    <label>Total No. of Packages</label>
                    <input value={totalPackages} readOnly disabled style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)' }} />
                  </div>

                  <div className="input-group">
                    <label>Total Gross Weight</label>
                    <input value={totalGrossWeight} readOnly style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)' }} />
                  </div>

                  <div className="input-group">
                    <label>Total CBM</label>
                    <input value={totalCBM} readOnly style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                {/* Table */}
                <div className="table-container" style={{ marginTop: '2rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--highlight-info)' }}>
                        <th style={{ padding: '12px' }}>Job Num</th>
                        <th style={{ padding: '12px' }}>HBL Num</th>
                        <th style={{ padding: '12px' }}>HBL Date</th>
                        <th style={{ padding: '12px' }}>Shipper</th>
                        <th style={{ padding: '12px' }}>Consignee</th>
                        <th style={{ padding: '12px' }}>Notify Party</th>
                        <th style={{ padding: '12px' }}>Destination</th>
                        <th style={{ padding: '12px' }}>No. of Packages</th>
                        <th style={{ padding: '12px' }}>Gross Weight</th>
                        <th style={{ padding: '12px' }}>CBM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDOs.map(doItem => {
                        const job = jobs.find(j => j._id === doItem.jobId);
                        return (
                          <tr key={doItem._id}>
                            <td style={{ padding: '12px' }}>{job?.jobNum || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>{doItem.houseBl || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>{new Date(doItem.createdAt).toLocaleDateString()}</td>
                            <td style={{ padding: '12px' }}>{doItem.shipperName || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>{doItem.consigneeName || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>{doItem.notifyPartyName || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>{job?.portDischargeName || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>{doItem.noOfPackages || 0}</td>
                            <td style={{ padding: '12px' }}>{doItem.grossWeight || 0}</td>
                            <td style={{ padding: '12px' }}>{doItem.cbm || 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Generate & Download Button */}
                <div className="form-actions" style={{ marginTop: '2rem' }}>
                  <button
                    className="btn-primary"
                    onClick={handleGenerateXML}
                    disabled={filteredDOs.length === 0}
                  >
                    Generate & Download E-Manifest XML
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

export default EManifest;
