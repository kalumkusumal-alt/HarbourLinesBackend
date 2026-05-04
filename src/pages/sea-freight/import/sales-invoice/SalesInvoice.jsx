// frontend/src/pages/sea-freight/import/sales-invoice/SalesInvoice.jsx
import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/layout/Sidebar.jsx';
import Navbar from '../../../../components/layout/Navbar.jsx';
import InvoiceDetails from './InvoiceDetails.jsx';
import OtherInformation from './OtherInformation.jsx';
import Loading from '../../../../components/common/Loading.jsx';
import toast from 'react-hot-toast';

const API_BASE = 'https://harbourb-production.up.railway.app/api/jobs/sea-import';
const DO_API = 'https://harbourb-production.up.railway.app/api/delivery-orders';
const CURRENCY_API = 'https://harbourb-production.up.railway.app/api/currencies/getAllCurrencies';

const SalesInvoice = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Data
  const [jobs, setJobs] = useState([]);
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedDO, setSelectedDO] = useState(null);
  const [jobSearch, setJobSearch] = useState('');
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [showDODropdown, setShowDODropdown] = useState(false);

  const [formData, setFormData] = useState({
    invoiceNo: '',
    currency: 'LKR',
    payMode: 'Credit',
    userType: 'Consignee',
    invoiceDate: new Date().toISOString().slice(0, 10),
    jobNum: '',
    doId: '',
    doNum: '',
    houseBl: '',
    customerCode: '',
    customerName: '',
    address: '',
    city: '',
    country: '',
    containerInfo: '',
    vesselCode: '',
    vesselName: '',
    portOfLoadingCode: '',
    portOfLoadingName: '',
    voyage: '',
    noOfPackages: '',
    contactDetails: '',
    remarks: '',
    customerRefNo: '',

    invoiceLines: [],

    bankCode: '',
    bankName: '',
    accountName: '',
    accountAddress: '',
    accountStreet: '',
    accountCity: '',
    accountNumber: '',
    paymentNotes: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
    fetchJobs();
    fetchCurrencies();
    generateInvoiceNo();
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
      if (data.success) setJobs(data.data);
    } catch (err) {
      toast.error('Failed to load jobs');
    }
  };

  const fetchCurrencies = async () => {
    try {
      const res = await fetch(CURRENCY_API);
      const data = await res.json();
      if (data.success) setCurrencies(data.data);
    } catch (err) {
      toast.error('Failed to load currencies');
    }
  };

  const generateInvoiceNo = async () => {
    try {
      const year = new Date().getFullYear().toString().slice(-2);
      const count = 1;
      const padded = String(count).padStart(7, '0');
      setFormData(prev => ({ ...prev, invoiceNo: `SFI/DNUFL/${year}/${padded}` }));
    } catch (err) {
      setFormData(prev => ({ ...prev, invoiceNo: 'SFI/DNUFL/25/0000001' }));
    }
  };

  const fetchDeliveryOrdersForJob = async (jobId) => {
    try {
      const res = await fetch(`${DO_API}/getAllDOs`);
      const data = await res.json();
      if (data.success) {
        const filteredDOs = data.data.filter(doItem => doItem.jobId === jobId);
        setDeliveryOrders(filteredDOs);
        if (filteredDOs.length === 0) {
          toast.info('No Delivery Orders found for this job');
        }
      }
    } catch (err) {
      toast.error('Failed to load Delivery Orders');
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setSelectedDO(null);
    setDeliveryOrders([]);
    setFormData(prev => ({
      ...prev,
      jobId: job._id,
      jobNum: job.jobNum,
      doId: '',
      doNum: '',
      houseBl: '',
      customerCode: '',
      customerName: '',
      address: '',
      city: '',
      country: '',
      containerInfo: '',
      vesselCode: '',
      vesselName: '',
      portOfLoadingCode: '',
      portOfLoadingName: '',
      voyage: '',
      noOfPackages: ''
    }));
    setJobSearch(job.jobNum);
    setShowJobDropdown(false);

    fetchDeliveryOrdersForJob(job._id);
  };

  const handleDOSelect = (deliveryOrder) => {
    setSelectedDO(deliveryOrder);

    setFormData(prev => ({
      ...prev,
      doId: deliveryOrder._id,
      doNum: deliveryOrder.doNum,
      houseBl: deliveryOrder.houseBl || '',
      customerCode: deliveryOrder.consigneeCode || deliveryOrder.shipperCode || '',
      customerName: deliveryOrder.consigneeName || deliveryOrder.shipperName || '',
      address: deliveryOrder.consigneeAddress || deliveryOrder.shipperAddress || '',
      city: deliveryOrder.consigneeCity || deliveryOrder.shipperCity || '',
      country: deliveryOrder.consigneeCountry || deliveryOrder.shipperCountry || '',
      vesselCode: selectedJob.vesselId?.code || selectedJob.vesselCode || '',
      vesselName: selectedJob.vesselName || '',
      voyage: selectedJob.voyage || '',
      portOfLoadingCode: selectedJob.portOfLoadingCode || '',
      portOfLoadingName: selectedJob.portOfLoadingName || '',
      noOfPackages: deliveryOrder.noOfPackages || selectedJob.noOfPackages || '',
      containerInfo: deliveryOrder.containerDetails?.map(c =>
        `${c.containerNo} (${c.containerType || 'N/A'})`
      ).join(', ') || selectedJob.containers?.map(c =>
        `${c.containerNo} (${c.containerType || 'N/A'})`
      ).join(', ') || ''
    }));

    setShowDODropdown(false);
    toast.success(`DO ${deliveryOrder.doNum} loaded — Vessel: ${selectedJob.vesselName}`);
  };

  const filteredJobs = jobs.filter(job =>
    job.jobNum.toLowerCase().includes(jobSearch.toLowerCase()) ||
    job.vesselName?.toLowerCase().includes(jobSearch.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (!formData.jobNum) {
      toast.error('Please select a Job');
      return;
    }
    if (!formData.doId) {
      toast.error('Please select a Delivery Order');
      return;
    }
    setCurrentStep(2);
  };

  return (
    <div className="dashboard-layout">
      {loading && <Loading fullPage={true} message={currentStep === 3 ? "Saving Sales Invoice..." : "Processing..."} />}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="page-content">
          <div className="page-wrapper">
            <div className="page-header">
              <h1 className="page-title">Sales Invoice - Import</h1>
              <p className="page-subtitle">Create sales invoice for import jobs</p>
            </div>

            {/* Wizard Steps */}
            <div className="wizard-steps">
              <div className={`step-indicator ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                1. Invoice Header
              </div>
              <div className={`step-indicator ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                2. Charges
              </div>
              <div className={`step-indicator ${currentStep === 3 ? 'active' : ''}`}>
                3. Other Information
              </div>
            </div>

            <div className="job-card">
              {currentStep === 1 && (
                <div className="section">
                  <h3>Step 1: Invoice Header</h3>

                  <div className="form-grid">
                    <div className="input-group">
                      <label>Invoice No.</label>
                      <input value={formData.invoiceNo} readOnly disabled style={{ backgroundColor: 'var(--input-bg)', fontWeight: 'bold', color: 'var(--text-primary)' }} />
                      <small style={{ color: 'var(--text-secondary)' }}>Auto-generated</small>
                    </div>

                    <div className="input-group">
                      <label>Currency</label>
                      <select name="currency" value={formData.currency} onChange={handleChange} disabled={loading}>
                        {currencies.map(curr => (
                          <option key={curr._id} value={curr.code}>{curr.code} - {curr.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="input-group">
                      <label>Pay Mode</label>
                      <select name="payMode" value={formData.payMode} onChange={handleChange} disabled={loading}>
                        <option value="Cash">Cash</option>
                        <option value="Credit">Credit</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label>User Type</label>
                      <select name="userType" value={formData.userType} onChange={handleChange} disabled={loading}>
                        <option value="Shipper">Shipper</option>
                        <option value="Consignee">Consignee</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label>Invoice Date</label>
                      <input type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleChange} disabled={loading} />
                    </div>

                    {/* Job Selection */}
                    <div className="input-group" style={{ position: 'relative', gridColumn: '1 / -1' }}>
                      <label>Select Job Master No. <span className="required">*</span></label>
                      <input
                        type="text"
                        value={jobSearch}
                        onChange={(e) => {
                          setJobSearch(e.target.value);
                          setShowJobDropdown(true);
                        }}
                        onFocus={() => setShowJobDropdown(true)}
                        placeholder="Search by Job No or Vessel..."
                        style={{ fontSize: '1.1rem' }}
                      />
                      {showJobDropdown && (
                        <div className="autocomplete-dropdown">
                          {filteredJobs.length === 0 ? (
                            <div className="autocomplete-item no-result">No jobs found</div>
                          ) : (
                            filteredJobs.map(job => (
                              <div
                                key={job._id}
                                className="autocomplete-item"
                                onClick={() => handleJobSelect(job)}
                              >
                                <strong>{job.jobNum}</strong> — {job.vesselName} ({job.voyage})
                                <br />
                                <small>MBL: {job.mblNumber} • Containers: {job.containers?.length || 0}</small>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {selectedJob && (
                      <div className="input-group" style={{ position: 'relative', gridColumn: '1 / -1' }}>
                        <label>Select Delivery Order <span className="required">*</span></label>
                        <input
                          type="text"
                          value={selectedDO ? selectedDO.doNum : ''}
                          readOnly
                          placeholder="Click to select DO"
                          onClick={() => setShowDODropdown(true)}
                          style={{ cursor: 'pointer', backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)' }}
                        />
                        {showDODropdown && (
                          <div className="autocomplete-dropdown">
                            {deliveryOrders.length === 0 ? (
                              <div className="autocomplete-item no-result">No Delivery Orders for this job</div>
                            ) : (
                              deliveryOrders.map(doItem => (
                                <div
                                  key={doItem._id}
                                  className="autocomplete-item"
                                  onClick={() => handleDOSelect(doItem)}
                                >
                                  <strong>{doItem.doNum}</strong> — House BL: {doItem.houseBl}
                                  <br />
                                  <small>DO Type: {doItem.doType} • Created: {new Date(doItem.createdAt).toLocaleDateString()}</small>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Auto-filled fields */}
                    <div className="input-group">
                      <label>DO Number</label>
                      <input value={formData.doNum} readOnly disabled style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)' }} />
                    </div>

                    <div className="input-group">
                      <label>House BL No.</label>
                      <input value={formData.houseBl} readOnly disabled style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)' }} />
                    </div>

                    <div className="input-group">
                      <label>Customer Code</label>
                      <input value={formData.customerCode} readOnly disabled style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)' }} />
                    </div>

                    <div className="input-group">
                      <label>Customer Name</label>
                      <input value={formData.customerName} readOnly disabled style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)', fontWeight: '600' }} />
                    </div>

                    <div className="input-group">
                      <label>Address</label>
                      <input value={formData.address} readOnly disabled style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)' }} />
                    </div>

                    <div className="input-group">
                      <label>City</label>
                      <input value={formData.city} readOnly disabled style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)' }} />
                    </div>

                    <div className="input-group">
                      <label>Country</label>
                      <input value={formData.country} readOnly disabled style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)' }} />
                    </div>

                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Container Details</label>
                      <div style={{ display: 'grid', gap: '1rem', marginTop: '0.5rem' }}>
                        {selectedDO && selectedDO.containerDetails?.length > 0 ? (
                          selectedDO.containerDetails.map((cont, idx) => {
                            const jobCont = selectedJob?.containers?.find(c => c.containerNo === cont.containerNo);
                            return (
                              <div
                                key={idx}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr 1fr',
                                  gap: '1rem',
                                  padding: '1rem',
                                  backgroundColor: 'var(--highlight-success)',
                                  borderRadius: '12px',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-primary)'
                                }}
                              >
                                <div>
                                  <label style={{ fontSize: '0.9rem', color: '#166534' }}>Container No.</label>
                                  <input
                                    value={cont.containerNo}
                                    readOnly
                                    disabled
                                    style={{ backgroundColor: 'transparent', fontWeight: 'bold', color: 'var(--text-primary)' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.9rem', color: '#166534' }}>Type</label>
                                  <input
                                    value={cont.containerType || jobCont?.containerType || 'N/A'}
                                    readOnly
                                    disabled
                                    style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.9rem', color: '#166534' }}>FCL/LCL</label>
                                  <input
                                    value={formData.fclLcl || 'N/A'}
                                    readOnly
                                    disabled
                                    style={{ backgroundColor: '#f0fdf4' }}
                                  />
                                </div>
                              </div>
                            );
                          })
                        ) : selectedJob?.containers?.length > 0 ? (
                          selectedJob.containers.map((cont, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '1rem',
                                padding: '1rem',
                                backgroundColor: '#f0fdf4',
                                borderRadius: '12px',
                                border: '1px solid #86efac'
                              }}
                            >
                              <div>
                                <label style={{ fontSize: '0.9rem', color: '#166534' }}>Container No.</label>
                                <input value={cont.containerNo} readOnly disabled style={{ backgroundColor: '#f0fdf4', fontWeight: 'bold' }} />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.9rem', color: '#166534' }}>Type</label>
                                <input value={cont.containerType || 'N/A'} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.9rem', color: '#166534' }}>FCL/LCL</label>
                                <input value={formData.fclLcl || 'N/A'} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p style={{ color: '#64748b', fontStyle: 'italic' }}>No containers found</p>
                        )}
                      </div>
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
                      <label>Port of Loading</label>
                      <input value={`${formData.portOfLoadingCode} - ${formData.portOfLoadingName}`} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
                    </div>

                    <div className="input-group">
                      <label>Voyage</label>
                      <input value={formData.voyage} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
                    </div>

                    <div className="input-group">
                      <label>No. of Packages</label>
                      <input value={formData.noOfPackages} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
                    </div>

                    <div className="input-group">
                      <label>Contact Details</label>
                      <input name="contactDetails" value={formData.contactDetails} onChange={handleChange} disabled={loading} />
                    </div>

                    <div className="input-group">
                      <label>Remarks</label>
                      <textarea name="remarks" value={formData.remarks} onChange={handleChange} disabled={loading} style={{ height: '100px' }} />
                    </div>

                    <div className="input-group">
                      <label>Customer Ref. No</label>
                      <input name="customerRefNo" value={formData.customerRefNo} onChange={handleChange} disabled={loading} />
                    </div>
                  </div>

                  <div className="form-actions" style={{ marginTop: '3rem' }}>
                    <button type="button" className="btn-primary" onClick={handleNext} disabled={!selectedDO}>
                      Next: Charges →
                    </button>
                  </div>
                </div>
              )}
              {currentStep === 2 && (
                <InvoiceDetails
                  formData={formData}
                  setFormData={setFormData}
                  onPrevious={() => setCurrentStep(1)}
                  onNext={() => setCurrentStep(3)}
                  loading={loading}
                />
              )}

              {currentStep === 3 && (
                <OtherInformation
                  formData={formData}
                  setFormData={setFormData}
                  onPrevious={() => setCurrentStep(2)}
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

export default SalesInvoice;
