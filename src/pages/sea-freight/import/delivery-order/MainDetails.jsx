// frontend/src/pages/sea-freight/import/delivery-order/MainDetails.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const MainDetails = ({ formData, setFormData, onPrevious, onNext, selectedJob, loading }) => {
  const [customers, setCustomers] = useState([]);
  const [uom, setUom] = useState([]);
  const [users, setUsers] = useState([]);

  // Auto-suggest states
  const [portOfLoadingSearch, setPortOfLoadingSearch] = useState(formData.portOfLoadingName ? `${formData.portOfLoadingCode} - ${formData.portOfLoadingName}` : '');
  const [showPortOfLoadingDropdown, setShowPortOfLoadingDropdown] = useState(false);

  const [originAgentSearch, setOriginAgentSearch] = useState(formData.originAgentName ? `${formData.originAgentCode} - ${formData.originAgentName}` : '');
  const [showOriginAgentDropdown, setShowOriginAgentDropdown] = useState(false);

  const [carrierSearch, setCarrierSearch] = useState(formData.carrierName ? `${formData.carrierCode} - ${formData.carrierName}` : '');
  const [showCarrierDropdown, setShowCarrierDropdown] = useState(false);

  const [consigneeSearch, setConsigneeSearch] = useState(formData.consigneeName ? `${formData.consigneeCode} - ${formData.consigneeName}` : '');
  const [showConsigneeDropdown, setShowConsigneeDropdown] = useState(false);

  const [shipperSearch, setShipperSearch] = useState(formData.shipperName ? `${formData.shipperCode} - ${formData.shipperName}` : '');
  const [showShipperDropdown, setShowShipperDropdown] = useState(false);

  const [notifyPartySearch, setNotifyPartySearch] = useState(formData.notifyPartyName ? `${formData.notifyPartyCode} - ${formData.notifyPartyName}` : '');
  const [showNotifyPartyDropdown, setShowNotifyPartyDropdown] = useState(false);

  const [uomSearch, setUomSearch] = useState(formData.packageTypeName ? `${formData.packageTypeCode} - ${formData.packageTypeName}` : '');
  const [showUomDropdown, setShowUomDropdown] = useState(false);

  const [salesmanSearch, setSalesmanSearch] = useState(formData.salesmanName ? `${formData.salesmanCode} - ${formData.salesmanName}` : '');
  const [showSalesmanDropdown, setShowSalesmanDropdown] = useState(false);

  const [seaDestinations, setSeaDestinations] = useState([]);

  // Quick-Add Modal States
  const [showQuickAgentModal, setShowQuickAgentModal] = useState(false);
  const [showQuickUomModal, setShowQuickUomModal] = useState(false);
  const [quickAgentType, setQuickAgentType] = useState('agent');
  const [quickDataTarget, setQuickDataTarget] = useState(''); // originAgent, shipper, consignee, notifyParty

  // Container types for de-stuff and FCL
  const containerTypes = ['20ft', '40ft', 'Over 40ft'];

  // Number to words function
  const numberToWords = (n) => {
    if (n === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return n.toString(); // Fallback for larger numbers
  };

  useEffect(() => {
    fetchSeaDestinations();
    fetchCustomers();
    fetchUOM();
    fetchUsers();

    // Auto set DO Expires On to +7 days
    if (!formData.doExpiresOn) {
      const today = new Date();
      today.setDate(today.getDate() + 7);
      setFormData(prev => ({ ...prev, doExpiresOn: today.toISOString().slice(0, 16) }));
    }

    // Auto update packages in words
    if (formData.noOfPackages && formData.packageTypeName) {
      setFormData(prev => ({ ...prev, noOfPackagesWords: `${numberToWords(prev.noOfPackages)} ${prev.packageTypeName}` }));
    }
  }, [formData.noOfPackages, formData.packageTypeName]);

  const fetchSeaDestinations = async () => {
    try {
      const res = await fetch('https://harbourb-production.up.railway.app/api/sea-destinations/getAllDestinations');
      const data = await res.json();
      if (data.success) setSeaDestinations(data.data);
    } catch (err) {
      toast.error('Failed to load ports');
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('https://harbourb-production.up.railway.app/api/customersuppliers/getAllCustomerSuppliers');
      const data = await res.json();
      if (data.success) setCustomers(data.data);
    } catch (err) {
      toast.error('Failed to load customers');
    }
  };

  const fetchUOM = async () => {
    try {
      const res = await fetch('https://harbourb-production.up.railway.app/api/uoms/getAllUOMs'); // ← FIXED: plural 'uoms'
      const data = await res.json();
      if (data.success) setUom(data.data);
    } catch (err) {
      toast.error('Failed to load UOM');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('https://harbourb-production.up.railway.app/api/users/getAllUsers');
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) {
      toast.error('Failed to load users');
    }
  };

  // Auto-suggest handlers
  const handlePortOfLoadingSelect = (port) => {
    setFormData(prev => ({ ...prev, portOfLoadingId: port._id, portOfLoadingName: port.name, portOfLoadingCode: port.code }));
    setPortOfLoadingSearch(`${port.code} - ${port.name}`);
    setShowPortOfLoadingDropdown(false);
  };

  const handleOriginAgentSelect = (agent) => {
    setFormData(prev => ({ ...prev, originAgentId: agent._id, originAgentName: agent.name, originAgentCode: agent.code }));
    setOriginAgentSearch(`${agent.code} - ${agent.name}`);
    setShowOriginAgentDropdown(false);
  };

  const handleCarrierSelect = (carrier) => {
    setFormData(prev => ({ ...prev, carrierId: carrier._id, carrierName: carrier.name, carrierCode: carrier.code }));
    setCarrierSearch(`${carrier.code} - ${carrier.name}`);
    setShowCarrierDropdown(false);
  };

  const handleConsigneeSelect = (cust) => {
    setFormData(prev => ({
      ...prev,
      consigneeId: cust._id,
      consigneeCode: cust.code,
      consigneeName: cust.name,
      consigneeAddress: cust.address || '',
      consigneeStreet: cust.street || '',
      consigneeCountry: cust.country || ''
    }));
    setConsigneeSearch(`${cust.code} - ${cust.name}`);
    setShowConsigneeDropdown(false);
  };

  const handleShipperSelect = (cust) => {
    setFormData(prev => ({
      ...prev,
      shipperId: cust._id,
      shipperCode: cust.code,
      shipperName: cust.name,
      shipperAddress: cust.address || '',
      shipperStreet: cust.street || '',
      shipperCountry: cust.country || ''
    }));
    setShipperSearch(`${cust.code} - ${cust.name}`);
    setShowShipperDropdown(false);
  };

  const handleNotifyPartySelect = (cust) => {
    setFormData(prev => ({
      ...prev,
      notifyPartyId: cust._id,
      notifyPartyCode: cust.code,
      notifyPartyName: cust.name,
      notifyPartyAddress: cust.address || '',
      notifyPartyStreet: cust.street || '',
      notifyPartyCountry: cust.country || ''
    }));
    setNotifyPartySearch(`${cust.code} - ${cust.name}`);
    setShowNotifyPartyDropdown(false);
  };

  const handleUomSelect = (item) => {
    setFormData(prev => ({ ...prev, packageTypeCode: item.code, packageTypeName: item.name }));
    setUomSearch(`${item.code} - ${item.name}`);
    setShowUomDropdown(false);
  };

  const handleSalesmanSelect = (user) => {
    setFormData(prev => ({ ...prev, salesmanId: user._id, salesmanName: user.username, salesmanCode: user.code }));
    setSalesmanSearch(`${user.code} - ${user.username}`);
    setShowSalesmanDropdown(false);
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
        if (quickDataTarget === 'originAgent') handleOriginAgentSelect(agent);
        else if (quickDataTarget === 'carrier') handleCarrierSelect(agent);
        else if (quickDataTarget === 'shipper') handleShipperSelect(agent);
        else if (quickDataTarget === 'consignee') handleConsigneeSelect(agent);
        else if (quickDataTarget === 'notifyParty') handleNotifyPartySelect(agent);

        setShowQuickAgentModal(false);
        toast.success('Added and selected!');
      } else throw new Error(data.message);
    } catch (err) {
      toast.error(err.message || 'Failed to add entry');
    }
  };

  const handleQuickUomSave = async (quickData) => {
    try {
      const res = await fetch('https://harbourb-production.up.railway.app/api/uoms/createUOM', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...quickData, type: 'inventory' })
      });
      const data = await res.json();
      if (data.success) {
        await fetchUOM();
        handleUomSelect(data.data);
        setShowQuickUomModal(false);
        toast.success('UOM added and selected!');
      } else throw new Error(data.message);
    } catch (err) {
      toast.error(err.message || 'Failed to add UOM');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validate = () => {
    if (!formData.portOfLoadingId) return 'Port of Loading is required';
    if (!formData.originAgentId) return 'Origin Agent is required';
    if (!formData.carrierId) return 'Carrier is required';
    if (!formData.consigneeId) return 'Consignee is required';
    if (!formData.shipperId) return 'Shipper is required';
    if (formData.notifyPartyEnabled && !formData.notifyPartyId) return 'Notify Party is required when enabled';
    if (!formData.doExpiresOn) return 'DO Expires On is required';
    if (!formData.noOfPackages) return 'No of Packages is required';
    if (!formData.packageTypeName) return 'Package Type is required';
    if (!formData.revenueType) return 'Revenue Type is required';
    if (!formData.salesmanId) return 'Salesman is required';
    return null;
  };

  const handleNextStep = () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    onNext();
  };

  return (
    <div className="section">
      <h3>Step 2: Main Details</h3>

      {/* HBL Information - SEPARATE CARD */}
      <div className="section-card">
        <h4>HBL Information</h4>
        <div className="form-grid">
          <div className="input-group" style={{ position: 'relative' }}>
            <label>Port of Loading <span className="required">*</span></label>
            <input
              type="text"
              value={portOfLoadingSearch}
              onChange={(e) => {
                setPortOfLoadingSearch(e.target.value);
                setShowPortOfLoadingDropdown(true);
              }}
              onFocus={() => setShowPortOfLoadingDropdown(true)}
              placeholder="Type code or name..."
              disabled={loading}
            />
            {showPortOfLoadingDropdown && (
              <div className="autocomplete-dropdown">
                {seaDestinations
                  .filter(p =>
                    p.code.toLowerCase().includes(portOfLoadingSearch.toLowerCase()) ||
                    p.name.toLowerCase().includes(portOfLoadingSearch.toLowerCase())
                  )
                  .map(port => (
                    <div
                      key={port._id}
                      className="autocomplete-item"
                      onClick={() => handlePortOfLoadingSelect(port)}
                    >
                      <strong>{port.code}</strong> — {port.name}
                    </div>
                  ))
                }
                {seaDestinations.filter(p =>
                  p.code.toLowerCase().includes(portOfLoadingSearch.toLowerCase()) ||
                  p.name.toLowerCase().includes(portOfLoadingSearch.toLowerCase())
                ).length === 0 && (
                    <div className="autocomplete-item no-result">No port found</div>
                  )}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Port of Loading Name</label>
            <input value={formData.portOfLoadingName} readOnly disabled style={{ backgroundColor: '#f0fdf4', color: '#166534', fontWeight: '600' }} />
          </div>

          <div className="input-group" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
              <label style={{ margin: 0 }}>Origin Agent <span className="required">*</span></label>
              <button type="button" className="btn-new-small" onClick={() => { setQuickAgentType('supplier'); setQuickDataTarget('originAgent'); setShowQuickAgentModal(true); }}>+ New</button>
            </div>
            <input
              type="text"
              value={originAgentSearch}
              onChange={(e) => {
                setOriginAgentSearch(e.target.value);
                setShowOriginAgentDropdown(true);
              }}
              onFocus={() => setShowOriginAgentDropdown(true)}
              placeholder="Type code or name..."
              disabled={loading}
            />
            {showOriginAgentDropdown && (
              <div className="autocomplete-dropdown">
                {customers
                  .filter(c =>
                    c.code.toLowerCase().includes(originAgentSearch.toLowerCase()) ||
                    c.name.toLowerCase().includes(originAgentSearch.toLowerCase())
                  )
                  .map(agent => (
                    <div
                      key={agent._id}
                      className="autocomplete-item"
                      onClick={() => handleOriginAgentSelect(agent)}
                    >
                      <strong>{agent.code}</strong> — {agent.name}
                    </div>
                  ))
                }
                {customers.filter(c =>
                  c.code.toLowerCase().includes(originAgentSearch.toLowerCase()) ||
                  c.name.toLowerCase().includes(originAgentSearch.toLowerCase())
                ).length === 0 && (
                    <div className="autocomplete-item no-result">No agent found</div>
                  )}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Origin Agent Name</label>
            <input value={formData.originAgentName} readOnly disabled style={{ backgroundColor: '#fefce8', color: '#854d0e', fontWeight: '600' }} />
          </div>

          <div className="input-group" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
              <label style={{ margin: 0 }}>Carrier <span className="required">*</span></label>
              <button type="button" className="btn-new-small" onClick={() => { setQuickAgentType('supplier'); setQuickDataTarget('carrier'); setShowQuickAgentModal(true); }}>+ New</button>
            </div>
            <input
              type="text"
              value={carrierSearch}
              onChange={(e) => {
                setCarrierSearch(e.target.value);
                setShowCarrierDropdown(true);
              }}
              onFocus={() => setShowCarrierDropdown(true)}
              placeholder="Type code or name..."
              disabled={loading}
            />
            {showCarrierDropdown && (
              <div className="autocomplete-dropdown">
                {customers
                  .filter(c =>
                    c.code.toLowerCase().includes(carrierSearch.toLowerCase()) ||
                    c.name.toLowerCase().includes(carrierSearch.toLowerCase())
                  )
                  .map(carrier => (
                    <div
                      key={carrier._id}
                      className="autocomplete-item"
                      onClick={() => handleCarrierSelect(carrier)}
                    >
                      <strong>{carrier.code}</strong> — {carrier.name}
                    </div>
                  ))
                }
                {customers.filter(c =>
                  c.code.toLowerCase().includes(carrierSearch.toLowerCase()) ||
                  c.name.toLowerCase().includes(carrierSearch.toLowerCase())
                ).length === 0 && (
                    <div className="autocomplete-item no-result">No carrier found</div>
                  )}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Carrier Name</label>
            <input value={formData.carrierName} readOnly disabled style={{ backgroundColor: '#fef3c7', color: '#92400e', fontWeight: '600' }} />
          </div>
        </div>
      </div>

      {/* Parties*/}
      <div className="section-card">
        <h4>Parties</h4>
        {/* Consignee */}
        <div className="form-grid">
          <div className="input-group" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
              <label style={{ margin: 0 }}>Consignee <span className="required">*</span></label>
              <button type="button" className="btn-new-small" onClick={() => { setQuickAgentType('customer'); setQuickDataTarget('consignee'); setShowQuickAgentModal(true); }}>+ New</button>
            </div>
            <input
              type="text"
              value={consigneeSearch}
              onChange={(e) => {
                setConsigneeSearch(e.target.value);
                setShowConsigneeDropdown(true);
              }}
              onFocus={() => setShowConsigneeDropdown(true)}
              placeholder="Type code or name..."
              disabled={loading}
            />
            {showConsigneeDropdown && (
              <div className="autocomplete-dropdown">
                {customers
                  .filter(c =>
                    c.code.toLowerCase().includes(consigneeSearch.toLowerCase()) ||
                    c.name.toLowerCase().includes(consigneeSearch.toLowerCase())
                  )
                  .map(cust => (
                    <div
                      key={cust._id}
                      className="autocomplete-item"
                      onClick={() => handleConsigneeSelect(cust)}
                    >
                      <strong>{cust.code}</strong> — {cust.name}
                    </div>
                  ))
                }
                {customers.filter(c =>
                  c.code.toLowerCase().includes(consigneeSearch.toLowerCase()) ||
                  c.name.toLowerCase().includes(consigneeSearch.toLowerCase())
                ).length === 0 && (
                    <div className="autocomplete-item no-result">No consignee found</div>
                  )}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Consignee Code</label>
            <input value={formData.consigneeCode || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4', fontWeight: '600' }} />
          </div>
          <div className="input-group">
            <label>Consignee Name</label>
            <input value={formData.consigneeName || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4', fontWeight: '600' }} />
          </div>
          <div className="input-group">
            <label>Consignee Address</label>
            <input value={formData.consigneeAddress || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>
          <div className="input-group">
            <label>Consignee Street</label>
            <input value={formData.consigneeStreet || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>
          <div className="input-group">
            <label>Consignee Country</label>
            <input value={formData.consigneeCountry || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>
        </div>

        {/* SEPARATOR LINE */}
        <hr className="party-separator" />

        {/* Shipper */}
        <div className="form-grid">
          <div className="input-group" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
              <label style={{ margin: 0 }}>Shipper <span className="required">*</span></label>
              <button type="button" className="btn-new-small" onClick={() => { setQuickAgentType('customer'); setQuickDataTarget('shipper'); setShowQuickAgentModal(true); }}>+ New</button>
            </div>
            <input
              type="text"
              value={shipperSearch}
              onChange={(e) => {
                setShipperSearch(e.target.value);
                setShowShipperDropdown(true);
              }}
              onFocus={() => setShowShipperDropdown(true)}
              placeholder="Type code or name..."
              disabled={loading}
            />
            {showShipperDropdown && (
              <div className="autocomplete-dropdown">
                {customers
                  .filter(c =>
                    c.code.toLowerCase().includes(shipperSearch.toLowerCase()) ||
                    c.name.toLowerCase().includes(shipperSearch.toLowerCase())
                  )
                  .map(cust => (
                    <div
                      key={cust._id}
                      className="autocomplete-item"
                      onClick={() => handleShipperSelect(cust)}
                    >
                      <strong>{cust.code}</strong> — {cust.name}
                    </div>
                  ))
                }
                {customers.filter(c =>
                  c.code.toLowerCase().includes(shipperSearch.toLowerCase()) ||
                  c.name.toLowerCase().includes(shipperSearch.toLowerCase())
                ).length === 0 && (
                    <div className="autocomplete-item no-result">No shipper found</div>
                  )}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Shipper Code</label>
            <input value={formData.shipperCode || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4', fontWeight: '600' }} />
          </div>
          <div className="input-group">
            <label>Shipper Name</label>
            <input value={formData.shipperName || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4', fontWeight: '600' }} />
          </div>
          <div className="input-group">
            <label>Shipper Address</label>
            <input value={formData.shipperAddress || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>
          <div className="input-group">
            <label>Shipper Street</label>
            <input value={formData.shipperStreet || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>
          <div className="input-group">
            <label>Shipper Country</label>
            <input value={formData.shipperCountry || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>
        </div>

        {/* Notify Party Checkbox */}
        <div className="input-group" style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem' }}>
            <input
              type="checkbox"
              name="notifyPartyEnabled"
              checked={formData.notifyPartyEnabled}
              onChange={handleChange}
              style={{
                width: '24px',
                height: '24px',
                accentColor: '#3b82f6',
                cursor: 'pointer'
              }}
            />
            <span style={{ fontWeight: '700' }}>
              Notify Party (check if applicable)
            </span>
          </label>
        </div>

        {formData.notifyPartyEnabled && (
          <>
            <hr className="party-separator" />

            <div className="form-grid">
              <div className="input-group" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                  <label style={{ margin: 0 }}>Notify Party <span className="required">*</span></label>
                  <button type="button" className="btn-new-small" onClick={() => { setQuickAgentType('customer'); setQuickDataTarget('notifyParty'); setShowQuickAgentModal(true); }}>+ New</button>
                </div>
                <input
                  type="text"
                  value={notifyPartySearch}
                  onChange={(e) => {
                    setNotifyPartySearch(e.target.value);
                    setShowNotifyPartyDropdown(true);
                  }}
                  onFocus={() => setShowNotifyPartyDropdown(true)}
                  placeholder="Type code or name..."
                  disabled={loading}
                />
                {showNotifyPartyDropdown && (
                  <div className="autocomplete-dropdown">
                    {customers
                      .filter(c =>
                        c.code.toLowerCase().includes(notifyPartySearch.toLowerCase()) ||
                        c.name.toLowerCase().includes(notifyPartySearch.toLowerCase())
                      )
                      .map(cust => (
                        <div
                          key={cust._id}
                          className="autocomplete-item"
                          onClick={() => handleNotifyPartySelect(cust)}
                        >
                          <strong>{cust.code}</strong> — {cust.name}
                        </div>
                      ))
                    }
                    {customers.filter(c =>
                      c.code.toLowerCase().includes(notifyPartySearch.toLowerCase()) ||
                      c.name.toLowerCase().includes(notifyPartySearch.toLowerCase())
                    ).length === 0 && (
                        <div className="autocomplete-item no-result">No party found</div>
                      )}
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>Notify Party Code</label>
                <input value={formData.notifyPartyCode || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4', fontWeight: '600' }} />
              </div>
              <div className="input-group">
                <label>Notify Party Name</label>
                <input value={formData.notifyPartyName || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4', fontWeight: '600' }} />
              </div>
              <div className="input-group">
                <label>Notify Party Address</label>
                <input value={formData.notifyPartyAddress || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
              </div>
              <div className="input-group">
                <label>Notify Party Street</label>
                <input value={formData.notifyPartyStreet || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
              </div>
              <div className="input-group">
                <label>Notify Party Country</label>
                <input value={formData.notifyPartyCountry || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* DO Details - SEPARATE CARD */}
      <div className="section-card">
        <h4>DO Details</h4>
        <div className="form-grid">
          <div className="input-group">
            <label>DO Expires On <span className="required">*</span></label>
            <input type="datetime-local" name="doExpiresOn" value={formData.doExpiresOn} onChange={handleChange} disabled={loading} />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '45px' }}>
              <input
                type="checkbox"
                name="displayDoExpires"
                checked={formData.displayDoExpires}
                onChange={handleChange}
                style={{
                  width: '24px',
                  height: '24px',
                  accentColor: '#3b82f6',
                  cursor: 'pointer'
                }}
              />
              <span>Display DO Expires Date</span>
            </label>
          </div>

          <div className="input-group">
            <label>Dangerous Cargo No. of Days</label>
            <input type="number" name="dangerousCargoDays" value={formData.dangerousCargoDays} onChange={handleChange} disabled={loading} min="0" />
          </div>

          <div className="input-group">
            <label>Dangerous Cargo Group</label>
            <input
              type="number"
              name="dangerousCargoGroup"
              value={formData.dangerousCargoGroup || ''}
              onChange={handleChange}
              placeholder="e.g. Group 4.1 Flammable solids"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Date of Landing</label>
            <input type="date" name="dateOfLanding" value={formData.dateOfLanding} onChange={handleChange} disabled={loading} />
          </div>
        </div>
      </div>

      <div className="section-card">
        <h4>De-Stuff Containers</h4>
        <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
          <div className="input-group">
            <label>Container Type</label>
            <select
              value={formData.tempDeStuffType || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, tempDeStuffType: e.target.value }))}
              disabled={loading}
            >
              <option value="">Select Type</option>
              {containerTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>No. of Containers</label>
            <input
              type="number"
              value={formData.tempDeStuffCount || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, tempDeStuffCount: e.target.value }))}
              min="1"
              placeholder="e.g. 1"
              disabled={loading}
            />
          </div>

          <div className="input-group" style={{ alignSelf: 'end' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (!formData.tempDeStuffType || !formData.tempDeStuffCount) {
                  toast.error('Select type and enter count');
                  return;
                }
                const newEntry = { type: formData.tempDeStuffType, count: parseInt(formData.tempDeStuffCount) };
                setFormData(prev => ({
                  ...prev,
                  deStuffContainers: [...(prev.deStuffContainers || []), newEntry],
                  tempDeStuffType: '',
                  tempDeStuffCount: ''
                }));
                toast.success('De-Stuff entry added');
              }}
              style={{ height: '56px' }}
            >
              Add De-Stuff
            </button>
          </div>
        </div>
        {/* Table */}
        {(formData.deStuffContainers || []).length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f9ff' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Count</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.deStuffContainers.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '1rem' }}>{item.type}</td>
                  <td style={{ padding: '1rem' }}>{item.count}</td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          deStuffContainers: prev.deStuffContainers.filter((_, i) => i !== idx)
                        }));
                      }}
                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px' }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* FCL Containers  */}
      <div className="section-card">
        <h4>No of FCL Containers</h4>
        <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
          <div className="input-group">
            <label>Container Type</label>
            <select
              value={formData.tempFclType || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, tempFclType: e.target.value }))}
              disabled={loading}
            >
              <option value="">Select Type</option>
              {containerTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>No. of Containers</label>
            <input
              type="number"
              value={formData.tempFclCount || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, tempFclCount: e.target.value }))}
              min="1"
              placeholder="e.g. 2"
              disabled={loading}
            />
          </div>

          <div className="input-group" style={{ alignSelf: 'end' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (!formData.tempFclType || !formData.tempFclCount) {
                  toast.error('Select type and enter count');
                  return;
                }
                const newEntry = { type: formData.tempFclType, count: parseInt(formData.tempFclCount) };
                setFormData(prev => ({
                  ...prev,
                  fclContainers: [...(prev.fclContainers || []), newEntry],
                  tempFclType: '',
                  tempFclCount: ''
                }));
                toast.success('FCL entry added');
              }}
              style={{ height: '56px' }}
            >
              Add FCL
            </button>
          </div>
        </div>

        {/* Table */}
        {(formData.fclContainers || []).length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f9ff' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Count</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.fclContainers.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '1rem' }}>{item.type}</td>
                  <td style={{ padding: '1rem' }}>{item.count}</td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          fclContainers: prev.fclContainers.filter((_, i) => i !== idx)
                        }));
                      }}
                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px' }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Package Details - SEPARATE CARD */}
      <div className="section-card">
        <h4>Package Details</h4>
        <div className="form-grid">
          <div className="input-group">
            <label>No of Packages <span className="required">*</span></label>
            <input type="number" name="noOfPackages" value={formData.noOfPackages} onChange={handleChange} disabled={loading} min="0" />
          </div>

          <div className="input-group" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
              <label style={{ margin: 0 }}>Package Type (UOM) <span className="required">*</span></label>
              <button type="button" className="btn-new-small" onClick={() => setShowQuickUomModal(true)}>+ New</button>
            </div>
            <input
              type="text"
              value={uomSearch}
              onChange={(e) => {
                setUomSearch(e.target.value);
                setShowUomDropdown(true);
              }}
              onFocus={() => setShowUomDropdown(true)}
              placeholder="Type code or name..."
              disabled={loading}
            />
            {showUomDropdown && (
              <div className="autocomplete-dropdown">
                {uom
                  .filter(item =>
                    item.code.toLowerCase().includes(uomSearch.toLowerCase()) ||
                    item.name.toLowerCase().includes(uomSearch.toLowerCase())
                  )
                  .map(item => (
                    <div
                      key={item._id}
                      className="autocomplete-item"
                      onClick={() => handleUomSelect(item)}
                    >
                      <strong>{item.code}</strong> — {item.name}
                    </div>
                  ))
                }
                {uom.filter(item =>
                  item.code.toLowerCase().includes(uomSearch.toLowerCase()) ||
                  item.name.toLowerCase().includes(uomSearch.toLowerCase())
                ).length === 0 && (
                    <div className="autocomplete-item no-result">No UOM found</div>
                  )}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>No of Packages (Words)</label>
            <input value={formData.noOfPackagesWords} readOnly disabled style={{ backgroundColor: '#f0fdf4', fontWeight: '600' }} />
          </div>
        </div>
      </div>

      {/* Other Dates - SEPARATE CARD */}
      <div className="section-card">
        <h4>Other Dates</h4>
        <div className="form-grid">
          <div className="input-group">
            <label>Master BL Collect Date</label>
            <input type="date" name="masterBlCollectDate" value={formData.masterBlCollectDate} onChange={handleChange} disabled={loading || !formData.masterBlCollectEnabled} />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '45px' }}>
              <input
                type="checkbox"
                name="masterBlCollectEnabled"
                checked={formData.masterBlCollectEnabled}
                onChange={handleChange}
                style={{
                  width: '24px',
                  height: '24px',
                  accentColor: '#3b82f6',
                  cursor: 'pointer'
                }}
              />
              <span>Enable Master BL Collect Date</span>
            </label>
          </div>

          <div className="input-group">
            <label>Doc. Release Date</label>
            <input type="date" name="docReleaseDate" value={formData.docReleaseDate} onChange={handleChange} disabled={loading || !formData.docReleaseEnabled} />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                name="docReleaseEnabled"
                checked={formData.docReleaseEnabled}
                onChange={handleChange}
                style={{
                  width: '24px',
                  height: '24px',
                  accentColor: '#3b82f6',
                  cursor: 'pointer'
                }}
              />
              <span>Enable Doc. Release Date</span>
            </label>
          </div>
        </div>
      </div>

      {/* Additional Information - SEPARATE CARD */}
      <div className="section-card">
        <h4>Additional Information</h4>
        <div className="form-grid">
          <div className="input-group">
            <label>Remarks</label>
            <textarea name="remarks" value={formData.remarks} onChange={handleChange} disabled={loading} style={{ height: '120px' }} />
          </div>

          <div className="input-group">
            <label>Main Line</label>
            <input name="mainLine" value={formData.mainLine} onChange={handleChange} disabled={loading} />
          </div>

          <div className="input-group">
            <label>TIN No of Owner</label>
            <input name="tinNoOwner" value={formData.tinNoOwner} onChange={handleChange} disabled={loading} />
          </div>

          <div className="input-group">
            <label>Revenue Type <span className="required">*</span></label>
            <select name="revenueType" value={formData.revenueType} onChange={handleChange} disabled={loading}>
              <option value="Nomination">Nomination</option>
              <option value="Free Hand">Free Hand</option>
            </select>
          </div>

          <div className="input-group" style={{ position: 'relative' }}>
            <label>Salesman <span className="required">*</span></label>
            <input
              type="text"
              value={salesmanSearch}
              onChange={(e) => {
                setSalesmanSearch(e.target.value);
                setShowSalesmanDropdown(true);
              }}
              onFocus={() => setShowSalesmanDropdown(true)}
              placeholder="Type code or name..."
              disabled={loading}
            />
            {showSalesmanDropdown && (
              <div className="autocomplete-dropdown">
                {users
                  .filter(u =>
                    u.code.toLowerCase().includes(salesmanSearch.toLowerCase()) ||
                    u.username.toLowerCase().includes(salesmanSearch.toLowerCase())
                  )
                  .map(user => (
                    <div
                      key={user._id}
                      className="autocomplete-item"
                      onClick={() => handleSalesmanSelect(user)}
                    >
                      <strong>{user.code}</strong> — {user.username}
                    </div>
                  ))
                }
                {users.filter(u =>
                  u.code.toLowerCase().includes(salesmanSearch.toLowerCase()) ||
                  u.username.toLowerCase().includes(salesmanSearch.toLowerCase())
                ).length === 0 && (
                    <div className="autocomplete-item no-result">No salesman found</div>
                  )}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Salesman Name</label>
            <input value={formData.salesmanName} readOnly disabled style={{ backgroundColor: '#f0fdf4', color: '#166534', fontWeight: '600' }} />
          </div>
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: '3rem' }}>
        <button type="button" className="btn-secondary" onClick={onPrevious}>
          ← Previous
        </button>

        <button type="button" className="btn-primary" onClick={handleNextStep}>
          Next: Sub Details →
        </button>
      </div>
      {/* Quick Add Modals */}
      {showQuickAgentModal && (
        <QuickAgentModal
          type={quickAgentType}
          onClose={() => setShowQuickAgentModal(false)}
          onSave={handleQuickAgentSave}
        />
      )}

      {showQuickUomModal && (
        <QuickUomModal
          onClose={() => setShowQuickUomModal(false)}
          onSave={handleQuickUomSave}
        />
      )}
    </div>
  );
};

// Internal Modal Components
const QuickAgentModal = ({ type, onClose, onSave }) => {
  const [data, setData] = useState({ code: '', name: '', address: '' });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Quick Add {type === 'agent' ? 'Agent' : (type === 'carrier' ? 'Carrier' : 'Customer')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="input-group">
              <label>Code *</label>
              <input value={data.code} onChange={e => setData({ ...data, code: e.target.value.toUpperCase() })} placeholder="e.g. CUST001" />
            </div>
            <div className="input-group">
              <label>Name *</label>
              <input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder="e.g. John Doe" />
            </div>
            <div className="input-group">
              <label>Address</label>
              <input value={data.address} onChange={e => setData({ ...data, address: e.target.value })} placeholder="Enter address..." />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(data)}>Save Entry</button>
        </div>
      </div>
    </div>
  );
};

const QuickUomModal = ({ onClose, onSave }) => {
  const [data, setData] = useState({ code: '', name: '' });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Quick Add Package Type (UOM)</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="input-group">
              <label>UOM Code *</label>
              <input value={data.code} onChange={e => setData({ ...data, code: e.target.value.toUpperCase() })} placeholder="e.g. PLT" />
            </div>
            <div className="input-group">
              <label>UOM Name *</label>
              <input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder="e.g. Pallets" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(data)}>Add UOM</button>
        </div>
      </div>
    </div>
  );
};

export default MainDetails;
