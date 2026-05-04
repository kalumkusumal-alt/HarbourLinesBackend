// frontend/src/pages/sea-freight/import/delivery-order/SubDetails.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const SubDetails = ({ formData, setFormData, onPrevious, onNext, loading }) => {
  const [hsCodeInput, setHsCodeInput] = useState('');
  const [hsNameInput, setHsNameInput] = useState('');

  const blTypes = ['House BL', 'Master BL'];
  const commodities = [
    'General Cargo', 'Cargo', 'Vehicle', 'Gasoline', 'Gas OIL', 
    'Gasoline/Gas OIL', 'Bulk', 'Garments'
  ];
  const freightTerms = ['PRE-PAID', 'COLLECT', 'FOB', 'CIF', 'EX-WORK'];
  const hblTerms = [
    'HOLD', 'EXPRESS RELEASE', 'ORIGINAL REQUIRED AT DESTINATION', 
    'SEAWAY BILL', 'SURRENDER BL', 'TELEX RELEASE', 'ORIGINAL'
  ];

  useEffect(() => {
    if (!formData.companyCode) {
      setFormData(prev => ({
        ...prev,
        companyCode: 'CMP0000001',
        companyName: 'HARBOUR LINES (PVT) LTD.',
        companyAddress: 'No. 94/1, Lauries Road',
        companyCity: 'COLOMBO 04',
        companyCountry: 'SRI LANKA',
        companyTel1: 'TEL : +94 11 4360210/0772',
        companyTel2: 'FAX : +94 11 2588012'
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addHsCode = () => {
    if (!hsCodeInput.trim() || !hsNameInput.trim()) {
      toast.error('Enter both HS Code and Name');
      return;
    }
    const newHs = { code: hsCodeInput.trim(), name: hsNameInput.trim() };
    setFormData(prev => ({
      ...prev,
      hsCodes: [...(prev.hsCodes || []), newHs]
    }));
    setHsCodeInput('');
    setHsNameInput('');
    toast.success('HS Code added');
  };

  const removeHsCode = (index) => {
    setFormData(prev => ({
      ...prev,
      hsCodes: prev.hsCodes.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    if (!formData.marksNumbers) return 'Marks and Numbers required';
    if (!formData.description) return 'Description required';
    if (!formData.grossWeight) return 'Gross Weight required';
    if (!formData.cbm) return 'CBM required';
    if (!formData.blType) return 'BL Type required';
    if (!formData.commodity) return 'Commodity required';
    if (!formData.freightTerm) return 'Freight Term required';
    if (!formData.hblTerm) return 'HBL Term required';
    return null;
  };

  const handleNext = () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    onNext();
  };

  return (
    <div className="section">
      <h3>Step 3: Sub Details</h3>

      {/* Cargo Details */}
      <div className="section-card">
        <h4>Cargo Details</h4>
        <div className="form-grid">
          <div className="input-group">
            <label>Marks and Numbers</label>
            <textarea name="marksNumbers" value={formData.marksNumbers || ''} onChange={handleChange} disabled={loading} style={{ height: '100px' }} />
          </div>

          <div className="input-group">
            <label>Description <span className="required">*</span></label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange} disabled={loading} style={{ height: '140px' }} required />
          </div>

          <div className="input-group">
            <label>Gross Weight (KG) <span className="required">*</span></label>
            <input type="number" name="grossWeight" value={formData.grossWeight || ''} onChange={handleChange} disabled={loading} min="0" />
          </div>

          <div className="input-group">
            <label>CBM (M³) <span className="required">*</span></label>
            <input type="number" step="0.001" name="cbm" value={formData.cbm || ''} onChange={handleChange} disabled={loading} min="0" />
          </div>

          <div className="input-group">
            <label>BL Type <span className="required">*</span></label>
            <select name="blType" value={formData.blType || ''} onChange={handleChange} disabled={loading}>
              <option value="">Select BL Type</option>
              {blTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Commodity <span className="required">*</span></label>
            <select name="commodity" value={formData.commodity || ''} onChange={handleChange} disabled={loading}>
              <option value="">Select Commodity</option>
              {commodities.map(com => (
                <option key={com} value={com}>{com}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Freight Term <span className="required">*</span></label>
            <select name="freightTerm" value={formData.freightTerm || ''} onChange={handleChange} disabled={loading}>
              <option value="">Select Term</option>
              {freightTerms.map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>HBL Term <span className="required">*</span></label>
            <select name="hblTerm" value={formData.hblTerm || ''} onChange={handleChange} disabled={loading}>
              <option value="">Select Term</option>
              {hblTerms.map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Rate (FOM)</label>
            <input type="text" name="rateFom" value={formData.rateFom || ''} onChange={handleChange} disabled={loading} />
          </div>

          <div className="input-group">
            <label>Empty Containers Return</label>
            <input type="text" name="emptyReturn" value={formData.emptyReturn || ''} onChange={handleChange} placeholder="Code - Name" disabled={loading} />
          </div>

          <div className="input-group">
            <label>Terminal (Pickup Place)</label>
            <input type="text" name="terminal" value={formData.terminal || ''} onChange={handleChange} disabled={loading} />
          </div>

          <div className="input-group">
            <label>Place of Receipt (Service Type)</label>
            <input type="text" name="placeOfReceipt" value={formData.placeOfReceipt || ''} onChange={handleChange} placeholder="Code - Name" disabled={loading} />
          </div>
        </div>
      </div>

      {/* HS Codes - Multiple */}
      <div className="section-card">
        <h4>HS Codes</h4>
        <div className="form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
          <div className="input-group">
            <label>HS Code</label>
            <input type="text" value={hsCodeInput} onChange={(e) => setHsCodeInput(e.target.value)} placeholder="e.g. 8703.23" disabled={loading} />
          </div>

          <div className="input-group">
            <label>HS Name</label>
            <input type="text" value={hsNameInput} onChange={(e) => setHsNameInput(e.target.value)} placeholder="e.g. Motor cars" disabled={loading} />
          </div>

          <div className="input-group" style={{ alignSelf: 'end' }}>
            <button type="button" className="btn-primary" onClick={addHsCode} style={{ height: '56px' }}>
              Add HS Code
            </button>
          </div>
        </div>

        {(formData.hsCodes || []).length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f9ff' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>HS Code</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>HS Name</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.hsCodes.map((hs, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '1rem' }}>{hs.code}</td>
                  <td style={{ padding: '1rem' }}>{hs.name}</td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => removeHsCode(idx)}
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

      {/* Company Details - Auto-filled */}
      <div className="section-card">
        <h4>Company Details</h4>
        <div className="form-grid">
          <div className="input-group">
            <label>Company Code</label>
            <input value={formData.companyCode || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4', fontWeight: '600' }} />
          </div>

          <div className="input-group">
            <label>Company Name</label>
            <input value={formData.companyName || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4', fontWeight: '600' }} />
          </div>

          <div className="input-group">
            <label>Address</label>
            <input value={formData.companyAddress || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>

          <div className="input-group">
            <label>City</label>
            <input value={formData.companyCity || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>

          <div className="input-group">
            <label>Country</label>
            <input value={formData.companyCountry || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>

          <div className="input-group">
            <label>Telephone 01</label>
            <input value={formData.companyTel1 || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>

          <div className="input-group">
            <label>Telephone 02</label>
            <input value={formData.companyTel2 || ''} readOnly disabled style={{ backgroundColor: '#f0fdf4' }} />
          </div>
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: '3rem' }}>
        <button type="button" className="btn-secondary" onClick={onPrevious}>
          ← Previous
        </button>

        <button type="button" className="btn-primary" onClick={handleNext}>
          Next: Preview & Submit →
        </button>
      </div>
    </div>
  );
};

export default SubDetails;