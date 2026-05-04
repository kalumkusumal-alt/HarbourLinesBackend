// frontend/src/pages/sea-freight/import/sales-invoice/InvoiceDetails.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CHARGES_API = 'https://harbourb-production.up.railway.app/api/charges/getAllCharges';
const TAX_API = 'https://harbourb-production.up.railway.app/api/taxes/getAllTaxes';
const CURRENCY_API = 'https://harbourb-production.up.railway.app/api/currencies/getAllCurrencies';
const UOM_API = 'https://harbourb-production.up.railway.app/api/uoms/getAllUOMs';

const InvoiceDetails = ({ formData, setFormData, onPrevious, onNext, loading }) => {
  const [charges, setCharges] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [uoms, setUoms] = useState([]);

  const [chargeSearch, setChargeSearch] = useState('');
  const [showChargeDropdown, setShowChargeDropdown] = useState(false);

  const [currentLine, setCurrentLine] = useState({
    chargeCode: '',
    chargeName: '',
    currency: formData.currency || 'LKR',
    amount: '',
    uom: '',
    rate: '',
    curValue: '',
    exRate: '1.00',
    value: '',
    tax1Code: '',
    tax1Rate: '',
    tax1Value: '',
    tax2Code: '',
    tax2Rate: '',
    tax2Value: '',
    narration: '',
    round: '0',
    curNetValue: '',
    netValue: '',
    serialNo: ''
  });

  useEffect(() => {
    fetchCharges();
    fetchTaxes();
    fetchCurrencies();
    fetchUOMs();
  }, []);

  const fetchCharges = async () => {
    try {
      const res = await fetch(CHARGES_API);
      const data = await res.json();
      if (data.success) setCharges(data.data);
    } catch (err) {
      toast.error('Failed to load charges');
    }
  };

  const fetchTaxes = async () => {
    try {
      const res = await fetch(TAX_API);
      const data = await res.json();
      if (data.success) setTaxes(data.data);
    } catch (err) {
      toast.error('Failed to load taxes');
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

  const fetchUOMs = async () => {
    try {
      const res = await fetch(UOM_API);
      const data = await res.json();
      if (data.success) setUoms(data.data);
    } catch (err) {
      toast.error('Failed to load UOM');
    }
  };

  const handleChargeSelect = (charge) => {
    setCurrentLine(prev => ({
      ...prev,
      chargeCode: charge.code,
      chargeName: charge.name,
      rate: charge.rate.toString(),
      narration: charge.name,
      // Reset calculated fields to trigger auto-calc
      curValue: '',
      value: '',
      tax1Value: '',
      tax2Value: '',
      curNetValue: '',
      netValue: ''
    }));
    setChargeSearch(`${charge.code} - ${charge.name}`);
    setShowChargeDropdown(false);
  };

  // Auto-calculate only when inputs change and fields are empty (not manually overridden)
  useEffect(() => {
    if (currentLine.amount && currentLine.rate) {
      const curVal = parseFloat(currentLine.amount) * parseFloat(currentLine.rate);
      const val = curVal * parseFloat(currentLine.exRate || 1);

      let tax1Val = 0;
      if (currentLine.tax1Rate) {
        tax1Val = val * (parseFloat(currentLine.tax1Rate) / 100);
      }

      let tax2Val = 0;
      if (currentLine.tax2Rate) {
        tax2Val = val * (parseFloat(currentLine.tax2Rate) / 100);
      }

      let net = val + tax1Val + tax2Val;

      const roundAmount = parseInt(currentLine.round || 0);
      const rounded = roundAmount > 0 ? Math.round(net / roundAmount) * roundAmount : net;

      setCurrentLine(prev => ({
        ...prev,
        curValue: prev.curValue === '' ? curVal.toFixed(2) : prev.curValue,
        value: prev.value === '' ? val.toFixed(2) : prev.value,
        tax1Value: prev.tax1Value === '' ? tax1Val.toFixed(2) : prev.tax1Value,
        tax2Value: prev.tax2Value === '' ? tax2Val.toFixed(2) : prev.tax2Value,
        curNetValue: prev.curNetValue === '' ? rounded.toFixed(2) : prev.curNetValue,
        netValue: prev.netValue === '' ? rounded.toFixed(2) : prev.netValue
      }));
    }
  }, [
    currentLine.amount,
    currentLine.rate,
    currentLine.exRate,
    currentLine.tax1Rate,
    currentLine.tax2Rate,
    currentLine.round
  ]);

  const addLine = () => {
    if (!currentLine.chargeCode || !currentLine.amount) {
      toast.error('Charge Code and Amount are required');
      return;
    }

    const newLine = {
      ...currentLine,
      serialNo: (formData.invoiceLines || []).length + 1
    };

    setFormData(prev => ({
      ...prev,
      invoiceLines: [...(prev.invoiceLines || []), newLine]
    }));

    // Reset
    setCurrentLine({
      chargeCode: '',
      chargeName: '',
      currency: formData.currency,
      amount: '',
      uom: '',
      rate: '',
      curValue: '',
      exRate: '1.00',
      value: '',
      tax1Code: '',
      tax1Rate: '',
      tax1Value: '',
      tax2Code: '',
      tax2Rate: '',
      tax2Value: '',
      narration: '',
      round: '0',
      curNetValue: '',
      netValue: '',
      serialNo: ''
    });
    setChargeSearch('');
    toast.success('Charge line added');
  };

  const removeLine = (index) => {
    setFormData(prev => ({
      ...prev,
      invoiceLines: prev.invoiceLines.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return (formData.invoiceLines || []).reduce((sum, line) => sum + parseFloat(line.netValue || 0), 0).toFixed(2);
  };

  const handleNext = () => {
    if ((formData.invoiceLines || []).length === 0) {
      toast.error('Add at least one charge line');
      return;
    }
    onNext();
  };

  // Filter charges for dropdown
  const filteredCharges = charges.filter(ch =>
    ch.code.toLowerCase().includes(chargeSearch.toLowerCase()) ||
    ch.name.toLowerCase().includes(chargeSearch.toLowerCase())
  );

  return (
    <div className="section">
      <h3>Step 2: Invoice Details</h3>

      {/* Add Line Form */}
      <div className="section-card">
        <h4>Add Charge Line</h4>
        <div className="form-grid">
          {/* Charge Code - SEARCHABLE */}
          <div className="input-group" style={{ position: 'relative' }}>
            <label>Charge Code <span className="required">*</span></label>
            <input
              type="text"
              value={chargeSearch}
              onChange={(e) => {
                setChargeSearch(e.target.value.toUpperCase());
                setShowChargeDropdown(true);
              }}
              onFocus={() => setShowChargeDropdown(true)}
              placeholder="Type to search Charge Code..."
              style={{ textTransform: 'uppercase' }}
            />
            {showChargeDropdown && (
              <div className="autocomplete-dropdown">
                {filteredCharges.length === 0 ? (
                  <div className="autocomplete-item no-result">No charge found</div>
                ) : (
                  filteredCharges.map(charge => (
                    <div
                      key={charge._id}
                      className="autocomplete-item"
                      onClick={() => handleChargeSelect(charge)}
                    >
                      <strong>{charge.code}</strong> — {charge.name} (Rate: {charge.rate})
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Charge Name - READONLY */}
          <div className="input-group">
            <label>Charge Name</label>
            <input
              value={currentLine.chargeName}
              readOnly
              disabled
              placeholder="Auto-filled after selecting Charge Code"
              style={{ backgroundColor: 'var(--highlight-success)', color: 'var(--text-primary)', fontWeight: '600' }}
            />
          </div>

          <div className="input-group">
            <label>Currency</label>
            <select
              value={currentLine.currency}
              onChange={(e) => setCurrentLine(prev => ({ ...prev, currency: e.target.value }))}
            >
              {currencies.map(curr => (
                <option key={curr._id} value={curr.code}>{curr.code}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>CBM/NOC Amount <span className="required">*</span></label>
            <input
              type="number"
              value={currentLine.amount}
              onChange={(e) => setCurrentLine(prev => ({ ...prev, amount: e.target.value }))}
              min="0"
              step="0.001"
            />
          </div>

          <div className="input-group">
            <label>UOM</label>
            <select
              value={currentLine.uom}
              onChange={(e) => setCurrentLine(prev => ({ ...prev, uom: e.target.value }))}
            >
              <option value="">Select UOM</option>
              {uoms.map(u => (
                <option key={u._id} value={u.code}>{u.code} - {u.name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Rate</label>
            <input
              type="number"
              value={currentLine.rate}
              onChange={(e) => setCurrentLine(prev => ({ ...prev, rate: e.target.value }))}
              min="0"
              step="0.01"
              placeholder="Override default rate"
            />
            <small style={{ color: 'var(--text-secondary)' }}>Default from master — editable</small>
          </div>

          <div className="input-group">
            <label>Cur. Value</label>
            <input
              type="number"
              value={currentLine.curValue}
              onChange={(e) => setCurrentLine(prev => ({ ...prev, curValue: e.target.value }))}
              step="0.01"
            />
          </div>

          <div className="input-group">
            <label>Ex. Rate</label>
            <input
              type="number"
              value={currentLine.exRate}
              onChange={(e) => setCurrentLine(prev => ({ ...prev, exRate: e.target.value }))}
              min="0"
              step="0.01"
            />
          </div>

          <div className="input-group">
            <label>Value</label>
            <input
              type="number"
              value={currentLine.value}
              onChange={(e) => setCurrentLine(prev => ({ ...prev, value: e.target.value }))}
              step="0.01"
            />
          </div>

          <div className="input-group">
            <label>Tax 01</label>
            <select
              value={currentLine.tax1Code}
              onChange={(e) => {
                const tax = taxes.find(t => t.code === e.target.value);
                setCurrentLine(prev => ({
                  ...prev,
                  tax1Code: e.target.value,
                  tax1Rate: tax ? tax.rate.toString() : ''
                }));
              }}
            >
              <option value="">None</option>
              {taxes.map(tax => (
                <option key={tax._id} value={tax.code}>{tax.code} ({tax.rate}%)</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Tax Rate 01</label>
            <input value={currentLine.tax1Rate} readOnly disabled />
          </div>

          <div className="input-group">
            <label>Tax Value 01</label>
            <input
              type="number"
              value={currentLine.tax1Value}
              onChange={(e) => setCurrentLine(prev => ({ ...prev, tax1Value: e.target.value }))}
              step="0.01"
            />
          </div>

          <div className="input-group">
            <label>Tax 02</label>
            <select
              value={currentLine.tax2Code}
              onChange={(e) => {
                const tax = taxes.find(t => t.code === e.target.value);
                setCurrentLine(prev => ({
                  ...prev,
                  tax2Code: e.target.value,
                  tax2Rate: tax ? tax.rate.toString() : ''
                }));
              }}
            >
              <option value="">None</option>
              {taxes.map(tax => (
                <option key={tax._id} value={tax.code}>{tax.code} ({tax.rate}%)</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Tax Rate 02</label>
            <input value={currentLine.tax2Rate} readOnly disabled />
          </div>

          <div className="input-group">
            <label>Tax Value 02</label>
            <input
              type="number"
              value={currentLine.tax2Value}
              onChange={(e) => setCurrentLine(prev => ({ ...prev, tax2Value: e.target.value }))}
              step="0.01"
            />
          </div>

          <div className="input-group">
            <label>Narration</label>
            <input value={currentLine.narration} readOnly disabled style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} />
          </div>

          <div className="input-group">
            <label>Round</label>
            <select
              value={currentLine.round}
              onChange={(e) => setCurrentLine(prev => ({ ...prev, round: e.target.value }))}
            >
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="5">2</option>
              <option value="10">3</option>
              <option value="100">4</option>
            </select>
          </div>

          <div className="input-group">
            <label>Cur. Net Value</label>
            <input
              type="number"
              value={currentLine.curNetValue}
              onChange={(e) => setCurrentLine(prev => ({ ...prev, curNetValue: e.target.value }))}
              step="0.01"
              style={{ fontWeight: 'bold' }}
            />
          </div>

          <div className="input-group">
            <label>Net Value</label>
            <input
              type="number"
              value={currentLine.netValue}
              onChange={(e) => setCurrentLine(prev => ({ ...prev, netValue: e.target.value }))}
              step="0.01"
              style={{ fontWeight: 'bold' }}
            />
          </div>

          <div className="input-group" style={{ alignSelf: 'end' }}>
            <button type="button" className="btn-primary" onClick={addLine} style={{ height: '56px' }}>
              Add Line
            </button>
          </div>
        </div>
      </div>

      <div className="section-card">
        <h4>Invoice Lines</h4>
        {(formData.invoiceLines || []).length === 0 ? (
          <p className="no-data">No charge lines added yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--table-header)' }}>
                <th style={{ padding: '0.8rem', color: 'white' }}>S/No</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Charge Code</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Name</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Currency</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Amount</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>UOM</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Rate</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Cur Value</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Ex Rate</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Value</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Tax 01</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Tax 01 Val</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Tax 02</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Tax 02 Val</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Narration</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Round</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Net Value</th>
                <th style={{ padding: '0.8rem', color: 'white' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.invoiceLines.map((line, idx) => (
                <tr key={idx}>
                  <td>{line.serialNo || idx + 1}</td>
                  <td>{line.chargeCode}</td>
                  <td>{line.chargeName}</td>
                  <td>{line.currency}</td>
                  <td>{line.amount}</td>
                  <td>{line.uom}</td>
                  <td>{line.rate}</td>
                  <td>{line.curValue}</td>
                  <td>{line.exRate}</td>
                  <td>{line.value}</td>
                  <td>{line.tax1Code || '-'}</td>
                  <td>{line.tax1Value || '0.00'}</td>
                  <td>{line.tax2Code || '-'}</td>
                  <td>{line.tax2Value || '0.00'}</td>
                  <td>{line.narration}</td>
                  <td>{line.round}</td>
                  <td style={{ fontWeight: 'bold' }}>{line.netValue}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px' }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'var(--highlight-info)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                <td colSpan="16" style={{ textAlign: 'right', padding: '1rem' }}>Total</td>
                <td style={{ padding: '1rem' }}>{calculateTotal()}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="form-actions" style={{ marginTop: '3rem' }}>
        <button type="button" className="btn-secondary" onClick={onPrevious}>
          ← Previous
        </button>

        <button type="button" className="btn-primary" onClick={handleNext}>
          Next: Preview & Submit →
        </button>
      </div>
    </div >
  );
};

export default InvoiceDetails;
