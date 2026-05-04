import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const PortOfLoadingInfo = ({ formData, setFormData, onNext, onPrevious }) => {
  const [loading, setLoading] = useState(false);
  const [seaDestinations, setSeaDestinations] = useState([]);

  const [portSearch, setPortSearch] = useState(
    formData.portOfLoadingCode && formData.portOfLoadingName
      ? `${formData.portOfLoadingCode} - ${formData.portOfLoadingName}`
      : formData.portOfLoadingName || ''
  );
  const [showPortDropdown, setShowPortDropdown] = useState(false);

  useEffect(() => {
    fetchSeaDestinations();
    if (formData.portOfLoadingCode && formData.portOfLoadingName) {
      setPortSearch(`${formData.portOfLoadingCode} - ${formData.portOfLoadingName}`);
    } else {
      setPortSearch(formData.portOfLoadingName || '');
    }
  }, [formData.portOfLoadingId]); // Trigger when ID changes (e.g. from parent sync)

  const fetchSeaDestinations = async () => {
    try {
      const res = await fetch('https://harbourb-production.up.railway.app/api/sea-destinations/getAllDestinations');
      const data = await res.json();
      if (data.success) setSeaDestinations(data.data);
    } catch (err) {
      toast.error('Failed to load ports');
    }
  };

  const handlePortSelect = (port) => {
    setFormData(prev => ({
      ...prev,
      portOfLoadingId: port._id,
      portOfLoadingName: port.name,
      portOfLoadingCode: port.code
    }));
    setPortSearch(`${port.code} - ${port.name}`);
    setShowPortDropdown(false);
  };

  const filteredPorts = seaDestinations.filter(p =>
    p.code.toLowerCase().includes(portSearch.toLowerCase()) ||
    p.name.toLowerCase().includes(portSearch.toLowerCase())
  );

  const handleNext = () => {
    if (!formData.portOfLoadingId || !formData.mblNumber) {
      toast.error('Port of Loading and MBL Number are required!');
      return;
    }
    onNext();
  };

  return (
    <div className="section">
      <h3>Port of Loading Information</h3>
      <div className="form-grid">

        <div className="input-group" style={{ position: 'relative' }}>
          <label>Port of Loading <span className="required">*</span></label>
          <input
            type="text"
            value={portSearch}
            onChange={(e) => {
              setPortSearch(e.target.value);
              setShowPortDropdown(true);
            }}
            onFocus={() => setShowPortDropdown(true)}
            placeholder="Type port code or name..."
            disabled={loading}
          />
          {showPortDropdown && (
            <div className="autocomplete-dropdown">
              {filteredPorts.map(port => (
                <div
                  key={port._id}
                  className="autocomplete-item"
                  onClick={() => handlePortSelect(port)}
                >
                  <strong>{port.code}</strong> — {port.name}
                </div>
              ))}
              {showPortDropdown && filteredPorts.length === 0 && (
                <div className="autocomplete-item no-result">No port found</div>
              )}
            </div>
          )}
        </div>

        <div className="input-group">
          <label>Port of Loading Name</label>
          <input
            value={formData.portOfLoadingName || ''}
            readOnly
            disabled
            style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)', fontWeight: '600' }}
          />
        </div>

        <div className="input-group">
          <label>MBL Number <span className="required">*</span></label>
          <input
            name="mblNumber"
            value={formData.mblNumber || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, mblNumber: e.target.value }))}
            placeholder="e.g. SIN123456789"
            disabled={loading}
          />
        </div>

      </div>

      <div className="form-actions" style={{ marginTop: '3rem' }}>
        <button type="button" className="btn-secondary" onClick={onPrevious}>
          ← Previous
        </button>

        <button type="button" className="btn-primary" onClick={handleNext}>
          Container Information
        </button>
      </div>
    </div>
  );
};

export default PortOfLoadingInfo;
