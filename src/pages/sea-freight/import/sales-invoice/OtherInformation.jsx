// frontend/src/pages/sea-freight/import/sales-invoice/OtherInformation.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const BANK_API = 'https://harbourb-production.up.railway.app/api/banks/getAllBanks';

const OtherInformation = ({ formData, setFormData, onPrevious, loading = false }) => {
  const [banks, setBanks] = useState([]);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await fetch(BANK_API);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('Bank API Response:', data); // ← Check this in console!

      if (data.success && Array.isArray(data.data)) {
        setBanks(data.data);
        if (data.data.length === 0) {
          toast.info('No banks found in database');
        }
      } else {
        toast.error('Invalid bank data format');
      }
    } catch (err) {
      console.error('Bank fetch error:', err);
      toast.error(`Failed to load banks: ${err.message}`);
    }
  };

  const handleBankSelect = (bank) => {
    // Log selected bank to see structure
    console.log('Selected Bank:', bank);

    setFormData(prev => ({
      ...prev,
      bankCode: bank.code || bank.bankCode || '',
      bankName: bank.name || bank.bankName || '',
      accountName: bank.accountName || bank.accName || bank.holderName || '',
      accountAddress: bank.address || bank.bankAddress || '',
      accountStreet: bank.street || bank.branchAddress || '',
      accountCity: bank.city || bank.branchCity || '',
      accountNumber: bank.accountNumber || bank.accNo || bank.accountNo || ''
    }));
    setBankSearch(`${bank.code || bank.bankCode} - ${bank.name || bank.bankName}`);
    setShowBankDropdown(false);
    toast.success(`Bank ${bank.name || bank.bankName} selected`);
  };

  const filteredBanks = banks.filter(bank =>
    (bank.code || bank.bankCode || '').toLowerCase().includes(bankSearch.toLowerCase()) ||
    (bank.name || bank.bankName || '').toLowerCase().includes(bankSearch.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.bankCode) {
      toast.error('Please select a bank');
      return;
    }

    toast.promise(
      fetch('https://harbourb-production.up.railway.app/sales-invoices/createInvoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(res => {
          if (!res.ok) throw new Error('Network error');
          return res.json();
        })
        .then(data => {
          if (!data.success) throw new Error(data.message || 'Failed');
          toast.success('Sales Invoice created successfully!');
          console.log('Created Invoice:', data.data);
        }),
      {
        loading: 'Creating Sales Invoice...',
        success: 'Invoice Created!',
        error: (err) => err.message || 'Failed to create invoice'
      }
    );
  };

  return (
    <div className="section">
      <h3>Step 3: Other Information</h3>

      <div className="section-card">
        <h4>Bank Information</h4>
        <div className="form-grid">
          <div className="input-group" style={{ position: 'relative', gridColumn: '1 / -1' }}>
            <label>Select Bank <span className="required">*</span></label>
            <input
              type="text"
              value={bankSearch}
              onChange={(e) => {
                setBankSearch(e.target.value);
                setShowBankDropdown(true);
              }}
              onFocus={() => setShowBankDropdown(true)}
              placeholder="Search by Bank Code or Name..."
              disabled={loading}
            />
            {showBankDropdown && (
              <div className="autocomplete-dropdown">
                {filteredBanks.length === 0 ? (
                  <div className="autocomplete-item no-result">
                    {banks.length === 0 ? 'Loading banks...' : 'No bank found'}
                  </div>
                ) : (
                  filteredBanks.map(bank => (
                    <div
                      key={bank._id}
                      className="autocomplete-item"
                      onClick={() => handleBankSelect(bank)}
                    >
                      <strong>{bank.code || bank.bankCode}</strong> — {bank.name || bank.bankName}
                      <br />
                      <small>
                        Acc: {bank.accountNumber || bank.accNo || 'N/A'} • {bank.city || bank.branchCity || ''}
                      </small>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Bank Code</label>
            <input value={formData.bankCode || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>
          <div className="input-group">
            <label>Bank Name</label>
            <input value={formData.bankName || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>
          <div className="input-group">
            <label>Account Name</label>
            <input value={formData.accountName || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>
          <div className="input-group">
            <label>Address</label>
            <input value={formData.accountAddress || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>
          <div className="input-group">
            <label>Street</label>
            <input value={formData.accountStreet || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>
          <div className="input-group">
            <label>City</label>
            <input value={formData.accountCity || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>
          <div className="input-group">
            <label>Account Number</label>
            <input value={formData.accountNumber || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4', fontWeight: 'bold' }} />
          </div>
        </div>
      </div>

      <div className="section-card">
        <h4>Additional Information</h4>
        <div className="form-grid">
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label>Payment Terms / Notes</label>
            <textarea
              name="paymentNotes"
              value={formData.paymentNotes || ''}
              onChange={handleChange}
              rows="4"
              placeholder="e.g. Payment within 30 days..."
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: '3rem' }}>
        <button type="button" className="btn-secondary" onClick={onPrevious} disabled={loading}>
          ← Previous
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading || !formData.bankCode}
        >
          {loading ? 'Submitting...' : 'Submit Invoice'}
        </button>
      </div>
    </div>
  );
};

export default OtherInformation;
