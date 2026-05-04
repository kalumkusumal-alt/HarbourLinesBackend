// frontend/src/pages/Canada Client/HL-Manifest.jsx
import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import Navbar from '../../components/layout/Navbar.jsx';
import toast from 'react-hot-toast';

const SAVE_API = 'https://harbourb-production.up.railway.app/api/canada/createManifest';

const HLManifest = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // All added HBLs for this job/manifest
  const [hbls, setHbls] = useState([]);

  // For Invoice Details feature
  const [selectedManifestForInvoice, setSelectedManifestForInvoice] = useState(null); // { jobIdx, refIdx }
  const [invoiceCharges, setInvoiceCharges] = useState({}); // { refNum: { label: amount, ... } }

  const handleInvoiceChargeChange = (refNum, label, value) => {
    setInvoiceCharges(prev => ({
      ...prev,
      [refNum]: {
        ...prev[refNum],
        [label]: value
      }
    }));
  };

  const [chargeLabels, setChargeLabels] = useState(() => {
    const saved = localStorage.getItem('canadaChargeLabels');
    return saved ? JSON.parse(saved) : ['Package Charges', 'Service & Maintain', 'Handling Charges', 'Other Charges'];
  });
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    localStorage.setItem('canadaChargeLabels', JSON.stringify(chargeLabels));
  }, [chargeLabels]);

  const generateJobNum = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `JOB-CAN-${year}${month}${day}-${random}`;
  };

  // Wizard Step
  const [step, setStep] = useState(1);

  // Current HBL (now Job) being edited/added
  const [currentHBL, setCurrentHBL] = useState({
    jobNum: generateJobNum(),
    bookingNum: '',
    vessel: '',
    voyage: '',
    eta: '',
    containerNum: '',
    sealNum: '',
    containerType: '20GP',
    mainLine: '',
    pol: '',
    pod: '',
    references: [] // array of ref objects
  });

  // Vessel Search and Quick Panel state
  const [vesselSearchQuery, setVesselSearchQuery] = useState('');
  const [vesselResults, setVesselResults] = useState([]);
  const [showVesselDropdown, setShowVesselDropdown] = useState(false);
  const [showQuickVesselModal, setShowQuickVesselModal] = useState(false);
  const [newVessel, setNewVessel] = useState({ name: '', code: '' });

  // Port Search state
  const [polSearchQuery, setPolSearchQuery] = useState('');
  const [podSearchQuery, setPodSearchQuery] = useState('');
  const [polResults, setPolResults] = useState([]);
  const [podResults, setPodResults] = useState([]);
  const [showPolDropdown, setShowPolDropdown] = useState(false);
  const [showPodDropdown, setShowPodDropdown] = useState(false);
  const [showQuickPortModal, setShowQuickPortModal] = useState(false);
  const [activePortType, setActivePortType] = useState('pol'); // 'pol' or 'pod'
  const [newPort, setNewPort] = useState({ name: '', code: '' });

  // Current reference (with its own HBL number) being added to current Job
  const [currentRef, setCurrentRef] = useState({
    refNum: '',
    hblNumber: '',
    shipperName: '',
    shipperAddress: '',
    weight: '',
    cbm: '',
    noOfPackages: '',
    description: '',
    consigneeName: '',
    consigneeAddress: '',
    consigneeNIC: '',
    consigneePhone: '',
    packageType: 'CTN'
  });

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const handleHBLChange = (e) => {
    const { name, value } = e.target;
    setCurrentHBL(prev => ({ ...prev, [name]: value }));
    if (name === 'vessel' && !value) {
      setVesselResults([]);
      setShowVesselDropdown(false);
    }
    if (name === 'pol' && !value) {
      setPolResults([]);
      setShowPolDropdown(false);
    }
    if (name === 'pod' && !value) {
      setPodResults([]);
      setShowPodDropdown(false);
    }
  };

  // Vessel Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (vesselSearchQuery.trim().length > 1) {
        fetchVessels(vesselSearchQuery);
      } else {
        setVesselResults([]);
        setShowVesselDropdown(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [vesselSearchQuery]);

  const fetchVessels = async (query) => {
    try {
      const res = await fetch(`https://harbourb-production.up.railway.app/api/canada/vessels/search?query=${query}`);
      const data = await res.json();
      if (data.success) {
        setVesselResults(data.data);
        setShowVesselDropdown(true);
      }
    } catch (err) {
      console.error('Fetch vessels error:', err);
    }
  };

  const handleCreateVessel = async () => {
    if (!newVessel.name || !newVessel.code) {
      toast.error('Please fill all vessel details');
      return;
    }
    try {
      const res = await fetch('https://harbourb-production.up.railway.app/api/canada/vessels/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVessel)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Vessel added successfully');
        setCurrentHBL(prev => ({ ...prev, vessel: data.data.name }));
        setShowQuickVesselModal(false);
        setNewVessel({ name: '', code: '' });
      } else {
        toast.error(data.message || 'Failed to add vessel');
      }
    } catch (err) {
      toast.error('Error adding vessel');
    }
  };

  const selectVessel = (v) => {
    setCurrentHBL(prev => ({ ...prev, vessel: v.name }));
    setShowVesselDropdown(false);
    setVesselSearchQuery(v.name);
  };

  // Port Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (polSearchQuery.trim().length > 1) {
        fetchPorts(polSearchQuery, 'pol');
      } else {
        setPolResults([]);
        setShowPolDropdown(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [polSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (podSearchQuery.trim().length > 1) {
        fetchPorts(podSearchQuery, 'pod');
      } else {
        setPodResults([]);
        setShowPodDropdown(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [podSearchQuery]);

  const fetchPorts = async (query, type) => {
    try {
      const res = await fetch(`https://harbourb-production.up.railway.app/api/canada/ports/search?query=${query}`);
      const data = await res.json();
      if (data.success) {
        if (type === 'pol') {
          setPolResults(data.data);
          setShowPolDropdown(true);
        } else {
          setPodResults(data.data);
          setShowPodDropdown(true);
        }
      }
    } catch (err) {
      console.error('Fetch ports error:', err);
    }
  };

  const handleCreatePort = async () => {
    if (!newPort.name || !newPort.code) {
      toast.error('Please fill all port details');
      return;
    }
    try {
      const res = await fetch('https://harbourb-production.up.railway.app/api/canada/ports/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPort)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Port added successfully');
        setCurrentHBL(prev => ({ ...prev, [activePortType]: data.data.name }));
        if (activePortType === 'pol') {
          setPolSearchQuery(data.data.name);
          setShowPolDropdown(false);
        } else {
          setPodSearchQuery(data.data.name);
          setShowPodDropdown(false);
        }
        setShowQuickPortModal(false);
        setNewPort({ name: '', code: '' });
      } else {
        toast.error(data.message || 'Failed to add port');
      }
    } catch (err) {
      toast.error('Error adding port');
    }
  };

  const selectPort = (p, type) => {
    setCurrentHBL(prev => ({ ...prev, [type]: p.name }));
    if (type === 'pol') {
      setShowPolDropdown(false);
      setPolSearchQuery(p.name);
    } else {
      setShowPodDropdown(false);
      setPodSearchQuery(p.name);
    }
  };

  const handleRefChange = (e) => {
    const { name, value } = e.target;
    if (name === 'refNum') {
      setCurrentRef(prev => ({ ...prev, refNum: value, hblNumber: value }));
    } else {
      setCurrentRef(prev => ({ ...prev, [name]: value }));
    }
  };

  const addReferenceToHBL = () => {
    if (!currentRef.refNum.trim() && !currentRef.description.trim()) {
      toast.error('Please enter Reference Number or Description');
      return;
    }

    setCurrentHBL(prev => ({
      ...prev,
      references: [...prev.references, { ...currentRef }]
    }));

    setCurrentRef({
      refNum: '',
      hblNumber: '',
      shipperName: '',
      shipperAddress: '',
      weight: '',
      cbm: '',
      noOfPackages: '',
      description: '',
      consigneeName: '',
      consigneeAddress: '',
      consigneeNIC: '',
      consigneePhone: '',
      packageType: 'CTN'
    });

    toast.success('Reference added');
  };

  const removeReference = (index) => {
    setCurrentHBL(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
    toast.success('Reference removed');
  };

  const removeReferenceInSummary = (jobIdx, refIdx) => {
    if (window.confirm('Remove this reference from manifest?')) {
      setHbls(prevHbls => {
        const updatedHbls = [...prevHbls];
        const hbl = { ...updatedHbls[jobIdx] };
        const updatedRefs = hbl.references.filter((_, i) => i !== refIdx);

        if (updatedRefs.length === 0) {
          // If no references left, remove the whole job
          return updatedHbls.filter((_, i) => i !== jobIdx);
        }

        hbl.references = updatedRefs;
        updatedHbls[jobIdx] = hbl;
        return updatedHbls;
      });
      toast.success('Reference removed from manifest');
    }
  };

  const addHBL = () => {
    if (currentHBL.references.length === 0) {
      toast.error('Add at least one consignee (reference) to this job');
      return;
    }

    setHbls(prev => [...prev, { ...currentHBL }]);

    setCurrentHBL({
      jobNum: generateJobNum(),
      bookingNum: '',
      vessel: '',
      voyage: '',
      etd: '',
      containerNum: '',
      sealNum: '',
      containerType: '20GP',
      mainLine: '',
      pol: '',
      pod: '',
      references: []
    });

    setVesselSearchQuery(''); // Clear search query as well
    setPolSearchQuery('');
    setPodSearchQuery('');
    setStep(1); // Reset to Step 1 for next job
    toast.success('Job added to manifest');
  };

  const removeHBL = (index) => {
    setHbls(prev => prev.filter((_, i) => i !== index));
    toast.success('HBL removed');
  };

  const handleSaveManifest = async () => {
    if (hbls.length === 0) {
      toast.error('Add at least one HBL before saving');
      return;
    }

    setSaveLoading(true);

    try {
      const res = await fetch(SAVE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hbls })
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Manifest saved to Canada database!');
        setHbls([]);
      } else {
        toast.error(data.message || 'Failed to save manifest');
      }
    } catch (err) {
      toast.error('Network error while saving');
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const openInvoiceDetails = (jobIdx, refIdx) => {
    const hbl = hbls[jobIdx];
    const ref = hbl.references[refIdx];
    setSelectedManifestForInvoice({ jobIdx, refIdx });

    // Initialize charges for the specific reference
    const initialCharges = {};
    const chargeMap = {};
    // Map existing charges array to a flat object for easier editing
    if (ref.charges && Array.isArray(ref.charges)) {
      ref.charges.forEach(c => {
        chargeMap[c.label] = c.amount;
      });
    } else {
      // Initialize with 0 for all labels if no charges exist
      chargeLabels.forEach(l => {
        chargeMap[l] = 0;
      });
    }
    initialCharges[ref.refNum] = chargeMap;
    setInvoiceCharges(initialCharges);
  };

  const addChargeField = () => {
    if (chargeLabels.length >= 10) {
      toast.error('Maximum 10 charge fields allowed');
      return;
    }
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    if (chargeLabels.includes(newCategoryName.trim())) {
      toast.error('This category already exists');
      return;
    }
    setChargeLabels([...chargeLabels, newCategoryName.trim()]);
    setNewCategoryName('');
    toast.success('Category added');
  };

  const removeChargeField = (labelToRemove) => {
    if (chargeLabels.length <= 1) {
      toast.error('At least one charge category is required');
      return;
    }
    if (window.confirm(`Are you sure you want to remove "${labelToRemove}"? Existing data for this category will be hidden.`)) {
      setChargeLabels(chargeLabels.filter(l => l !== labelToRemove));
      toast.success('Category removed');
    }
  };

  const renameChargeField = (oldLabel, newLabel) => {
    if (!newLabel || !newLabel.trim() || newLabel === oldLabel) return;

    setChargeLabels(chargeLabels.map(l => l === oldLabel ? newLabel.trim() : l));

    if (selectedManifestForInvoice) {
      setInvoiceCharges(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(refNum => {
          updated[refNum] = { ...updated[refNum], [newLabel.trim()]: updated[refNum][oldLabel] || 0 };
          delete updated[refNum][oldLabel];
        });
        return updated;
      });
    }
  };

  const handleChargeChange = (refNum, field, value) => {
    setInvoiceCharges(prev => ({
      ...prev,
      [refNum]: {
        ...prev[refNum],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const saveInvoiceToHBL = () => {
    if (!selectedManifestForInvoice) return;
    const { jobIdx, refIdx } = selectedManifestForInvoice;

    setHbls(prevHbls => {
      const updatedHbls = [...prevHbls];
      const hbl = { ...updatedHbls[jobIdx] };
      const updatedRefs = [...hbl.references];
      const r = { ...updatedRefs[refIdx] };

      const chargeMap = invoiceCharges[r.refNum] || {};
      // Convert flat object back to array for storage
      const chargesArr = chargeLabels.map(label => ({
        label,
        amount: parseFloat(chargeMap[label]) || 0
      }));

      updatedRefs[refIdx] = { ...r, charges: chargesArr };
      hbl.references = updatedRefs;
      updatedHbls[jobIdx] = hbl;
      return updatedHbls;
    });

    toast.success('Charges updated for this manifest');
    setSelectedManifestForInvoice(null);
  };

  // Calculate totals across all HBLs
  let totalWeight = 0;
  let totalCBM = 0;
  let totalPkgs = 0;

  hbls.forEach(hbl => {
    hbl.references.forEach(ref => {
      totalWeight += parseFloat(ref.weight) || 0;
      totalCBM += (parseFloat(ref.cbm) || 0);
      totalPkgs += parseInt(ref.noOfPackages) || 0;
    });
  });

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="page-content" style={{ background: 'var(--bg-primary)', minHeight: 'calc(100vh - 70px)' }}>
          <div className="page-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>

            <header className="page-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <dev style={{ display: 'flex', alignItems: 'left' }}>
                  <h1 className="page-title" style={{ fontSize: '2.4rem', fontWeight: '800', background: 'linear-gradient(135deg, #1e40af, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                    Booking Manifest
                  </h1>
                </dev>
                <p className="page-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                  Manage multiple HBLs and references for the Canada manifest system
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span className="material-symbols-rounded" style={{ fontSize: '2.5rem', color: '#3b82f6', opacity: 0.8 }}>assignment</span>
              </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>

              {/* Left Column: Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0rem' }}>

                {/* Job Number Header - Simplified */}
                {/* Document Control Header */}
                <div className="card" style={{ padding: '1.5rem 2rem', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', background: 'var(--bg-secondary)', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
                    <span className="material-symbols-rounded" style={{ color: '#3b82f6', background: '#3b82f61a', padding: '10px', borderRadius: '12px' }}>branding_watermark</span>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>Active Master BL Number</label>
                      <input
                        type="text"
                        name="jobNum"
                        value={currentHBL.jobNum}
                        onChange={handleHBLChange}
                        style={{ border: 'none', background: 'transparent', fontSize: '1.4rem', fontWeight: '800', color: '#3b82f6', outline: 'none', width: '100%', padding: '0' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px', borderLeft: '1.5px solid var(--border-color)', paddingLeft: '2rem' }}>
                    <span className="material-symbols-rounded" style={{ color: '#10b981', background: '#10b9811a', padding: '10px', borderRadius: '12px' }}>bookmark</span>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>Booking Number</label>
                      <input
                        type="text"
                        name="bookingNum"
                        value={currentHBL.bookingNum}
                        onChange={handleHBLChange}
                        placeholder="Enter Booking #"
                        style={{ border: 'none', background: 'transparent', fontSize: '1.4rem', fontWeight: '800', color: '#10b981', outline: 'none', width: '100%', padding: '0' }}
                      />
                    </div>
                  </div>
                </div>

                {/* STEP 1: JOB & CONTAINER INFO */}
                {step === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Vessel Details Card */}
                    <div className="card" style={{ padding: '2rem', borderRadius: '24px', background: 'var(--bg-secondary)', border: '1.5px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.8rem', borderBottom: '3px solid #6366f1', paddingBottom: '0.75rem', width: 'fit-content' }}>
                        <span className="material-symbols-rounded" style={{ color: '#6366f1' }}>directions_boat</span>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>1. Vessel & Arrival Info</h3>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <div className="input-group" style={{ position: 'relative' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>directions_boat</span> Vessel Name
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                              <input
                                type="text"
                                name="vessel"
                                value={currentHBL.vessel}
                                onChange={(e) => {
                                  handleHBLChange(e);
                                  setVesselSearchQuery(e.target.value);
                                }}
                                autoComplete="off"
                                placeholder="Type to search..."
                                style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.3s' }}
                              />
                              {showVesselDropdown && vesselResults.length > 0 && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', marginTop: '5px', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '200px', overflowY: 'auto' }}>
                                  {vesselResults.map(v => (
                                    <div key={v._id} onClick={() => selectVessel(v)} style={{ padding: '0.8rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ fontWeight: '600' }}>{v.name}</span>
                                      <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{v.code}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowQuickVesselModal(true)}
                              style={{ padding: '0 1rem', borderRadius: '12px', background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <span className="material-symbols-rounded">add</span>
                            </button>
                          </div>
                        </div>

                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>escalator</span> Voyage
                          </label>
                          <input
                            type="text"
                            name="voyage"
                            value={currentHBL.voyage}
                            onChange={handleHBLChange}
                            placeholder="Voyage No."
                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                          />
                        </div>

                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>calendar_today</span> ETA Date
                          </label>
                          <input
                            type="date"
                            name="eta"
                            value={currentHBL.eta}
                            onChange={handleHBLChange}
                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                          />
                        </div>
                      </div>

                      {/* Port Details Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginTop: '1.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem' }}>
                        {/* Port of Loading */}
                        <div className="input-group" style={{ position: 'relative' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>logout</span> Port of Loading (POL)
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                              <input
                                type="text"
                                name="pol"
                                value={polSearchQuery}
                                onChange={(e) => {
                                  setPolSearchQuery(e.target.value);
                                  handleHBLChange(e);
                                }}
                                autoComplete="off"
                                placeholder="Search POL..."
                                style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                              />
                              {showPolDropdown && polResults.length > 0 && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', marginTop: '5px', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '150px', overflowY: 'auto' }}>
                                  {polResults.map(p => (
                                    <div key={p._id} onClick={() => selectPort(p, 'pol')} style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ fontWeight: '600' }}>{p.name}</span>
                                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{p.code}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActivePortType('pol');
                                setShowQuickPortModal(true);
                              }}
                              style={{ padding: '0 1rem', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}
                            >
                              <span className="material-symbols-rounded">add_location</span>
                            </button>
                          </div>
                        </div>

                        {/* Port of Discharge */}
                        <div className="input-group" style={{ position: 'relative' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>login</span> Port of Discharge (POD)
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                              <input
                                type="text"
                                name="pod"
                                value={podSearchQuery}
                                onChange={(e) => {
                                  setPodSearchQuery(e.target.value);
                                  handleHBLChange(e);
                                }}
                                autoComplete="off"
                                placeholder="Search POD..."
                                style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                              />
                              {showPodDropdown && podResults.length > 0 && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', marginTop: '5px', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '150px', overflowY: 'auto' }}>
                                  {podResults.map(p => (
                                    <div key={p._id} onClick={() => selectPort(p, 'pod')} style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ fontWeight: '600' }}>{p.name}</span>
                                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{p.code}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActivePortType('pod');
                                setShowQuickPortModal(true);
                              }}
                              style={{ padding: '0 1rem', borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer' }}
                            >
                              <span className="material-symbols-rounded">add_location</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Container Info Card */}
                    <div className="card" style={{ padding: '2rem', borderRadius: '24px', background: 'var(--bg-secondary)', border: '1.5px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.8rem', borderBottom: '3px solid #10b981', paddingBottom: '0.75rem', width: 'fit-content' }}>
                        <span className="material-symbols-rounded" style={{ color: '#10b981' }}>box</span>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>2. Container Info</h3>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>inventory_2</span> Container Number
                          </label>
                          <input
                            type="text"
                            name="containerNum"
                            value={currentHBL.containerNum}
                            onChange={handleHBLChange}
                            placeholder="CONT-123456"
                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                          />
                        </div>

                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>lock</span> Seal Number
                          </label>
                          <input
                            type="text"
                            name="sealNum"
                            value={currentHBL.sealNum}
                            onChange={handleHBLChange}
                            placeholder="SEAL-7890"
                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                          />
                        </div>

                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>straighten</span> Container Type
                          </label>
                          <select
                            name="containerType"
                            value={currentHBL.containerType}
                            onChange={handleHBLChange}
                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                          >
                            <option value="45HC">45HC</option>
                            <option value="45Reefer">45Reefer</option>
                            <option value="45GP">45GP</option>
                            <option value="AIRFreight">AIRFreight</option>
                            <option value="40HC">40HC</option>
                            <option value="40OT">40OT</option>
                            <option value="40Reefdry">40Reefdry</option>
                            <option value="40Flat Rack">40Flat Rack</option>
                            <option value="40Flat">40Flat</option>
                            <option value="40GP">40GP</option>
                            <option value="20Vertical">20Vertical</option>
                            <option value="20OT">20OT</option>
                            <option value="20Reefdry">20Reefdry</option>
                            <option value="20Flat">20Flat</option>
                            <option value="20GP">20GP</option>
                          </select>
                        </div>

                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>lan</span> Main Line
                          </label>
                          <input
                            type="text"
                            name="mainLine"
                            value={currentHBL.mainLine}
                            onChange={handleHBLChange}
                            placeholder="Shipping Line"
                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            if (!currentHBL.vessel || !currentHBL.containerNum) {
                              toast.error('Vessel Name and Container Number are required');
                              return;
                            }
                            setStep(2);
                          }}
                          style={{ padding: '1rem 3rem', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '1rem', boxShadow: '0 8px 15px rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}
                        >
                          Next: Add Cargo Details <span className="material-symbols-rounded">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: CARGO & PARTY DETAILS */}
                {step === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0rem' }}>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => setStep(1)}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid #6366f1', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>arrow_back</span> Back to Step 1
                      </button>
                      <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                    </div>

                    {/* Shipper Details Section */}
                    <div className="card" style={{ padding: '2rem', borderRadius: '24px', background: 'var(--bg-secondary)', border: '1.5px solid var(--border-color)', marginBottom: '1.5rem', boxShadow: 'var(--card-shadow)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.8rem', borderBottom: '3px solid #3b82f6', paddingBottom: '0.75rem', width: 'fit-content' }}>
                        <span className="material-symbols-rounded" style={{ color: '#3b82f6' }}>hail</span>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Shipper Details</h3>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>tag</span> H/BL Number
                          </label>
                          <input type="text" name="hblNumber" value={currentRef.hblNumber} onChange={handleRefChange} placeholder="HBL-..." style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>person</span> Name
                          </label>
                          <input type="text" name="shipperName" value={currentRef.shipperName} onChange={handleRefChange} placeholder="Enter name" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                      </div>
                      <div className="input-group" style={{ marginTop: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>location_on</span> Address
                        </label>
                        <textarea name="shipperAddress" value={currentRef.shipperAddress} onChange={handleRefChange} placeholder="Enter address" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', minHeight: '80px', resize: 'vertical' }} />
                      </div>
                    </div>

                    {/* Consignee Details Section */}
                    <div className="card" style={{ padding: '2rem', borderRadius: '24px', background: 'var(--bg-secondary)', border: '1.5px solid var(--border-color)', marginBottom: '1.5rem', boxShadow: 'var(--card-shadow)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.8rem', borderBottom: '3px solid #f59e0b', paddingBottom: '0.75rem', width: 'fit-content' }}>
                        <span className="material-symbols-rounded" style={{ color: '#f59e0b' }}>person_pin_circle</span>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Consignee Details</h3>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>person</span> Name
                          </label>
                          <input type="text" name="consigneeName" value={currentRef.consigneeName} onChange={handleRefChange} placeholder="Enter name" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>tag</span> Ref Number
                          </label>
                          <input type="text" name="refNum" value={currentRef.refNum} onChange={handleRefChange} placeholder="Ref No." style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>fingerprint</span> NIC Number
                          </label>
                          <input type="text" name="consigneeNIC" value={currentRef.consigneeNIC} onChange={handleRefChange} placeholder="NIC" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>call</span> Phone Number
                          </label>
                          <input type="text" name="consigneePhone" value={currentRef.consigneePhone} onChange={handleRefChange} placeholder="Phone" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                      </div>
                      <div className="input-group" style={{ marginTop: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>location_on</span> Address
                        </label>
                        <textarea name="consigneeAddress" value={currentRef.consigneeAddress} onChange={handleRefChange} placeholder="Enter address" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', minHeight: '80px', resize: 'vertical' }} />
                      </div>
                    </div>

                    {/* Cargo Info Card */}
                    <div className="card" style={{ padding: '2rem', borderRadius: '24px', background: 'var(--bg-secondary)', border: '1.5px solid var(--border-color)', boxShadow: 'var(--card-shadow)', marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem', borderBottom: '3px solid #10b981', paddingBottom: '0.75rem', width: 'fit-content' }}>
                        <span className="material-symbols-rounded" style={{ color: '#10b981' }}>architecture</span>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Cargo Specs</h3>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>weight</span> Weight (KG)
                          </label>
                          <input type="number" name="weight" value={currentRef.weight} onChange={handleRefChange} placeholder="0.00" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>square_foot</span> CBM
                          </label>
                          <input type="number" step="0.001" name="cbm" value={currentRef.cbm} onChange={handleRefChange} placeholder="0.000" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>package_2</span> Packages
                          </label>
                          <input type="number" name="noOfPackages" value={currentRef.noOfPackages} onChange={handleRefChange} placeholder="0" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div className="input-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>inventory</span> Pkg Type
                          </label>
                          <select name="packageType" value={currentRef.packageType} onChange={handleRefChange} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}>
                            <option value="CTN">Carton (CTN)</option>
                            <option value="PLT">Pallet (PLT)</option>
                            <option value="BX">Box (BX)</option>
                            <option value="PKG">Package (PKG)</option>
                            <option value="carpet">carpet</option>
                            <option value="walker">walker</option>
                          </select>
                        </div>
                      </div>

                      <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>description</span> Description
                        </label>
                        <textarea name="description" value={currentRef.description} onChange={handleRefChange} placeholder="Cargo contents..." style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', minHeight: '80px' }} />
                      </div>

                      <button
                        onClick={addReferenceToHBL}
                        style={{ width: '100%', marginTop: '2rem', padding: '1.2rem', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)', fontSize: '1rem' }}
                      >
                        <span className="material-symbols-rounded">add_circle</span> Add Consignee to Job
                      </button>
                    </div>

                    {/* Final Confirm Job Button */}
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <button
                        type="button"
                        onClick={addHBL}
                        disabled={currentHBL.references.length === 0}
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #1e40af)', color: 'white', border: 'none', padding: '1.5rem 4rem', borderRadius: '20px', fontSize: '1.2rem', fontWeight: '800', cursor: currentHBL.references.length === 0 ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '12px', boxShadow: '0 15px 35px rgba(59, 130, 246, 0.3)', opacity: currentHBL.references.length === 0 ? 0.6 : 1 }}
                      >
                        <span className="material-symbols-rounded">playlist_add</span> Confirm Job & Add to Manifest
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Preview & Added Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Current HBL References Table */}
                <div className="card" style={{ padding: '2rem', borderRadius: '24px', flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <span className="material-symbols-rounded" style={{ color: '#3b82f6' }}>auto_awesome_motion</span>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>Pending Master BL: <span style={{ color: '#3b82f6' }}>{currentHBL.jobNum || 'Draft'}</span></h3>
                  </div>

                  <div className="table-container" style={{ flex: 1, overflowY: 'auto', border: '1.5px solid var(--border-color)', borderRadius: '16px', background: 'var(--bg-primary)' }}>
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--table-header)' }}>
                        <tr>
                          <th style={{ padding: '1.2rem 1rem', textAlign: 'left', color: 'white' }}>Ref #</th>
                          <th style={{ padding: '1.2rem 1rem', textAlign: 'left', color: 'white' }}>Consignee</th>
                          <th style={{ padding: '1.2rem 1rem', textAlign: 'left', color: 'white' }}>Weight</th>
                          <th style={{ padding: '1.2rem 1rem', textAlign: 'left', color: 'white' }}>Pkgs</th>
                          <th style={{ padding: '1.2rem 1rem', textAlign: 'center', color: 'white' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentHBL.references.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              <span className="material-symbols-rounded" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem', opacity: 0.3 }}>inbox</span>
                              No references added to this HBL yet.
                            </td>
                          </tr>
                        ) : (
                          currentHBL.references.map((ref, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '1rem' }}><strong>{ref.refNum || '-'}</strong></td>
                              <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                <div style={{ fontWeight: '700' }}>{ref.consigneeName || '-'}</div>
                                {ref.consigneeNIC && <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '2px' }}>NIC: {ref.consigneeNIC}</div>}
                                {ref.consigneePhone && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Tel: {ref.consigneePhone}</div>}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                {ref.weight || 0} kg
                                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '2px', fontWeight: 'bold' }}>{ref.packageType}</div>
                              </td>
                              <td style={{ padding: '1rem' }}>{ref.noOfPackages || 0}</td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <button
                                  onClick={() => removeReference(idx)}
                                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', margin: '0 auto' }}
                                >
                                  <span className="material-symbols-rounded" style={{ fontSize: '1.2rem' }}>delete</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Manifest Summary */}
                <div className="card" style={{ padding: '2rem', borderRadius: '24px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <span className="material-symbols-rounded" style={{ color: '#3b82f6' }}>monitoring</span>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>Manifest Totals</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1.25rem 0.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.5rem', fontWeight: '700', letterSpacing: '0.5px' }}>TOTAL WEIGHT</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#3b82f6' }}>{totalWeight.toFixed(2)}<span style={{ fontSize: '0.8rem', marginLeft: '2px', opacity: 0.8 }}>kg</span></div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1.25rem 0.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.5rem', fontWeight: '700', letterSpacing: '0.5px' }}>TOTAL CBM</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981' }}>{totalCBM.toFixed(3)}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1.25rem 0.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.5rem', fontWeight: '700', letterSpacing: '0.5px' }}>TOTAL PKGS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f59e0b' }}>{totalPkgs}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '1rem', opacity: 0.7 }}>Added Jobs: </span>
                      <strong style={{ fontSize: '1.5rem', color: '#3b82f6' }}>{hbls.length}</strong>
                    </div>
                    <button
                      className="btn-primary"
                      disabled={hbls.length === 0 || saveLoading}
                      onClick={handleSaveManifest}
                      style={{ padding: '1rem 2.2rem', borderRadius: '14px', background: '#3b82f6', color: 'white', fontWeight: '800', border: 'none', cursor: hbls.length === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.3s', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)', opacity: hbls.length === 0 ? 0.5 : 1 }}
                    >
                      {saveLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="material-symbols-rounded animate-spin">sync</span> Saving...
                        </div>
                      ) : 'Save Entire Manifest'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Full Manifest View */}
            {hbls.length > 0 && (
              <div className="card" style={{ marginTop: '3rem', padding: '2rem', borderRadius: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#3b82f61a', padding: '10px', borderRadius: '12px' }}>
                      <span className="material-symbols-rounded" style={{ color: '#3b82f6', fontSize: '2rem' }}>summarize</span>
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800' }}>Manifest Summary</h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Review all added House Bills of Lading</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{ background: '#f0fdf4', color: '#166534', padding: '0.6rem 1.25rem', borderRadius: '50px', fontWeight: '700', fontSize: '0.9rem', border: '1px solid #bcf0da' }}>
                      {hbls.length} HBLs Ready
                    </span>
                  </div>
                </div>

                <div className="table-container" style={{ borderRadius: '20px', overflow: 'hidden', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--table-header)', color: 'white' }}>
                      <tr>
                        <th style={{ padding: '1.4rem 1rem', textAlign: 'left' }}>Job Number</th>
                        <th style={{ padding: '1.4rem 1rem', textAlign: 'left' }}>Shipper</th>
                        <th style={{ padding: '1.4rem 1rem', textAlign: 'left' }}>HBLs/Refs Num</th>
                        <th style={{ padding: '1.4rem 1rem', textAlign: 'left' }}>Weight</th>
                        <th style={{ padding: '1.4rem 1rem', textAlign: 'left' }}>CBM</th>
                        <th style={{ padding: '1.4rem 1rem', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hbls.map((hbl, hIdx) => (
                        hbl.references.map((ref, rIdx) => (
                          <tr key={`${hIdx}-${rIdx}`} style={{ borderBottom: '1px solid var(--border-color)', transition: 'all 0.2s', background: 'var(--bg-secondary)' }}>
                            <td style={{ padding: '1.2rem 1rem' }}>
                              <div style={{ fontWeight: '800', color: '#3b82f6' }}>{hbl.jobNum}</div>
                              {hbl.bookingNum && <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>BK: {hbl.bookingNum}</div>}
                            </td>
                            <td style={{ padding: '1.2rem 1rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ref.shipperName || '-'}</td>
                            <td style={{ padding: '1.2rem 1rem' }}>
                              <span style={{ fontWeight: '700' }}>{ref.hblNumber || ref.refNum}</span>
                            </td>
                            <td style={{ padding: '1.2rem 1rem', fontWeight: '600' }}>{(parseFloat(ref.weight) || 0).toFixed(2)} kg</td>
                            <td style={{ padding: '1.2rem 1rem', fontWeight: '600' }}>{(parseFloat(ref.cbm) || 0).toFixed(3)}</td>
                            <td style={{ padding: '1.2rem 1rem', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => openInvoiceDetails(hIdx, rIdx)}
                                  style={{ background: '#3b82f61a', color: '#3b82f6', border: '1px solid #3b82f64d', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                  title="Add Invoice Details"
                                >
                                  <span className="material-symbols-rounded" style={{ fontSize: '1.4rem' }}>receipt_long</span>
                                </button>
                                <button
                                  onClick={() => removeReferenceInSummary(hIdx, rIdx)}
                                  style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '10px', padding: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                                  title="Remove Reference"
                                >
                                  <span className="material-symbols-rounded" style={{ fontSize: '1.4rem' }}>delete_forever</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Invoice Details Section */}
            {selectedManifestForInvoice && (
              <div className="card" style={{ marginTop: '3rem', padding: '2rem', borderRadius: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#10b9811a', padding: '10px', borderRadius: '12px' }}>
                      <span className="material-symbols-rounded" style={{ color: '#10b981', fontSize: '2rem' }}>payments</span>
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800' }}>Invoice Details: <span style={{ color: '#10b981' }}>{hbls[selectedManifestForInvoice.jobIdx].references[selectedManifestForInvoice.refIdx].hblNumber}</span></h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter financial charges for this specific manifest</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button
                      onClick={() => setSelectedManifestForInvoice(null)}
                      style={{ background: '#f59e0b1a', color: '#f59e0b', border: 'none', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <span className="material-symbols-rounded">close</span> Cancel
                    </button>
                  </div>
                </div>

                {/* HBL Totals Preview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem', padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: '20px', border: '1.5px dashed var(--border-color)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.25rem' }}>TOTAL PKGS</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{hbls[selectedManifestForInvoice.jobIdx].references.reduce((acc, r) => acc + (parseInt(r.noOfPackages) || 0), 0)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.25rem' }}>TOTAL WEIGHT (KG)</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{hbls[selectedManifestForInvoice.jobIdx].references.reduce((acc, r) => acc + (parseFloat(r.weight) || 0), 0).toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.25rem' }}>TOTAL CBM</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{hbls[selectedManifestForInvoice.jobIdx].references.reduce((acc, r) => acc + (parseFloat(r.cbm) || 0), 0).toFixed(3)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {(() => {
                    const ref = hbls[selectedManifestForInvoice.jobIdx].references[selectedManifestForInvoice.refIdx];
                    return (
                      <div key={selectedManifestForInvoice.refIdx} style={{ padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: '1.2rem', color: '#3b82f6' }}>person</span>
                          <h4 style={{ margin: 0 }}>Consignee: <strong>{ref.consigneeName || 'Unknown'}</strong> <span style={{ fontSize: '0.8rem', opacity: 0.5, marginLeft: '8px' }}>({ref.refNum})</span></h4>
                          <button
                            onClick={() => setShowCategoryManager(true)}
                            style={{ marginLeft: 'auto', background: 'var(--bg-primary)', color: '#3b82f6', border: '1.5px solid #3b82f6', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}
                          >
                            <span className="material-symbols-rounded" style={{ fontSize: '1.3rem' }}>settings_suggest</span> Manage Categories
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                          {chargeLabels.map((label, lIdx) => (
                            <div key={lIdx} className="input-group">
                              <label
                                style={{ fontSize: '0.75rem', fontWeight: '900', color: '#10b981', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                              >
                                <span>{label}</span>
                              </label>
                              <input
                                type="number"
                                className="input"
                                value={invoiceCharges[ref.refNum]?.[label] || 0}
                                onChange={(e) => handleInvoiceChargeChange(ref.refNum, label, e.target.value)}
                                style={{ borderRadius: '12px', padding: '0.75rem', borderColor: '#10b98188' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button
                    className="btn-primary"
                    onClick={saveInvoiceToHBL}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '1rem 2.5rem', borderRadius: '14px', border: 'none', color: 'white', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.2)' }}
                  >
                    Confirm & Apply Charges
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* QUICK VESSEL MODAL (Quick Panel) */}
      {
        showQuickVesselModal && (
          <div
            onClick={() => setShowQuickVesselModal(false)}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(8px)' }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: '500px', background: 'var(--bg-secondary)', borderRadius: '28px', padding: '2.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                <div style={{ background: '#6366f11a', padding: '10px', borderRadius: '12px' }}>
                  <span className="material-symbols-rounded" style={{ color: '#6366f1', fontSize: '2rem' }}>directions_boat</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800' }}>Add New Vessel</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem' }}>Vessel name</label>
                  <input
                    className="input"
                    placeholder="e.g. EVER GIVEN"
                    value={newVessel.name}
                    onChange={(e) => setNewVessel(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem' }}>Vessel Code</label>
                  <input
                    className="input"
                    placeholder="e.g. EVG-123"
                    value={newVessel.code}
                    onChange={(e) => setNewVessel(prev => ({ ...prev, code: e.target.value }))}
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => setShowQuickVesselModal(false)}
                    style={{ flex: 1, padding: '1rem', borderRadius: '14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateVessel}
                    style={{ flex: 1, padding: '1rem', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.2)' }}
                  >
                    Create Vessel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* QUICK PORT MODAL */}
      {
        showQuickPortModal && (
          <div
            onClick={() => setShowQuickPortModal(false)}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(8px)' }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: '500px', background: 'var(--bg-secondary)', borderRadius: '28px', padding: '2.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                <div style={{ background: activePortType === 'pol' ? '#3b82f61a' : '#10b9811a', padding: '10px', borderRadius: '12px' }}>
                  <span className="material-symbols-rounded" style={{ color: activePortType === 'pol' ? '#3b82f6' : '#10b981', fontSize: '2rem' }}>add_location</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800' }}>Add New {activePortType === 'pol' ? 'POL' : 'POD'}</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem' }}>Port name</label>
                  <input
                    className="input"
                    placeholder="e.g. PORT SUDAN"
                    value={newPort.name}
                    onChange={(e) => setNewPort(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem' }}>Port Code</label>
                  <input
                    className="input"
                    placeholder="e.g. SDPOR"
                    value={newPort.code}
                    onChange={(e) => setNewPort(prev => ({ ...prev, code: e.target.value }))}
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => setShowQuickPortModal(false)}
                    style={{ flex: 1, padding: '1rem', borderRadius: '14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePort}
                    style={{ flex: 1, padding: '1rem', borderRadius: '14px', background: activePortType === 'pol' ? 'linear-gradient(135deg, #3b82f6, #1e40af)' : 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.2)' }}
                  >
                    Create Port
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* CATEGORY MANAGER MODAL */}
      {
        showCategoryManager && (
          <div
            onClick={() => setShowCategoryManager(false)}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(8px)' }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: '650px', background: 'var(--bg-secondary)', borderRadius: '28px', padding: '2.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="material-symbols-rounded" style={{ color: '#3b82f6', fontSize: '2rem' }}>settings_suggest</span>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Manage Categories</h3>
                </div>
                <button
                  onClick={() => setShowCategoryManager(false)}
                  style={{ border: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span className="material-symbols-rounded">close</span>
                </button>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    className="input"
                    placeholder="New category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    style={{ borderRadius: '12px', flex: 1 }}
                  />
                  <button
                    onClick={addChargeField}
                    style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Add
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '8px' }}>Max 10 categories allowed. Changes persist in your browser.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                {chargeLabels.map((label, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '1.2rem', opacity: 0.3 }}>drag_indicator</span>
                    <input
                      style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }}
                      value={label}
                      onChange={(e) => renameChargeField(label, e.target.value)}
                    />
                    <button
                      onClick={() => removeChargeField(label)}
                      style={{ border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: '1.2rem' }}>delete</span>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowCategoryManager(false)}
                style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #1e40af)', color: 'white', fontWeight: '800', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.2)' }}
              >
                Done Managing
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default HLManifest;
