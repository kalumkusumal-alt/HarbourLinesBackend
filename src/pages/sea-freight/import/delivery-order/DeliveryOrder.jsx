// frontend/src/pages/sea-freight/import/delivery-order/DeliveryOrder.jsx
import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/layout/Sidebar.jsx';
import Navbar from '../../../../components/layout/Navbar.jsx';
import Loading from '../../../../components/common/Loading.jsx';
import toast from 'react-hot-toast';
import '../../../../styles/DeliveryOrder.css';
import MainDetails from './MainDetails.jsx';
import SubDetails from './SubDetails.jsx';
import ContainerDetails from './ContainerDetails.jsx';

const API_BASE = 'https://harbourb-production.up.railway.app/api/jobs/sea-import';
const DO_API = 'https://harbourb-production.up.railway.app/api/delivery-orders';

const DeliveryOrder = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Job selection & data
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobSearch, setJobSearch] = useState('');
  const [showJobDropdown, setShowJobDropdown] = useState(false);

  const [formData, setFormData] = useState({
    // Step 01
    jobNum: '',
    etaDateTime: '',
    lastPortEtd: '',
    houseBl: '',
    masterBlNumber: '',
    houseBlSerial: '',
    vesselCode: '',
    vesselName: '',
    voyage: '',
    fclLcl: 'FCL',
    doNum: '',
    doType: 'Custom Copy',
    numContainers: '',
    deStuffRequired: false,

    // Step 2
    portOfLoadingId: '',
    portOfLoadingName: '',
    portOfLoadingCode: '',
    originAgentId: '',
    originAgentName: '',
    originAgentCode: '',
    carrierId: '',
    carrierName: '',
    carrierCode: '',
    consigneeId: '',
    consigneeCode: '',
    consigneeName: '',
    consigneeAddress: '',
    consigneeStreet: '',
    consigneeCountry: '',
    shipperId: '',
    shipperCode: '',
    shipperName: '',
    shipperAddress: '',
    shipperStreet: '',
    shipperCountry: '',
    notifyPartyEnabled: false,
    notifyPartyId: '',
    notifyPartyCode: '',
    notifyPartyName: '',
    notifyPartyAddress: '',
    notifyPartyStreet: '',
    notifyPartyCountry: '',
    doExpiresOn: '',
    displayDoExpires: false,
    dangerousCargoDays: '',
    dangerousCargoGroup: '',
    dateOfLanding: '',
    deStuffType: '',
    deStuffNumContainers: '',
    fclType: '',
    fclNumContainers: '',
    noOfPackages: '',
    packageTypeCode: '',
    packageTypeName: '',
    noOfPackagesWords: '',
    masterBlCollectDate: '',
    masterBlCollectEnabled: false,
    docReleaseDate: '',
    docReleaseEnabled: false,
    remarks: '',
    mainLine: '',
    tinNoOwner: '',
    revenueType: 'Nomination',
    salesmanId: '',
    salesmanCode: '',
    salesmanName: '',
    fclContainers: [],
    tempFclType: '',
    tempFclCount: '',
    deStuffContainers: [],
    tempDeStuffType: '',
    tempDeStuffCount: '',

    // step 3
    marksNumbers: '',
    description: '',
    grossWeight: '',
    cbm: '',
    blType: '',
    commodity: '',
    freightTerm: '',
    hblTerm: '',
    rateFom: '',
    emptyReturn: '',
    terminal: '',
    placeOfReceipt: '',
    hsCodes: [],
    companyCode: '',
    companyName: '',
    companyAddress: '',
    companyCity: '',
    companyCountry: '',
    companyTel1: '',
    companyTel2: '',

    // Step 4
    containerDetails: [],

    masterBlSerial: '1',
  });

  const doTypes = ['Custom Copy', 'SLPA 1', 'SLPA 2', 'SLPA 3'];

  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
    fetchJobs();
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAllJobs`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data);
      }
    } catch (err) {
      toast.error('Failed to load jobs');
    }
  };

  const fetchNextHouseBlSerial = async (jobId) => {
    try {
      const res = await fetch(`${DO_API}/getAllDOs`);
      const data = await res.json();
      if (data.success) {
        const existingDOs = data.data.filter(doItem => doItem.jobId === jobId);
        const nextSerial = existingDOs.length + 1;
        return nextSerial;
      }
      return 1;
    } catch (err) {
      console.error('Failed to fetch DO count', err);
      return 1;
    }
  };

  const handleJobSelect = async (job) => {
    setSelectedJob(job);

    const nextHouseSerial = await fetchNextHouseBlSerial(job._id);

    setFormData(prev => ({
      ...prev,
      jobId: job._id,
      jobNum: job.jobNum,
      etaDateTime: job.etaDateTime ? new Date(job.etaDateTime).toISOString().slice(0, 16) : '',
      lastPortEtd: job.lastPortEtd ? new Date(job.lastPortEtd).toISOString().slice(0, 16) : '',
      houseBl: '',
      masterBlNumber: job.mblNumber || '',
      masterBlSerial: '1',
      houseBlSerial: nextHouseSerial.toString(),
      vesselCode: job.vesselId?.code || '',
      vesselName: job.vesselName || '',
      voyage: job.voyage || '',
      fclLcl: job.cargoCategory === 'FCL' ? 'FCL' : 'LCL',
      doNum: '',
      doType: 'Custom Copy',
      numContainers: job.containers?.length || job.numContainers || '',
      deStuffRequired: false,
      portOfLoadingId: '',
      portOfLoadingName: job.portOfLoadingName || '',
      portOfLoadingCode: '',
      originAgentId: job.originAgentId?._id || '',
      originAgentName: job.originAgentName || '',
      originAgentCode: '',
      carrierId: job.carrierId?._id || '',
      carrierName: job.carrierName || '',
      carrierCode: '',
    }));
    setJobSearch(`${job.jobNum} — ${job.vesselName} (${job.voyage})`);
    setShowJobDropdown(false);
    toast.success(`Job ${job.jobNum} loaded — House BL Serial: ${nextHouseSerial}`);
  };

  const filteredJobs = jobs.filter(job =>
    job.jobNum.toLowerCase().includes(jobSearch.toLowerCase()) ||
    job.vesselName?.toLowerCase().includes(jobSearch.toLowerCase()) ||
    job.mblNumber?.toLowerCase().includes(jobSearch.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNext = () => {
    if (!selectedJob) {
      toast.error('Please select a job first');
      return;
    }
    if (!formData.houseBl) {
      toast.error('House BL is required');
      return;
    }
    if (!formData.doType) {
      toast.error('Please select DO Type');
      return;
    }
    setCurrentStep(2);
  };

  return (
    <div className="dashboard-layout">
      {loading && <Loading fullPage={true} message={currentStep === 4 ? "Saving Delivery Order..." : "Processing..."} />}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="page-content">
          <div className="page-wrapper">
            <div className="page-header">
              <h1 className="page-title">Delivery Order Creation</h1>
              <p className="page-subtitle">Create DO for Sea Import Job</p>
            </div>

            <div className="wizard-steps">
              <div className={`step-indicator ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                1. Job Information
              </div>
              <div className={`step-indicator ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                2. Main Details
              </div>
              <div className={`step-indicator ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
                3. Sub Details
              </div>
              <div className={`step-indicator ${currentStep === 4 ? 'active' : ''}`}>
                4. Container Details
              </div>
            </div>

            <div className="job-card">
              {currentStep === 1 && (
                <div className="section">
                  <h3>Step 1: Job Information</h3>

                  {/* Job Selection */}
                  <div className="input-group" style={{ position: 'relative', marginBottom: '2rem' }}>
                    <label>Select Job <span className="required">*</span></label>
                    <input
                      type="text"
                      value={jobSearch}
                      onChange={(e) => {
                        setJobSearch(e.target.value);
                        setShowJobDropdown(true);
                      }}
                      onFocus={() => setShowJobDropdown(true)}
                      placeholder="Search by Job No, Vessel, or MBL..."
                      style={{ fontSize: '1.1rem', padding: '1rem' }}
                    />
                    {showJobDropdown && (
                      <div className="autocomplete-dropdown" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {filteredJobs.length === 0 ? (
                          <div className="autocomplete-item no-result">No jobs found</div>
                        ) : (
                          filteredJobs.map(job => (
                            <div
                              key={job._id}
                              className="autocomplete-item"
                              onClick={() => handleJobSelect(job)}
                              style={{ padding: '1rem' }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong>{job.jobNum}</strong>
                                <span style={{ color: '#3b82f6' }}>{job.vesselName}</span>
                              </div>
                              <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
                                Voyage: {job.voyage} • MBL: {job.mblNumber || '—'} •
                                POL: {job.portOfLoadingName || '—'} •
                                Containers: {job.containers?.length || 0}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {selectedJob && (
                    <div className="form-grid">
                      <div className="input-group">
                        <label>Job Number</label>
                        <input value={formData.jobNum} readOnly disabled style={{ backgroundColor: '#f0fdf4', fontWeight: 'bold', color: '#166534' }} />
                      </div>

                      <div className="input-group">
                        <label>ETA Date/Time</label>
                        <input type="datetime-local" name="etaDateTime" value={formData.etaDateTime} onChange={handleChange} disabled={loading} />
                      </div>

                      <div className="input-group">
                        <label>Last Port ETD</label>
                        <input type="datetime-local" name="lastPortEtd" value={formData.lastPortEtd} onChange={handleChange} disabled={loading} />
                      </div>

                      <div className="input-group">
                        <label>House BL <span className="required">*</span></label>
                        <input name="houseBl" value={formData.houseBl} onChange={handleChange} placeholder="e.g. COL/HBL/001" disabled={loading} />
                      </div>

                      <div className="input-group">
                        <label>Master BL Number</label>
                        <input value={formData.masterBlNumber} readOnly disabled style={{ backgroundColor: '#fefce8' }} />
                      </div>

                      <div className="input-group">
                        <label>Master BL Serial</label>
                        <input value="1" readOnly disabled style={{ backgroundColor: '#fefce8', fontWeight: 'bold' }} />
                        <small style={{ color: '#64748b' }}>Always 1 for Master BL</small>
                      </div>

                      <div className="input-group">
                        <label>House BL Serial</label>
                        <input value={formData.houseBlSerial} readOnly disabled style={{ backgroundColor: '#ecfdf5', fontWeight: 'bold' }} />
                        <small style={{ color: '#64748b' }}>Auto-generated based on existing DOs for this job</small>
                      </div>

                      <div className="input-group">
                        <label>Vessel Code</label>
                        <input value={formData.vesselCode} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
                      </div>

                      <div className="input-group">
                        <label>Vessel Name</label>
                        <input value={formData.vesselName} readOnly disabled style={{ backgroundColor: '#f0fdf4', fontWeight: '600' }} />
                      </div>

                      <div className="input-group">
                        <label>Voyage</label>
                        <input value={formData.voyage} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
                      </div>

                      <div className="input-group">
                        <label>FCL or LCL</label>
                        <input value={formData.fclLcl} readOnly disabled style={{ backgroundColor: '#fef3c7' }} />
                      </div>

                      <div className="input-group">
                        <label>DO Number</label>
                        <input value="(Auto-generated)" readOnly disabled style={{ backgroundColor: '#f1f5f9', fontStyle: 'italic' }} />
                        <small style={{ color: '#64748b' }}>Will be generated on final save</small>
                      </div>

                      <div className="input-group">
                        <label>DO Type <span className="required">*</span></label>
                        <select name="doType" value={formData.doType} onChange={handleChange} disabled={loading}>
                          {doTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div className="input-group">
                        <label>No. of Containers</label>
                        <input value={formData.numContainers} readOnly disabled style={{ backgroundColor: '#ecfdf5', fontWeight: '600' }} />
                      </div>

                      <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          fontSize: '1.15rem',
                          fontWeight: '600',
                          color: formData.deStuffRequired ? '#dc2626' : '#1e293b',
                          marginTop: '1.5rem'
                        }}>
                          <input
                            type="checkbox"
                            name="deStuffRequired"
                            checked={formData.deStuffRequired}
                            onChange={handleChange}
                            style={{
                              width: '28px',
                              height: '28px',
                              accentColor: '#dc2626',
                              cursor: 'pointer'
                            }}
                          />
                          <div>
                            De-Stuff Required
                            {formData.deStuffRequired && (
                              <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#991b1b' }}>
                                (Containers will be emptied)
                              </span>
                            )}
                          </div>
                        </label>
                        {!formData.deStuffRequired && (
                          <small style={{ color: '#64748b', marginLeft: '42px' }}>
                            Default: Direct delivery
                          </small>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="form-actions" style={{ marginTop: '3rem' }}>
                    <button type="button" className="btn-primary" onClick={handleNext} disabled={!selectedJob}>
                      Next: Main Details →
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <MainDetails
                  formData={formData}
                  setFormData={setFormData}
                  onPrevious={() => setCurrentStep(1)}
                  onNext={() => setCurrentStep(3)}
                  selectedJob={selectedJob}
                  loading={loading}
                />
              )}

              {currentStep === 3 && (
                <SubDetails
                  formData={formData}
                  setFormData={setFormData}
                  onPrevious={() => setCurrentStep(2)}
                  onNext={() => setCurrentStep(4)}
                  loading={loading}
                />
              )}

              {currentStep === 4 && (
                <ContainerDetails
                  formData={formData}
                  setFormData={setFormData}
                  onPrevious={() => setCurrentStep(3)}
                  selectedJob={selectedJob}
                  loading={loading}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryOrder;
