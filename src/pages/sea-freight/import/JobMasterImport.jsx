// frontend/src/pages/sea-freight/import/JobMasterImport.jsx
import { useState, useEffect } from 'react';
import Sidebar from '../../../components/layout/Sidebar.jsx';
import Navbar from '../../../components/layout/Navbar.jsx';
import Loading from '../../../components/common/Loading.jsx';
import toast from 'react-hot-toast';
import '../../../styles/JobMasterImport.css';
import PortOfLoadingInfo from './PortOfLoadingInfo.jsx';
import ContainerInfo from './ContainerInfo.jsx';

const API_BASE = 'https://harbourb-production.up.railway.app/api/jobs/sea-import';
const DRAFT_KEY = 'importJobDraft_v1';

const JobMasterImport = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentStep, setCurrentStep] = useState(1);

  const [currencies, setCurrencies] = useState([]);
  const [seaDestinations, setSeaDestinations] = useState([]);
  const [customerSuppliers, setCustomerSuppliers] = useState([]);
  const [vessels, setVessels] = useState([]);

  // Auto-suggest states
  const [vesselSearch, setVesselSearch] = useState('');
  const [showVesselDropdown, setShowVesselDropdown] = useState(false);

  const [portDepartureSearch, setPortDepartureSearch] = useState('');
  const [showPortDepartureDropdown, setShowPortDepartureDropdown] = useState(false);

  const [portDischargeSearch, setPortDischargeSearch] = useState('');
  const [showPortDischargeDropdown, setShowPortDischargeDropdown] = useState(false);

  const [originAgentSearch, setOriginAgentSearch] = useState('');
  const [showOriginAgentDropdown, setShowOriginAgentDropdown] = useState(false);

  const [carrierSearch, setCarrierSearch] = useState('');
  const [showCarrierDropdown, setShowCarrierDropdown] = useState(false);

  const [shipAgentSearch, setShipAgentSearch] = useState('');
  const [showShipAgentDropdown, setShowShipAgentDropdown] = useState(false);

  const [principleCustomerSearch, setPrincipleCustomerSearch] = useState('');
  const [showPrincipleCustomerDropdown, setShowPrincipleCustomerDropdown] = useState(false);

  const [localAgentSearch, setLocalAgentSearch] = useState('');
  const [showLocalAgentDropdown, setShowLocalAgentDropdown] = useState(false);

  const [portOfLoadingSearch, setPortOfLoadingSearch] = useState('');
  const [showPortOfLoadingDropdown, setShowPortOfLoadingDropdown] = useState(false);

  const [showQuickVesselModal, setShowQuickVesselModal] = useState(false);
  const [showQuickAgentModal, setShowQuickAgentModal] = useState(false);
  const [showQuickPortModal, setShowQuickPortModal] = useState(false);
  const [quickPortTarget, setQuickPortTarget] = useState(''); // 'departure' or 'discharge'
  const [quickAgentType, setQuickAgentType] = useState('agent'); // 'agent' or 'carrier'
  const [quickDataTarget, setQuickDataTarget] = useState(''); // which field to update

  const initialForm = {
    jobNum: '',
    jobDate: new Date().toISOString().slice(0, 10),
    finalizeDate: new Date().toISOString().slice(0, 10),
    jobCategory: 'Freight Forwarding',
    vesselId: '',
    vesselName: '',
    vesselCode: '',
    voyage: '',
    portDepartureId: '',
    portDepartureName: '',
    portDepartureCode: '',
    portDischargeId: '',
    portDischargeName: '',
    portDischargeCode: '',
    originAgentId: '',
    originAgentName: '',
    carrierId: '',
    carrierName: '',
    shipAgentId: '',
    shipAgentName: '',
    principleCustomerId: '',
    principleCustomerName: '',
    localAgentId: '',
    localAgentName: '',
    etaDateTime: '',
    status: 'Active',
    loadingVoyage: '',
    lastPortEtd: '',
    cargoCategory: 'FCL',
    commodity: 'General Cargo',
    currency: '',
    exchangeRate: '',
    terminalRef: '',
    service: '',
    terminal: 'JCT',
    slpaReference: '',
    numContainers: '',
    impNo: '',
    portOfLoadingId: '',
    portOfLoadingName: '',
    portOfLoadingCode: '',
    mblNumber: '',
    containers: []
  };

  const [formData, setFormData] = useState(initialForm);

  const jobCategories = ['SOC', 'Freight Forwarding', 'Car Carrier', 'Casual Caller', 'Transhipment', 'Main Line', 'FF + Clearing', 'NVOCC'];
  const cargoCategories = ['Console', 'Co-loads', 'FCL'];
  const commodities = ['Cargo', 'General Cargo'];
  const terminals = ['JCT', 'UCT', 'SAGT', 'CICT', 'CWIT'];

  useEffect(() => {
    const savedSidebar = localStorage.getItem('sidebarOpen');
    if (savedSidebar !== null) setSidebarOpen(JSON.parse(savedSidebar));

    fetchJobs();
    fetchCurrencies();
    fetchSeaDestinations();
    fetchCustomerSuppliers();
    fetchVessels();
    generateJobNumber();

    const draft = sessionStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(prev => ({ ...initialForm, ...parsed }));
        if (parsed.vesselName) setVesselSearch(parsed.vesselName);
        if (parsed.portDepartureName) setPortDepartureSearch(parsed.portDepartureName);
        if (parsed.portDischargeName) setPortDischargeSearch(parsed.portDischargeName);
        if (parsed.originAgentName) setOriginAgentSearch(parsed.originAgentName);
        if (parsed.carrierName) setCarrierSearch(parsed.carrierName);
        if (parsed.shipAgentName) setShipAgentSearch(parsed.shipAgentName);
        if (parsed.principleCustomerName) setPrincipleCustomerSearch(parsed.principleCustomerName);
        if (parsed.localAgentName) setLocalAgentSearch(parsed.localAgentName);
        if (parsed.portOfLoadingName) setPortOfLoadingSearch(parsed.portOfLoadingName);
      } catch (err) {
        console.warn('Failed to parse draft', err);
      }
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      } catch (err) {
        console.warn('Could not save draft', err);
      }
    }
  }, [formData, loading]);

  const generateJobNumber = async () => {
    if (isEditMode) return;
    try {
      const res = await fetch(`${API_BASE}/getAllJobs`);
      const data = await res.json();
      if (data.success) {
        const count = data.data.length;
        const nextNum = String(count + 1).padStart(3, '0');
        setFormData(prev => ({ ...prev, jobNum: `HBL/IMP/${nextNum}` }));
      }
    } catch (err) {
      const nextNum = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
      setFormData(prev => ({ ...prev, jobNum: `HBL/IMP/${nextNum}` }));
    }
  };

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
      const res = await fetch('https://harbourb-production.up.railway.app/api/currencies/getAllCurrencies');
      const data = await res.json();
      if (data.success) setCurrencies(data.data);
    } catch (err) {
      toast.error('Failed to load currencies');
    }
  };

  const fetchSeaDestinations = async () => {
    try {
      const res = await fetch('https://harbourb-production.up.railway.app/api/sea-destinations/getAllDestinations');
      const data = await res.json();
      if (data.success) setSeaDestinations(data.data);
    } catch (err) {
      toast.error('Failed to load sea destinations');
    }
  };

  const fetchCustomerSuppliers = async () => {
    try {
      const res = await fetch('https://harbourb-production.up.railway.app/api/customersuppliers/getAllCustomerSuppliers');
      const data = await res.json();
      if (data.success) setCustomerSuppliers(data.data);
    } catch (err) {
      toast.error('Failed to load agents & carriers');
    }
  };

  const fetchVessels = async () => {
    try {
      const res = await fetch('https://harbourb-production.up.railway.app/api/vessels/getAllVessels');
      const data = await res.json();
      if (data.success) setVessels(data.data);
    } catch (err) {
      toast.error('Failed to load vessels');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'jobNum') return;

    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'loadingVoyage') {
        updated.slpaReference = (prev.vesselCode || '') + value;
      }
      return updated;
    });
  };

  const handleVesselSelect = (vessel) => {
    setFormData(prev => ({
      ...prev,
      vesselId: vessel._id,
      vesselName: vessel.name,
      vesselCode: vessel.code,
      slpaReference: (vessel.code || '') + (prev.loadingVoyage || '')
    }));
    setVesselSearch(`${vessel.code} - ${vessel.name}`);
    setShowVesselDropdown(false);
  };

  const handlePortDepartureSelect = (port) => {
    setFormData(prev => ({
      ...prev,
      portDepartureId: port._id,
      portDepartureName: port.name,
      portDepartureCode: port.code
    }));
    setPortDepartureSearch(`${port.code} - ${port.name}`);
    setShowPortDepartureDropdown(false);
  };

  const handlePortDischargeSelect = (port) => {
    setFormData(prev => ({
      ...prev,
      portDischargeId: port._id,
      portDischargeName: port.name,
      portDischargeCode: port.code
    }));
    setPortDischargeSearch(`${port.code} - ${port.name}`);
    setShowPortDischargeDropdown(false);
  };

  const handleOriginAgentSelect = (agent) => {
    setFormData(prev => ({ ...prev, originAgentId: agent._id, originAgentName: agent.name }));
    setOriginAgentSearch(`${agent.code} - ${agent.name}`);
    setShowOriginAgentDropdown(false);
  };

  const handleCarrierSelect = (carrier) => {
    setFormData(prev => ({ ...prev, carrierId: carrier._id, carrierName: carrier.name }));
    setCarrierSearch(`${carrier.code} - ${carrier.name}`);
    setShowCarrierDropdown(false);
  };

  const handleShipAgentSelect = (agent) => {
    setFormData(prev => ({ ...prev, shipAgentId: agent._id, shipAgentName: agent.name }));
    setShipAgentSearch(`${agent.code} - ${agent.name}`);
    setShowShipAgentDropdown(false);
  };

  const handlePrincipleCustomerSelect = (cust) => {
    setFormData(prev => ({ ...prev, principleCustomerId: cust._id, principleCustomerName: cust.name }));
    setPrincipleCustomerSearch(`${cust.code} - ${cust.name}`);
    setShowPrincipleCustomerDropdown(false);
  };

  const handleLocalAgentSelect = (agent) => {
    setFormData(prev => ({ ...prev, localAgentId: agent._id, localAgentName: agent.name }));
    setLocalAgentSearch(`${agent.code} - ${agent.name}`);
    setShowLocalAgentDropdown(false);
  };

  const handlePortOfLoadingSelect = (port) => {
    setFormData(prev => ({
      ...prev,
      portOfLoadingId: port._id,
      portOfLoadingName: port.name,
      portOfLoadingCode: port.code
    }));
    setPortOfLoadingSearch(`${port.code} - ${port.name}`);
    setShowPortOfLoadingDropdown(false);
  };

  const handleQuickVesselSave = async (quickData) => {
    try {
      const res = await fetch('https://harbourb-production.up.railway.app/api/vessels/createVessel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quickData)
      });
      const data = await res.json();
      if (data.success) {
        await fetchVessels();
        handleVesselSelect(data.data);
        setShowQuickVesselModal(false);
        toast.success('Vessel added and selected!');
      } else throw new Error(data.message);
    } catch (err) {
      toast.error(err.message || 'Failed to add vessel');
    }
  };

  const handleQuickPortSave = async (quickData) => {
    try {
      const res = await fetch('https://harbourb-production.up.railway.app/api/sea-destinations/createDestination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quickData)
      });
      const data = await res.json();
      if (data.success) {
        await fetchSeaDestinations();
        if (quickPortTarget === 'departure') handlePortDepartureSelect(data.data);
        else handlePortDischargeSelect(data.data);
        setShowQuickPortModal(false);
        toast.success('Port added and selected!');
      } else throw new Error(data.message);
    } catch (err) {
      toast.error(err.message || 'Failed to add port');
    }
  };

  const handleQuickAgentSave = async (quickData) => {
    try {
      const res = await fetch('https://harbourb-production.up.railway.app/api/customersuppliers/createCustomerSupplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...quickData, type: quickAgentType })
      });
      const data = await res.json();
      if (data.success) {
        await fetchCustomerSuppliers();
        const agent = data.data;
        if (quickDataTarget === 'originAgent') handleOriginAgentSelect(agent);
        else if (quickDataTarget === 'carrier') handleCarrierSelect(agent);
        else if (quickDataTarget === 'shipAgent') handleShipAgentSelect(agent);
        else if (quickDataTarget === 'localAgent') handleLocalAgentSelect(agent);
        else if (quickDataTarget === 'principleCustomer') handlePrincipleCustomerSelect(agent);

        setShowQuickAgentModal(false);
        toast.success(`${quickAgentType === 'agent' ? 'Agent' : 'Carrier'} added and selected!`);
      } else throw new Error(data.message);
    } catch (err) {
      toast.error(err.message || 'Failed to add entry');
    }
  };

  const filteredVessels = vessels.filter(v =>
    `${v.code} ${v.name}`.toLowerCase().includes(vesselSearch.toLowerCase())
  );

  const handleStep1Next = () => {
    if (!formData.vesselId || !formData.portDepartureId || !formData.portDischargeId) {
      toast.error('Vessel and Ports are required to continue');
      return;
    }

    // Auto-sync Port of Loading with Port of Departure
    setFormData(prev => ({
      ...prev,
      portOfLoadingId: prev.portOfLoadingId || prev.portDepartureId,
      portOfLoadingName: prev.portOfLoadingName || prev.portDepartureName,
      portOfLoadingCode: prev.portOfLoadingCode || prev.portDepartureCode
    }));

    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    if (!formData.portOfLoadingId || !formData.mblNumber) {
      toast.error('Port of Loading and MBL Number are required!');
      return;
    }
    setCurrentStep(3);
  };

  const handleFinalSave = async () => {
    if (!formData.containers || formData.containers.length === 0) {
      toast.error('Please add at least one container');
      return;
    }

    setLoading(true);

    const url = isEditMode ? `${API_BASE}/updateJob/${editingId}` : `${API_BASE}/createJob`;
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');

      await fetchJobs();
      toast.success(isEditMode ? 'Job updated!' : 'Job created successfully!');

      generateJobNumber();
      setFormData(initialForm);
      sessionStorage.removeItem(DRAFT_KEY);
      setCurrentStep(1);
      setIsEditMode(false);
      setEditingId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    generateJobNumber();
    setFormData(initialForm);
    sessionStorage.removeItem(DRAFT_KEY);
    setCurrentStep(1);
    setIsEditMode(false);
    setEditingId(null);
    toast.success('Form cleared');
  };

  const openEditModal = async () => {
    setLoading(true);
    await fetchJobs();
    setLoading(false);
    setShowEditModal(true);
    setSearchTerm('');
  };

  const selectForEdit = (job) => {
    // Find vessel code since it's not in the job model
    const vessel = vessels.find(v => v._id === job.vesselId);
    const vCode = vessel ? vessel.code : '';

    setFormData({ ...job, vesselCode: vCode });
    setIsEditMode(true);
    setEditingId(job._id);
    setShowEditModal(false);
    setCurrentStep(1);

    // Sync search states
    if (job.vesselName) setVesselSearch(vCode ? `${vCode} - ${job.vesselName}` : job.vesselName);
    if (job.portDepartureName) setPortDepartureSearch(job.portDepartureCode ? `${job.portDepartureCode} - ${job.portDepartureName}` : job.portDepartureName);
    if (job.portDischargeName) setPortDischargeSearch(job.portDischargeCode ? `${job.portDischargeCode} - ${job.portDischargeName}` : job.portDischargeName);
    if (job.originAgentName) setOriginAgentSearch(job.originAgentName);
    if (job.carrierName) setCarrierSearch(job.carrierName);
    if (job.shipAgentName) setShipAgentSearch(job.shipAgentName);
    if (job.principleCustomerName) setPrincipleCustomerSearch(job.principleCustomerName);
    if (job.localAgentName) setLocalAgentSearch(job.localAgentName);
    if (job.portOfLoadingName) setPortOfLoadingSearch(job.portOfLoadingCode ? `${job.portOfLoadingCode} - ${job.portOfLoadingName}` : job.portOfLoadingName);

    toast.success('Job loaded for editing');
  };

  const filtered = jobs.filter(j =>
    j.jobNum.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      {loading && <Loading fullPage={true} message={isEditMode ? "Updating..." : (currentStep === 3 ? "Saving Job..." : "Processing...")} />}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="page-content">
          <div className="page-wrapper">
            <div className="page-header">
              <h1 className="page-title">Sea Freight Import Job Maintenance</h1>
              <p className="page-subtitle">Create and manage sea import jobs</p>
            </div>

            <div className="job-card">
              <form className="job-form" onSubmit={(e) => e.preventDefault()}>

                {currentStep === 1 && (
                  <>
                    <div className="section">
                      <h3>Job Information</h3>
                      <div className="form-grid">
                        <div className="input-group">
                          <label>Job Num <span className="required">*</span></label>
                          <input value={formData.jobNum} readOnly disabled style={{ backgroundColor: 'var(--input-bg)', fontWeight: 'bold', color: 'var(--text-primary)' }} />
                          <small style={{ color: 'var(--text-secondary)' }}>Auto-generated</small>
                        </div>
                        <div className="input-group">
                          <label>Job Date <span className="required">*</span></label>
                          <input type="date" name="jobDate" value={formData.jobDate} onChange={handleChange} required disabled={loading} />
                        </div>
                        <div className="input-group">
                          <label>Finalize Date</label>
                          <input type="date" name="finalizeDate" value={formData.finalizeDate} onChange={handleChange} disabled={loading} />
                        </div>
                      </div>
                    </div>

                    <div className="section">
                      <h3>Job Category</h3>
                      <div className="form-grid">
                        <div className="input-group">
                          <label>Category <span className="required">*</span></label>
                          <select name="jobCategory" value={formData.jobCategory} onChange={handleChange} disabled={loading}>
                            {jobCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="section">
                      <h3>Vessel Information</h3>
                      <div className="form-grid">
                        <div className="input-group" style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                            <label style={{ margin: 0 }}>Vessel <span className="required">*</span></label>
                            <button type="button" className="btn-new-small" onClick={() => setShowQuickVesselModal(true)}>+ New</button>
                          </div>
                          <input
                            type="text"
                            value={vesselSearch}
                            onChange={(e) => { setVesselSearch(e.target.value); setShowVesselDropdown(true); }}
                            onFocus={() => setShowVesselDropdown(true)}
                            placeholder="Type vessel code or name..."
                            disabled={loading}
                          />
                          {showVesselDropdown && filteredVessels.length > 0 && (
                            <div className="autocomplete-dropdown">
                              {filteredVessels.map(vessel => (
                                <div
                                  key={vessel._id}
                                  className="autocomplete-item"
                                  onClick={() => handleVesselSelect(vessel)}
                                >
                                  <strong>{vessel.code}</strong> — {vessel.name}
                                  {vessel.country && <span style={{ marginLeft: '8px', color: 'var(--text-secondary)' }}>• {vessel.country}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="input-group">
                          <label>Vessel Name</label>
                          <input value={formData.vesselName} readOnly disabled style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)', fontWeight: '600' }} />
                        </div>
                        <div className="input-group">
                          <label>Voyage</label>
                          <input name="voyage" value={formData.voyage} onChange={handleChange} disabled={loading} />
                        </div>
                      </div>
                    </div>

                    <div className="section">
                      <h3>Port Information</h3>
                      <div className="form-grid">
                        <div className="input-group" style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                            <label style={{ margin: 0 }}>Port of Departure <span className="required">*</span></label>
                            <button type="button" className="btn-new-small" onClick={() => { setQuickPortTarget('departure'); setShowQuickPortModal(true); }}>+ New</button>
                          </div>
                          <input type="text" value={portDepartureSearch} onChange={(e) => { setPortDepartureSearch(e.target.value); setShowPortDepartureDropdown(true); }} onFocus={() => setShowPortDepartureDropdown(true)} placeholder="Type port code or name..." disabled={loading} />
                          {showPortDepartureDropdown && (
                            <div className="autocomplete-dropdown">
                              {seaDestinations.filter(p => p.code.toLowerCase().includes(portDepartureSearch.toLowerCase()) || p.name.toLowerCase().includes(portDepartureSearch.toLowerCase()))
                                .map(port => (
                                  <div key={port._id} className="autocomplete-item" onClick={() => handlePortDepartureSelect(port)}>
                                    <strong>{port.code}</strong> — {port.name}
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                        <div className="input-group">
                          <label>Port of Departure Name</label>
                          <input value={formData.portDepartureName} readOnly disabled style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)', fontWeight: '600' }} />
                        </div>

                        <div className="input-group" style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                            <label style={{ margin: 0 }}>Port of Discharge <span className="required">*</span></label>
                            <button type="button" className="btn-new-small" onClick={() => { setQuickPortTarget('discharge'); setShowQuickPortModal(true); }}>+ New</button>
                          </div>
                          <input type="text" value={portDischargeSearch} onChange={(e) => { setPortDischargeSearch(e.target.value); setShowPortDischargeDropdown(true); }} onFocus={() => setShowPortDischargeDropdown(true)} placeholder="Type port code or name..." disabled={loading} />
                          {showPortDischargeDropdown && (
                            <div className="autocomplete-dropdown">
                              {seaDestinations.filter(p => p.code.toLowerCase().includes(portDischargeSearch.toLowerCase()) || p.name.toLowerCase().includes(portDischargeSearch.toLowerCase()))
                                .map(port => (
                                  <div key={port._id} className="autocomplete-item" onClick={() => handlePortDischargeSelect(port)}>
                                    <strong>{port.code}</strong> — {port.name}
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                        <div className="input-group">
                          <label>Port of Discharge Name</label>
                          <input value={formData.portDischargeName} readOnly disabled style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)', fontWeight: '600' }} />
                        </div>
                      </div>
                    </div>

                    <div className="section">
                      <h3>Agent & Carrier Information</h3>
                      <div className="form-grid">
                        <div className="input-group" style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                            <label style={{ margin: 0 }}>Origin Agent</label>
                            <button type="button" className="btn-new-small" onClick={() => { setQuickAgentType('supplier'); setQuickDataTarget('originAgent'); setShowQuickAgentModal(true); }}>+ New</button>
                          </div>
                          <input type="text" value={originAgentSearch} onChange={(e) => { setOriginAgentSearch(e.target.value); setShowOriginAgentDropdown(true); }} onFocus={() => setShowOriginAgentDropdown(true)} placeholder="Type code or name..." disabled={loading} />
                          {showOriginAgentDropdown && (
                            <div className="autocomplete-dropdown">
                              {customerSuppliers.filter(c => c.code.toLowerCase().includes(originAgentSearch.toLowerCase()) || c.name.toLowerCase().includes(originAgentSearch.toLowerCase()))
                                .map(agent => (
                                  <div key={agent._id} className="autocomplete-item" onClick={() => handleOriginAgentSelect(agent)}>
                                    <strong>{agent.code}</strong> — {agent.name}
                                    <span style={{ marginLeft: '12px', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', backgroundColor: 'var(--highlight-warning)', color: 'var(--text-primary)' }}>
                                      {agent.type.toUpperCase()}
                                    </span>
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                        <div className="input-group">
                          <label>Origin Agent Name</label>
                          <input value={formData.originAgentName} readOnly disabled style={{ backgroundColor: 'var(--highlight-warning)', color: 'var(--text-primary)', fontWeight: '600' }} />
                        </div>

                        {/* Carrier */}
                        <div className="input-group" style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                            <label style={{ margin: 0 }}>Carrier</label>
                            <button type="button" className="btn-new-small" onClick={() => { setQuickAgentType('supplier'); setQuickDataTarget('carrier'); setShowQuickAgentModal(true); }}>+ New</button>
                          </div>
                          <input type="text" value={carrierSearch} onChange={(e) => { setCarrierSearch(e.target.value); setShowCarrierDropdown(true); }} onFocus={() => setShowCarrierDropdown(true)} placeholder="Type code or name..." disabled={loading} />
                          {showCarrierDropdown && (
                            <div className="autocomplete-dropdown">
                              {customerSuppliers.filter(c => c.code.toLowerCase().includes(carrierSearch.toLowerCase()) || c.name.toLowerCase().includes(carrierSearch.toLowerCase()))
                                .map(carrier => (
                                  <div key={carrier._id} className="autocomplete-item" onClick={() => handleCarrierSelect(carrier)}>
                                    <strong>{carrier.code}</strong> — {carrier.name}
                                    <span style={{ marginLeft: '12px', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', backgroundColor: 'var(--highlight-warning)', color: 'var(--text-primary)' }}>
                                      {carrier.type.toUpperCase()}
                                    </span>
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                        <div className="input-group">
                          <label>Carrier Name</label>
                          <input value={formData.carrierName} readOnly disabled style={{ backgroundColor: 'var(--highlight-warning)', color: 'var(--text-primary)', fontWeight: '600' }} />
                        </div>

                        {/* Ship Agent */}
                        <div className="input-group" style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                            <label style={{ margin: 0 }}>Ship Agent</label>
                            <button type="button" className="btn-new-small" onClick={() => { setQuickAgentType('supplier'); setQuickDataTarget('shipAgent'); setShowQuickAgentModal(true); }}>+ New</button>
                          </div>
                          <input type="text" value={shipAgentSearch} onChange={(e) => { setShipAgentSearch(e.target.value); setShowShipAgentDropdown(true); }} onFocus={() => setShowShipAgentDropdown(true)} placeholder="Type code or name..." disabled={loading} />
                          {showShipAgentDropdown && (
                            <div className="autocomplete-dropdown">
                              {customerSuppliers.filter(c => c.code.toLowerCase().includes(shipAgentSearch.toLowerCase()) || c.name.toLowerCase().includes(shipAgentSearch.toLowerCase()))
                                .map(agent => (
                                  <div key={agent._id} className="autocomplete-item" onClick={() => handleShipAgentSelect(agent)}>
                                    <strong>{agent.code}</strong> — {agent.name}
                                    <span style={{ marginLeft: '12px', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', backgroundColor: 'var(--highlight-warning)', color: 'var(--text-primary)' }}>
                                      {agent.type.toUpperCase()}
                                    </span>
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                        <div className="input-group">
                          <label>Ship Agent Name</label>
                          <input value={formData.shipAgentName} readOnly disabled style={{ backgroundColor: 'var(--highlight-warning)', color: 'var(--text-primary)', fontWeight: '600' }} />
                        </div>
                      </div>
                    </div>

                    {/* Final Destination */}
                    <div className="section">
                      <h3>Final Destination</h3>
                      <div className="form-grid">
                        <div className="input-group" style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                            <label style={{ margin: 0 }}>Principle Customer</label>
                            <button type="button" className="btn-new-small" onClick={() => { setQuickAgentType('customer'); setQuickDataTarget('principleCustomer'); setShowQuickAgentModal(true); }}>+ New</button>
                          </div>
                          <input type="text" value={principleCustomerSearch} onChange={(e) => { setPrincipleCustomerSearch(e.target.value); setShowPrincipleCustomerDropdown(true); }} onFocus={() => setShowPrincipleCustomerDropdown(true)} placeholder="Type code or name..." disabled={loading} />
                          {showPrincipleCustomerDropdown && (
                            <div className="autocomplete-dropdown">
                              {customerSuppliers.filter(c => c.code.toLowerCase().includes(principleCustomerSearch.toLowerCase()) || c.name.toLowerCase().includes(principleCustomerSearch.toLowerCase()))
                                .map(cust => (
                                  <div key={cust._id} className="autocomplete-item" onClick={() => handlePrincipleCustomerSelect(cust)}>
                                    <strong>{cust.code}</strong> — {cust.name}
                                    <span style={{ marginLeft: '12px', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)' }}>
                                      {cust.type.toUpperCase()}
                                    </span>
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                        <div className="input-group">
                          <label>Principle Customer Name</label>
                          <input value={formData.principleCustomerName} readOnly disabled style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)', fontWeight: '600' }} />
                        </div>

                        <div className="input-group" style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                            <label style={{ margin: 0 }}>Local Agent</label>
                            <button type="button" className="btn-new-small" onClick={() => { setQuickAgentType('supplier'); setQuickDataTarget('localAgent'); setShowQuickAgentModal(true); }}>+ New</button>
                          </div>
                          <input type="text" value={localAgentSearch} onChange={(e) => { setLocalAgentSearch(e.target.value); setShowLocalAgentDropdown(true); }} onFocus={() => setShowLocalAgentDropdown(true)} placeholder="Type code or name..." disabled={loading} />
                          {showLocalAgentDropdown && (
                            <div className="autocomplete-dropdown">
                              {customerSuppliers.filter(c => c.code.toLowerCase().includes(localAgentSearch.toLowerCase()) || c.name.toLowerCase().includes(localAgentSearch.toLowerCase()))
                                .map(agent => (
                                  <div key={agent._id} className="autocomplete-item" onClick={() => handleLocalAgentSelect(agent)}>
                                    <strong>{agent.code}</strong> — {agent.name}
                                    <span style={{ marginLeft: '12px', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', backgroundColor: 'var(--highlight-warning)', color: 'var(--text-primary)' }}>
                                      {agent.type.toUpperCase()}
                                    </span>
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                        <div className="input-group">
                          <label>Local Agent Name</label>
                          <input value={formData.localAgentName} readOnly disabled style={{ backgroundColor: 'var(--highlight-warning)', color: 'var(--text-primary)', fontWeight: '600' }} />
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="section">
                      <h3>Additional Details</h3>
                      <div className="form-grid">
                        <div className="input-group">
                          <label>ETA Date/Time</label>
                          <input type="datetime-local" name="etaDateTime" value={formData.etaDateTime} onChange={handleChange} disabled={loading} />
                        </div>
                        <div className="input-group">
                          <label>Status</label>
                          <select name="status" value={formData.status} onChange={handleChange} disabled={loading}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Loading Voyage</label>
                          <input name="loadingVoyage" value={formData.loadingVoyage} onChange={handleChange} disabled={loading} />
                        </div>
                        <div className="input-group">
                          <label>Last Port ETD</label>
                          <input type="datetime-local" name="lastPortEtd" value={formData.lastPortEtd} onChange={handleChange} disabled={loading} />
                        </div>
                        <div className="input-group">
                          <label>Cargo Category</label>
                          <select name="cargoCategory" value={formData.cargoCategory} onChange={handleChange} disabled={loading}>
                            <option value="FCL">FCL</option>
                            <option value="Console">Console</option>
                            <option value="Co-loads">Co-loads</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Commodity</label>
                          <select name="commodity" value={formData.commodity} onChange={handleChange} disabled={loading}>
                            <option value="General Cargo">General Cargo</option>
                            <option value="Cargo">Cargo</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Currency</label>
                          <select name="currency" value={formData.currency} onChange={handleChange} disabled={loading}>
                            <option value="">Select Currency</option>
                            {currencies.map(curr => (
                              <option key={curr._id} value={curr.code}>{curr.code} - {curr.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Exchange Rate</label>
                          <input type="number" step="0.0001" name="exchangeRate" value={formData.exchangeRate} onChange={handleChange} disabled={loading} />
                        </div>
                        <div className="input-group">
                          <label>Terminal Ref.</label>
                          <input name="terminalRef" value={formData.terminalRef} onChange={handleChange} disabled={loading} />
                        </div>
                        <div className="input-group">
                          <label>Service</label>
                          <input name="service" value={formData.service} onChange={handleChange} disabled={loading} />
                        </div>
                        <div className="input-group">
                          <label>Terminal</label>
                          <select name="terminal" value={formData.terminal} onChange={handleChange} disabled={loading}>
                            {terminals.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="input-group">
                          <label>SLPA Reference</label>
                          <input name="slpaReference" value={formData.slpaReference} onChange={handleChange} disabled={loading} />
                        </div>
                        <div className="input-group">
                          <label>No. of Containers</label>
                          <input type="number" name="numContainers" value={formData.numContainers} onChange={handleChange} disabled={loading} min="0" />
                        </div>
                        <div className="input-group">
                          <label>IMP No.</label>
                          <input name="impNo" value={formData.impNo} onChange={handleChange} disabled={loading} />
                        </div>
                      </div>
                    </div>

                    {/* NAVIGATION */}
                    <div className="form-actions">
                      <button type="button" className="btn-edit" onClick={openEditModal}>
                        Edit Existing
                      </button>
                      <button type="button" className="btn-secondary" onClick={handleCancel}>
                        Clear Form
                      </button>
                      <div style={{ flex: 1 }}></div>
                      <button type="button" className="btn-primary" onClick={handleStep1Next}>
                        Next: Port of Loading
                      </button>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <PortOfLoadingInfo
                    formData={formData}
                    setFormData={setFormData}
                    onPrevious={() => setCurrentStep(1)}
                    onNext={handleStep2Next}
                  />
                )}

                {currentStep === 3 && (
                  <ContainerInfo
                    formData={formData}
                    setFormData={setFormData}
                    onPrevious={() => setCurrentStep(2)}
                    onSaveJob={handleFinalSave}
                  />
                )}
              </form>

              <div className="job-table" style={{ marginTop: '2rem' }}>
                <h3>All Sea Import Jobs</h3>
                {jobs.length === 0 ? (
                  <p className="no-data">No jobs added yet</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Job Num</th>
                        <th>Category</th>
                        <th>Vessel</th>
                        <th>Voyage</th>
                        <th>Port of Loading</th>
                        <th>MBL</th>
                        <th>Containers</th>
                        <th>Status</th>
                        <th>Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map(job => (
                        <tr key={job._id}>
                          <td><strong>{job.jobNum}</strong></td>
                          <td>{job.jobCategory}</td>
                          <td>{job.vesselName}</td>
                          <td>{job.voyage}</td>
                          <td>{job.portOfLoadingName || '-'}</td>
                          <td>{job.mblNumber || '-'}</td>
                          <td>{job.containers?.length || 0}</td>
                          <td>{job.status}</td>
                          <td>{new Date(job.createdAt).toLocaleDateString()}</td>
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

      {/* Select Job Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Job to Edit</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-search">
              <input
                type="text"
                placeholder="Search by Job Number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-list">
              {filtered.length === 0 ? (
                <p className="no-data" style={{ padding: '2rem' }}>No jobs found</p>
              ) : (
                filtered.map(job => (
                  <div key={job._id} className="list-item" onClick={() => selectForEdit(job)}>
                    <div>
                      <strong>{job.jobNum}</strong>
                      <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>
                        ({job.vesselName} - {job.voyage})
                      </span>
                    </div>
                    <span className="material-symbols-rounded">arrow_forward_ios</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Vessel Modal */}
      {showQuickVesselModal && (
        <QuickVesselModal
          onClose={() => setShowQuickVesselModal(false)}
          onSave={handleQuickVesselSave}
        />
      )}

      {/* Quick Add Agent/Carrier Modal */}
      {showQuickAgentModal && (
        <QuickAgentModal
          type={quickAgentType}
          onClose={() => setShowQuickAgentModal(false)}
          onSave={handleQuickAgentSave}
        />
      )}
      {/* Quick Add Port Modal */}
      {showQuickPortModal && (
        <QuickPortModal
          onClose={() => setShowQuickPortModal(false)}
          onSave={handleQuickPortSave}
        />
      )}
    </div>
  );
};

// Internal Modal Components for Quick Add
const QuickPortModal = ({ onClose, onSave }) => {
  const [data, setData] = useState({ code: '', name: '' });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Quick Add Sea Port</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="input-group">
              <label>Port Code *</label>
              <input value={data.code} onChange={e => setData({ ...data, code: e.target.value.toUpperCase() })} placeholder="e.g. SGSIN" />
            </div>
            <div className="input-group">
              <label>Port Name *</label>
              <input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder="e.g. Singapore" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(data)}>Add Port</button>
        </div>
      </div>
    </div>
  );
};
const QuickVesselModal = ({ onClose, onSave }) => {
  const [data, setData] = useState({ code: '', name: '', country: '' });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Quick Add Vessel</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="input-group">
              <label>Vessel Code *</label>
              <input value={data.code} onChange={e => setData({ ...data, code: e.target.value.toUpperCase() })} placeholder="e.g. VSL01" />
            </div>
            <div className="input-group">
              <label>Vessel Name *</label>
              <input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder="e.g. OCEAN GLORY" />
            </div>
            <div className="input-group">
              <label>Country</label>
              <input value={data.country} onChange={e => setData({ ...data, country: e.target.value })} placeholder="e.g. Panama" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(data)}>Add Vessel</button>
        </div>
      </div>
    </div>
  );
};

const QuickAgentModal = ({ type, onClose, onSave }) => {
  const [data, setData] = useState({ code: '', name: '', address: '' });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Quick Add {type === 'agent' ? 'Agent' : 'Carrier'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="input-group">
              <label>Code *</label>
              <input value={data.code} onChange={e => setData({ ...data, code: e.target.value.toUpperCase() })} placeholder="e.g. AGT01" />
            </div>
            <div className="input-group">
              <label>Name *</label>
              <input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder="e.g. ABC LOGISTICS" />
            </div>
            <div className="input-group">
              <label>Address</label>
              <input value={data.address} onChange={e => setData({ ...data, address: e.target.value })} placeholder="e.g. 123 Street, Colombo" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(data)}>Add {type === 'agent' ? 'Agent' : 'Carrier'}</button>
        </div>
      </div>
    </div>
  );
};

export default JobMasterImport;
