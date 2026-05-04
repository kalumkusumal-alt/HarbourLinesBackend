// frontend/src/pages/Export/Export.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import Sidebar from '../../components/layout/Sidebar.jsx';
import Navbar from '../../components/layout/Navbar.jsx';
import Loading from '../../components/common/Loading.jsx';
import exportReportTemplate from '../../assets/reports/Export/Export_Report.pdf';

const VESSELS_API = 'https://harbourb-production.up.railway.app/api/vessels/getAllVessels';
const PORTS_API = 'https://harbourb-production.up.railway.app/api/sea-destinations/getAllDestinations';
const CUSTOMERS_API = 'https://harbourb-production.up.railway.app/api/customersuppliers/getAllCustomerSuppliers';
const SAVE_EXPORT_API = 'https://harbourb-production.up.railway.app/api/jobs/sea-export/createExportJob';
const ALL_JOBS_API = 'https://harbourb-production.up.railway.app/api/jobs/sea-export/getAllExportJobs';

const Export = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [lastSavedJobId, setLastSavedJobId] = useState(null);

  const [vessels, setVessels] = useState([]);
  const [ports, setPorts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [formData, setFormData] = useState({
    shipperId: '',
    shipperCode: '',
    shipperName: '',
    consigneeId: '',
    consigneeCode: '',
    consigneeName: '',
    notifyPartyId: '',
    notifyPartyCode: '',
    notifyPartyName: '',
    blNumber: '',
    onBoardDate: '',
    deliveryApplyTo: '',
    vesselId: '',
    vesselCode: '',
    vesselName: '',
    voyage: '',
    vesselVoyage: '',
    portLoadingId: '',
    portLoading: '',
    portLoadingCode: '',
    portDischargeId: '',
    portDischarge: '',
    portDischargeCode: '',
    placeDelivery: '',
    freightPayableAt: '',
    numOriginalBLs: '3',
    marksNumbers: '',
    containerSealNumbers: '',
    numPackages: '',
    descriptionGoods: '',
    grossWeight: '',
    measurementCBM: ''
  });

  // Search & Dropdown States
  const [shipperSearch, setShipperSearch] = useState('');
  const [showShipperDropdown, setShowShipperDropdown] = useState(false);
  const [consigneeSearch, setConsigneeSearch] = useState('');
  const [showConsigneeDropdown, setShowConsigneeDropdown] = useState(false);
  const [notifyPartySearch, setNotifyPartySearch] = useState('');
  const [showNotifyPartyDropdown, setShowNotifyPartyDropdown] = useState(false);
  const [vesselSearch, setVesselSearch] = useState('');
  const [showVesselDropdown, setShowVesselDropdown] = useState(false);
  const [portLoadingSearch, setPortLoadingSearch] = useState('');
  const [showPortLoadingDropdown, setShowPortLoadingDropdown] = useState(false);
  const [portDischargeSearch, setPortDischargeSearch] = useState('');
  const [showPortDischargeDropdown, setShowPortDischargeDropdown] = useState(false);

  // Quick-Add Modal States
  const [showQuickVesselModal, setShowQuickVesselModal] = useState(false);
  const [showQuickAgentModal, setShowQuickAgentModal] = useState(false);
  const [showQuickPortModal, setShowQuickPortModal] = useState(false);
  const [quickPortTarget, setQuickPortTarget] = useState(''); // 'loading' or 'discharge'
  const [quickAgentType, setQuickAgentType] = useState('agent'); // 'agent' or 'carrier'
  const [quickDataTarget, setQuickDataTarget] = useState(''); // shipper, consignee, etc.

  // Print Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [exportJobs, setExportJobs] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) setSidebarOpen(JSON.parse(saved));

    const loadData = async () => {
      await Promise.all([
        fetchVessels(),
        fetchPorts(),
        fetchCustomers()
      ]);
      setPageLoading(false);
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
      const res = await fetch(VESSELS_API);
      const data = await res.json();
      if (data.success) setVessels(data.data || []);
      else toast.error('Failed to load vessels');
    } catch (err) {
      toast.error('Network error loading vessels');
    }
  };

  const fetchPorts = async () => {
    try {
      const res = await fetch(PORTS_API);
      const data = await res.json();
      if (data.success) setPorts(data.data || []);
      else toast.error('Failed to load ports');
    } catch (err) {
      toast.error('Network error loading ports');
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch(CUSTOMERS_API);
      const data = await res.json();
      if (data.success) setCustomers(data.data || []);
      else toast.error('Failed to load customers/suppliers');
    } catch (err) {
      toast.error('Network error loading customers');
    }
  };

  const fetchExportJobs = async () => {
    try {
      const res = await fetch(ALL_JOBS_API);
      const data = await res.json();
      if (data.success) setExportJobs(data.data || []);
      else toast.error('Failed to load export jobs');
    } catch (err) {
      toast.error('Network error loading export jobs');
    }
  };

  // Selection Handlers
  const handleShipperSelect = (item) => {
    setFormData(prev => ({
      ...prev,
      shipperId: item._id,
      shipperCode: item.code,
      shipperName: item.name,
      shipperAddress: item.address,
      shipperTel: item.telNo
    }));
    setShipperSearch(`${item.code} - ${item.name}`);
    setShowShipperDropdown(false);
  };

  const handleConsigneeSelect = (item) => {
    setFormData(prev => ({
      ...prev,
      consigneeId: item._id,
      consigneeCode: item.code,
      consigneeName: item.name,
      consigneeAddress: item.address,
      consigneeTel: item.telNo
    }));
    setConsigneeSearch(`${item.code} - ${item.name}`);
    setShowConsigneeDropdown(false);
  };

  const handleNotifyPartySelect = (item) => {
    setFormData(prev => ({
      ...prev,
      notifyPartyId: item._id,
      notifyPartyCode: item.code,
      notifyPartyName: item.name,
      notifyPartyAddress: item.address,
      notifyPartyTel: item.telNo
    }));
    setNotifyPartySearch(`${item.code} - ${item.name}`);
    setShowNotifyPartyDropdown(false);
  };

  const handleVesselSelect = (v) => {
    setFormData(prev => ({
      ...prev,
      vesselId: v._id,
      vesselCode: v.code,
      vesselName: v.name,
      voyage: v.voyage || ''
    }));
    setVesselSearch(`${v.code} - ${v.name}`);
    setShowVesselDropdown(false);
  };

  const handlePortLoadingSelect = (p) => {
    setFormData(prev => ({
      ...prev,
      portLoadingId: p._id,
      portLoadingCode: p.code,
      portLoading: `${p.name || ''} (${p.code || ''})`
    }));
    setPortLoadingSearch(`${p.code} - ${p.name}`);
    setShowPortLoadingDropdown(false);
  };

  const handlePortDischargeSelect = (p) => {
    setFormData(prev => ({
      ...prev,
      portDischargeId: p._id,
      portDischargeCode: p.code,
      portDischarge: `${p.name || ''} (${p.code || ''})`
    }));
    setPortDischargeSearch(`${p.code} - ${p.name}`);
    setShowPortDischargeDropdown(false);
  };

  // Quick Add Handlers
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

  const handleQuickAgentSave = async (quickData) => {
    try {
      const res = await fetch('https://harbourb-production.up.railway.app/api/customersuppliers/createCustomerSupplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...quickData, type: quickAgentType })
      });
      const data = await res.json();
      if (data.success) {
        await fetchCustomers();
        const agent = data.data;
        if (quickDataTarget === 'shipper') handleShipperSelect(agent);
        else if (quickDataTarget === 'consignee') handleConsigneeSelect(agent);
        else if (quickDataTarget === 'notifyParty') handleNotifyPartySelect(agent);

        setShowQuickAgentModal(false);
        toast.success('Agent/Customer added and selected!');
      } else throw new Error(data.message);
    } catch (err) {
      toast.error(err.message || 'Failed to add entry');
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
        await fetchPorts();
        if (quickPortTarget === 'loading') handlePortLoadingSelect(data.data);
        else handlePortDischargeSelect(data.data);
        setShowQuickPortModal(false);
        toast.success('Port added and selected!');
      } else throw new Error(data.message);
    } catch (err) {
      toast.error(err.message || 'Failed to add port');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.shipperId) return 'Shipper is required';
    if (!formData.consigneeId) return 'Consignee is required';
    if (!formData.blNumber) return 'BL Number is required';
    if (!formData.onBoardDate) return 'On Board Date is required';
    if (!formData.deliveryApplyTo) return 'Delivery Apply To is required';
    if (!formData.deliveryApplyTo) return 'Delivery Apply To is required';
    if (!formData.vesselId) return 'Vessel is required';
    if (!formData.voyage) return 'Voyage is required';
    if (!formData.portLoadingId) return 'Port of Loading is required';
    if (!formData.portDischargeId) return 'Port of Discharge is required';
    return null;
  };

  const generatePDF = async (jobData = null) => {
    const dataToPrint = jobData || formData;

    // Validate if data is available
    if (!dataToPrint.blNumber) {
      toast.error('No B/L data to print');
      return;
    }

    try {
      // Create a new blank PDF document instead of loading template
      const pdfDoc = await PDFDocument.create();

      // Add a blank A4 page (595 x 842 points)
      const page = pdfDoc.addPage([595, 842]);

      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 10;

      const draw = (text, x, y, optionsOrSize = fontSize) => {
        if (!text) return;

        let options = {};
        if (typeof optionsOrSize === 'number') {
          options = { size: optionsOrSize };
        } else if (typeof optionsOrSize === 'object') {
          options = optionsOrSize;
        } else {
          options = { size: fontSize };
        }

        const size = options.size || fontSize;
        const maxWidth = options.maxWidth; // undefined is fine for pdf-lib

        page.drawText(String(text), {
          x,
          y,
          size,
          font,
          color: rgb(0, 0, 0),
          maxWidth,
          lineHeight: size * 1.2
        });
      };

      // Coordinates need to be adjusted based on the actual PDF template
      // Assuming A4 (595 x 842 points), (0,0) is bottom-left.

      // Helper to format party details
      const formatParty = (prefix, data) => {
        const name = data[`${prefix}Name`] || data[`${prefix}Id`]?.name || '';
        const address = data[`${prefix}Address`] || data[`${prefix}Id`]?.address || '';
        const tel = data[`${prefix}Tel`] || data[`${prefix}Id`]?.telNo || '';
        return [name, address, tel].filter(Boolean).join('\n');
      };

      // Shipper (Top Left)
      draw(formatParty('shipper', dataToPrint), 0, 795, { maxWidth: 260 });

      // Consignee (Below Shipper)
      draw(formatParty('consignee', dataToPrint), 0, 720, { maxWidth: 260 });

      // Notify Party (Below Consignee)
      draw(formatParty('notifyParty', dataToPrint), 0, 630, { maxWidth: 260 });

      // B/L Number (Top Right)
      draw(dataToPrint.blNumber, 360, 700);

      // Vessel / Voyage
      const vesselName = dataToPrint.vesselName || dataToPrint.vesselId?.name || '';
      const voyage = dataToPrint.voyage || '';
      draw(`${vesselName}/${voyage}`, 20, 555);

      // Ports
      draw(dataToPrint.portLoading, 140, 555, { size: 8 });
      draw(dataToPrint.portDischarge, 20, 515);
      draw(dataToPrint.placeDelivery, 140, 515);

      // Marks & Numbers - Max Width 50px
      const marks = dataToPrint.marksNumbers || '';
      const seals = dataToPrint.containerSealNumbers || '';
      const marksAndSeals = [marks, seals].filter(Boolean).join(' / ');
      draw(marksAndSeals, 0, 460, { maxWidth: 110, size: 8 });

      // No. of Packages
      draw(String(dataToPrint.numPackages), 150, 460);

      // Description
      draw(dataToPrint.descriptionGoods, 190, 460, { maxWidth: 240, size: 8 });

      // Gross Weight
      draw(`${dataToPrint.grossWeight} KGS`, 440, 460);

      // Measurement
      draw(`${dataToPrint.measurementCBM} CBM`, 540, 460);

      // Freight & Originals (Bottom)
      draw(dataToPrint.freightPayableAt, 310, 520);
      draw(String(dataToPrint.numOriginalBLs), 510, 520);

      // On Board Date
      draw(dataToPrint.onBoardDate ? new Date(dataToPrint.onBoardDate).toISOString().split('T')[0] : '', 360, 665);

      // Delivery Apply To
      draw(dataToPrint.deliveryApplyTo, 360, 620, { maxWidth: 200 });

      // Serialize the PDFDocument to bytes (a Uint8Array)
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      toast.success('Report Generated Successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setSaveLoading(true);

    try {
      const res = await fetch(SAVE_EXPORT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Export B/L created successfully!');
        setLastSavedJobId(data.data._id); // Store saved job ID
        // Optional: reset form
        // Optional: reset form
        /*
        setFormData({
          shipperId: '',
          consigneeId: '',
          notifyPartyId: '',
          blNumber: '',
          onBoardDate: '',
          deliveryApplyTo: '',
          vesselId: '',
          vesselVoyage: '',
          portLoadingId: '',
          portLoading: '',
          portDischargeId: '',
          portDischarge: '',
          placeDelivery: '',
          freightPayableAt: '',
          numOriginalBLs: '3',
          marksNumbers: '',
          containerSealNumbers: '',
          numPackages: '',
          descriptionGoods: '',
          grossWeight: '',
          measurementCBM: ''
        });
        */
      } else {
        toast.error(data.message || 'Failed to create Export B/L');
      }
    } catch (err) {
      toast.error('Network error while saving');
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  if (pageLoading) return <Loading fullPage message="Loading data..." />;

  const filteredVessels = vessels.filter(v =>
    `${v.code} ${v.name}`.toLowerCase().includes(vesselSearch.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      {saveLoading && <Loading fullPage message="Saving Export B/L..." />}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`main-content ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="page-content">
          <div className="page-wrapper">
            <div className="page-header">
              <h1 className="page-title">Export B/L Creation</h1>
              <p className="page-subtitle">Create and save new Export Bill of Lading</p>
            </div>

            <form onSubmit={handleSubmit} className="job-form">
              {/* Parties */}
              <div className="section">
                <h3>Parties</h3>
                <div className="form-grid">
                  <div className="input-group" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                      <label style={{ margin: 0 }}>Shipper <span className="required">*</span></label>
                      <button type="button" className="btn-new-small" onClick={() => { setQuickAgentType('supplier'); setQuickDataTarget('shipper'); setShowQuickAgentModal(true); }}>+ New</button>
                    </div>
                    <input
                      type="text"
                      value={shipperSearch}
                      onChange={(e) => { setShipperSearch(e.target.value); setShowShipperDropdown(true); }}
                      onFocus={() => setShowShipperDropdown(true)}
                      placeholder="Type shipper code or name..."
                      disabled={saveLoading}
                    />
                    {showShipperDropdown && (
                      <div className="autocomplete-dropdown">
                        {customers.filter(c => `${c.code} ${c.name}`.toLowerCase().includes(shipperSearch.toLowerCase()))
                          .map(c => (
                            <div key={c._id} className="autocomplete-item" onClick={() => handleShipperSelect(c)}>
                              <strong>{c.code}</strong> — {c.name}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>

                  <div className="input-group" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                      <label style={{ margin: 0 }}>Consignee <span className="required">*</span></label>
                      <button type="button" className="btn-new-small" onClick={() => { setQuickAgentType('customer'); setQuickDataTarget('consignee'); setShowQuickAgentModal(true); }}>+ New</button>
                    </div>
                    <input
                      type="text"
                      value={consigneeSearch}
                      onChange={(e) => { setConsigneeSearch(e.target.value); setShowConsigneeDropdown(true); }}
                      onFocus={() => setShowConsigneeDropdown(true)}
                      placeholder="Type consignee code or name..."
                      disabled={saveLoading}
                    />
                    {showConsigneeDropdown && (
                      <div className="autocomplete-dropdown">
                        {customers.filter(c => `${c.code} ${c.name}`.toLowerCase().includes(consigneeSearch.toLowerCase()))
                          .map(c => (
                            <div key={c._id} className="autocomplete-item" onClick={() => handleConsigneeSelect(c)}>
                              <strong>{c.code}</strong> — {c.name}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>

                  <div className="input-group" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                      <label style={{ margin: 0 }}>Notify Party</label>
                      <button type="button" className="btn-new-small" onClick={() => { setQuickAgentType('customer'); setQuickDataTarget('notifyParty'); setShowQuickAgentModal(true); }}>+ New</button>
                    </div>
                    <input
                      type="text"
                      value={notifyPartySearch}
                      onChange={(e) => { setNotifyPartySearch(e.target.value); setShowNotifyPartyDropdown(true); }}
                      onFocus={() => setShowNotifyPartyDropdown(true)}
                      placeholder="Type notify party code or name..."
                      disabled={saveLoading}
                    />
                    {showNotifyPartyDropdown && (
                      <div className="autocomplete-dropdown">
                        {customers.filter(c => `${c.code} ${c.name}`.toLowerCase().includes(notifyPartySearch.toLowerCase()))
                          .map(c => (
                            <div key={c._id} className="autocomplete-item" onClick={() => handleNotifyPartySelect(c)}>
                              <strong>{c.code}</strong> — {c.name}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* B/L Details */}
              <div className="section">
                <h3>B/L Details</h3>
                <div className="form-grid">
                  <div className="input-group">
                    <label>BL Number <span className="required">*</span></label>
                    <input name="blNumber" value={formData.blNumber} onChange={handleChange} required placeholder="e.g. EXP-BL-2025-001" />
                  </div>

                  <div className="input-group">
                    <label>On Board Date <span className="required">*</span></label>
                    <input type="date" name="onBoardDate" value={formData.onBoardDate} onChange={handleChange} required />
                  </div>

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>For Delivery of Goods Please Apply To <span className="required">*</span></label>
                    <textarea
                      name="deliveryApplyTo"
                      value={formData.deliveryApplyTo}
                      onChange={handleChange}
                      rows={6}
                      required
                      placeholder="e.g. The consignee or their authorized agent..."
                    />
                  </div>
                </div>
              </div>

              {/* Shipment Details */}
              <div className="section">
                <h3>Shipment Details</h3>
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
                      disabled={saveLoading}
                    />
                    {showVesselDropdown && filteredVessels.length > 0 && (
                      <div className="autocomplete-dropdown">
                        {filteredVessels.map(v => (
                          <div key={v._id} className="autocomplete-item" onClick={() => handleVesselSelect(v)}>
                            <strong>{v.code}</strong> — {v.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="input-group">
                    <label>Voyage <span className="required">*</span></label>
                    <input
                      name="voyage"
                      value={formData.voyage}
                      onChange={handleChange}
                      placeholder="e.g. V.001"
                      required
                    />
                  </div>

                  <div className="input-group" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                      <label style={{ margin: 0 }}>Port of Loading <span className="required">*</span></label>
                      <button type="button" className="btn-new-small" onClick={() => { setQuickPortTarget('loading'); setShowQuickPortModal(true); }}>+ New</button>
                    </div>
                    <input
                      type="text"
                      value={portLoadingSearch}
                      onChange={(e) => { setPortLoadingSearch(e.target.value); setShowPortLoadingDropdown(true); }}
                      onFocus={() => setShowPortLoadingDropdown(true)}
                      placeholder="Type port code or name..."
                      disabled={saveLoading}
                    />
                    {showPortLoadingDropdown && (
                      <div className="autocomplete-dropdown">
                        {ports.filter(p => `${p.code} ${p.name}`.toLowerCase().includes(portLoadingSearch.toLowerCase()))
                          .map(p => (
                            <div key={p._id} className="autocomplete-item" onClick={() => handlePortLoadingSelect(p)}>
                              <strong>{p.code}</strong> — {p.name}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>

                  <div className="input-group" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                      <label style={{ margin: 0 }}>Port of Discharge <span className="required">*</span></label>
                      <button type="button" className="btn-new-small" onClick={() => { setQuickPortTarget('discharge'); setShowQuickPortModal(true); }}>+ New</button>
                    </div>
                    <input
                      type="text"
                      value={portDischargeSearch}
                      onChange={(e) => { setPortDischargeSearch(e.target.value); setShowPortDischargeDropdown(true); }}
                      onFocus={() => setShowPortDischargeDropdown(true)}
                      placeholder="Type port code or name..."
                      disabled={saveLoading}
                    />
                    {showPortDischargeDropdown && (
                      <div className="autocomplete-dropdown">
                        {ports.filter(p => `${p.code} ${p.name}`.toLowerCase().includes(portDischargeSearch.toLowerCase()))
                          .map(p => (
                            <div key={p._id} className="autocomplete-item" onClick={() => handlePortDischargeSelect(p)}>
                              <strong>{p.code}</strong> — {p.name}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>

                  <div className="input-group">
                    <label>Place of Delivery</label>
                    <input
                      name="placeDelivery"
                      value={formData.placeDelivery}
                      onChange={handleChange}
                      placeholder="e.g. Final destination / CFS / Warehouse"
                    />
                  </div>
                </div>
              </div>

              {/* Payment & B/L Info */}
              <div className="section">
                <h3>Payment & B/L Info</h3>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Freight Payable At</label>
                    <input name="freightPayableAt" value={formData.freightPayableAt} onChange={handleChange} placeholder="e.g. Colombo / Origin / Destination" />
                  </div>

                  <div className="input-group">
                    <label>Number of Original B/L's</label>
                    <input type="number" min="1" name="numOriginalBLs" value={formData.numOriginalBLs} onChange={handleChange} placeholder="e.g. 3" />
                  </div>
                </div>
              </div>

              {/* Cargo Details */}
              <div className="section">
                <h3>Cargo Details</h3>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Marks & Numbers</label>
                    <textarea name="marksNumbers" value={formData.marksNumbers} onChange={handleChange} rows={8} />
                  </div>

                  <div className="input-group">
                    <label>Container & Seal Numbers</label>
                    <textarea name="containerSealNumbers" value={formData.containerSealNumbers} onChange={handleChange} rows={8} />
                  </div>

                  <div className="input-group">
                    <label>No. of Packages</label>
                    <input type="number" min="0" name="numPackages" value={formData.numPackages} onChange={handleChange} />
                  </div>

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Description of Packages and Goods</label>
                    <textarea name="descriptionGoods" value={formData.descriptionGoods} onChange={handleChange} rows={12} />
                  </div>

                  <div className="input-group">
                    <label>Gross Weight (KG)</label>
                    <input type="number" step="0.01" min="0" name="grossWeight" value={formData.grossWeight} onChange={handleChange} />
                  </div>

                  <div className="input-group">
                    <label>Measurement (CBM)</label>
                    <input type="number" step="0.001" min="0" name="measurementCBM" value={formData.measurementCBM} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '3rem', textAlign: 'right' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saveLoading}
                  style={{ padding: '14px 48px', fontSize: '1.1rem' }}
                >
                  {saveLoading ? 'Saving...' : 'Save Export B/L'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    fetchExportJobs();
                    setShowPrintModal(true);
                  }}
                  style={{ padding: '14px 48px', fontSize: '1.1rem', marginLeft: '1rem', background: '#27ae60', color: 'white' }}
                >
                  Print Export B/L
                </button>
              </div>
            </form >
          </div >
        </div >
      </div >

      {/* Quick Add Modals */}
      {
        showQuickVesselModal && (
          <QuickVesselModal
            onClose={() => setShowQuickVesselModal(false)}
            onSave={handleQuickVesselSave}
          />
        )
      }

      {
        showQuickAgentModal && (
          <QuickAgentModal
            type={quickAgentType}
            onClose={() => setShowQuickAgentModal(false)}
            onSave={handleQuickAgentSave}
          />
        )
      }

      {showQuickPortModal && (
        <QuickPortModal
          onClose={() => setShowQuickPortModal(false)}
          onSave={handleQuickPortSave}
        />
      )}

      {showPrintModal && (
        <PrintSelectionModal
          jobs={exportJobs}
          onClose={() => setShowPrintModal(false)}
          onPrint={(job) => {
            generatePDF(job);
            setShowPrintModal(false);
          }}
        />
      )}
    </div>
  );
};

// Internal Modal Components (Simplified copies from JobMasterImport)
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
          <h2>Quick Add {type === 'agent' ? 'Agent' : 'Customer'}</h2>
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
          <button className="btn-primary" onClick={() => onSave(data)}>Add {type === 'agent' ? 'Agent' : 'Customer'}</button>
        </div>
      </div>
    </div>
  );
};

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

const PrintSelectionModal = ({ jobs, onClose, onPrint }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredJobs = jobs.filter(job =>
    job.blNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.jobNum?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.shipperId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%' }}>
        <div className="modal-header">
          <h2>Select Export Job to Print</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <input
            type="text"
            placeholder="Search by B/L No, Job No, or Shipper..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: '1rem', padding: '10px', width: '100%', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Job No</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>B/L No</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Shipper</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Consignee</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No jobs found</td>
                  </tr>
                ) : (
                  filteredJobs.map(job => (
                    <tr key={job._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{job.jobNum}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{job.blNumber}</td>
                      <td style={{ padding: '10px' }}>{job.shipperId?.name || '-'}</td>
                      <td style={{ padding: '10px' }}>{job.consigneeId?.name || '-'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          className="btn-primary"
                          onClick={() => onPrint(job)}
                          style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                        >
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
  );
};

export default Export;
