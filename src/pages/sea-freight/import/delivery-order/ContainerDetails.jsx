// frontend/src/pages/sea-freight/import/delivery-order/ContainerDetails.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ContainerDetails = ({ formData, setFormData, onPrevious, selectedJob, loading }) => {
  // Current container being edited
  const [currentContainer, setCurrentContainer] = useState({
    containerNo: '',
    containerType: '',
    grossWeight: '',
    noOfPackages: '',
    soc: false,
    agent: '',
    deposit: false,
    serialNo: '',
    fclType: ''
  });

  useEffect(() => {
    // Initialize containerDetails from job containers if empty
    if (selectedJob && selectedJob.containers && (formData.containerDetails || []).length === 0) {
      const initialDetails = selectedJob.containers.map(cont => ({
        containerNo: cont.containerNo || '',
        containerType: cont.containerType || '',
        grossWeight: '',
        noOfPackages: '',
        soc: false,
        agent: '',
        deposit: false,
        serialNo: '',
        fclType: ''
      }));
      setFormData(prev => ({ ...prev, containerDetails: initialDetails }));
    }
  }, [selectedJob, setFormData]);

  const handleContainerChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'containerNo') {
      const selected = selectedJob?.containers?.find(c => c.containerNo === value);

      const newGrossWeight = formData.grossWeight || '';
      const newNoOfPackages = formData.noOfPackages || '';

      setCurrentContainer(prev => ({
        ...prev,
        containerNo: value,
        containerType: selected?.containerType || prev.containerType,
        grossWeight: newGrossWeight,
        noOfPackages: newNoOfPackages
      }));

      toast.info(`Auto-filled Gross Weight (${newGrossWeight} KG) and No. of Packages (${newNoOfPackages}) from Sub Details`, {
        duration: 4000
      });
    } else {
      setCurrentContainer(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const addOrUpdateContainer = () => {
    if (!currentContainer.containerNo) {
      toast.error('Select a container');
      return;
    }
    if (!currentContainer.grossWeight || !currentContainer.noOfPackages) {
      toast.error('Gross Weight and No. of Packages are required');
      return;
    }

    const updatedDetails = [...(formData.containerDetails || [])];
    const existingIndex = updatedDetails.findIndex(d => d.containerNo === currentContainer.containerNo);

    if (existingIndex >= 0) {
      updatedDetails[existingIndex] = { ...currentContainer };
      toast.success('Container details updated');
    } else {
      updatedDetails.push({ ...currentContainer });
      toast.success('Container details added');
    }

    setFormData(prev => ({ ...prev, containerDetails: updatedDetails }));

    // Reset current container form
    setCurrentContainer({
      containerNo: '',
      containerType: '',
      grossWeight: '',
      noOfPackages: '',
      soc: false,
      agent: '',
      deposit: false,
      serialNo: '',
      fclType: ''
    });
  };

  const validate = () => {
    if ((formData.containerDetails || []).length === 0) {
      return 'At least one container detail is required';
    }
    // Optional: add more validation if needed
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    const cleanData = {
      ...formData,
      jobId: selectedJob?._id,

      notifyPartyId: formData.notifyPartyEnabled && formData.notifyPartyId ? formData.notifyPartyId : undefined,

      portOfLoadingId: formData.portOfLoadingId || undefined,
      originAgentId: formData.originAgentId || undefined,
      carrierId: formData.carrierId || undefined,
    };

    // Clean up undefined/empty fields
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined || cleanData[key] === '') {
        delete cleanData[key];
      }
    });

    toast.promise(
      fetch('https://harbourb-production.up.railway.app/api/delivery-orders/createDO', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
      })
        .then(res => {
          if (!res.ok) throw new Error('Network error');
          return res.json();
        })
        .then(data => {
          if (!data.success) throw new Error(data.message || 'Failed to create DO');
          toast.success('Delivery Order created successfully!');
          console.log('Created DO:', data.data);
        }),
      {
        loading: 'Creating Delivery Order...',
        success: 'Delivery Order created!',
        error: (err) => err.message || 'Failed to create Delivery Order'
      }
    );
  };

  const availableContainers = selectedJob?.containers || [];

  return (
    <div className="section">
      <h3>Step 4: Container Details & Submit</h3>

      <div className="section-card">
        <h4>Enter Container Details</h4>
        <small style={{ color: '#64748b', display: 'block', marginBottom: '1rem' }}>
          Gross Weight and No. of Packages are auto-filled from Sub Details. You can override them per container.
        </small>

        <div className="form-grid">
          <div className="input-group">
            <label>Container No. <span className="required">*</span></label>
            <select
              name="containerNo"
              value={currentContainer.containerNo}
              onChange={handleContainerChange}
              disabled={loading}
            >
              <option value="">Select Container</option>
              {availableContainers.map(cont => (
                <option key={cont.containerNo} value={cont.containerNo}>
                  {cont.containerNo} ({cont.containerType})
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Gross Weight (KG) <span className="required">*</span></label>
            <input
              type="number"
              name="grossWeight"
              value={currentContainer.grossWeight}
              onChange={handleContainerChange}
              disabled={loading}
              min="0"
              step="0.01"
            />
          </div>

          <div className="input-group">
            <label>No. of Packages <span className="required">*</span></label>
            <input
              type="number"
              name="noOfPackages"
              value={currentContainer.noOfPackages}
              onChange={handleContainerChange}
              disabled={loading}
              min="0"
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                name="soc"
                checked={currentContainer.soc}
                onChange={handleContainerChange}
                style={{ width: '24px', height: '24px', accentColor: '#3b82f6' }}
              />
              <span>SOC</span>
            </label>
          </div>

          <div className="input-group">
            <label>Agent</label>
            <input
              type="text"
              name="agent"
              value={currentContainer.agent}
              onChange={handleContainerChange}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                name="deposit"
                checked={currentContainer.deposit}
                onChange={handleContainerChange}
                style={{ width: '24px', height: '24px', accentColor: '#3b82f6' }}
              />
              <span>Deposit</span>
            </label>
          </div>

          <div className="input-group">
            <label>Serial No.</label>
            <input
              type="text"
              name="serialNo"
              value={currentContainer.serialNo}
              onChange={handleContainerChange}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Number of FCL Containers</label>
            <select
              name="fclType"
              value={currentContainer.fclType}
              onChange={handleContainerChange}
              disabled={loading}
            >
              <option value="">Select FCL Type</option>
              <option value="20 FT">20 FT</option>
              <option value="40 FT">40 FT</option>
              <option value="Over 40 FT">Over 40 FT</option>
            </select>
          </div>

          <div className="input-group" style={{ alignSelf: 'end' }}>
            <button type="button" className="btn-primary" onClick={addOrUpdateContainer} style={{ height: '56px' }}>
              {formData.containerDetails?.find(d => d.containerNo === currentContainer.containerNo) ? 'Update' : 'Add'} Details
            </button>
          </div>
        </div>
      </div>

      {/* Table - Container Summary */}
      <div className="section-card">
        <h4>Container Summary</h4>
        {(formData.containerDetails || []).length === 0 ? (
          <p className="no-data">No container details added yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f9ff' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>S No.</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Container No.</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Container Type</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Serial No</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>FCL Type</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Gross Weight (KG)</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>No. of Packages</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>SOC</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Agent</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Deposit</th>
              </tr>
            </thead>
            <tbody>
              {formData.containerDetails.map((detail, idx) => {
                const contInfo = selectedJob.containers.find(c => c.containerNo === detail.containerNo);
                return (
                  <tr key={idx}>
                    <td style={{ padding: '1rem' }}>{idx + 1}</td>
                    <td style={{ padding: '1rem' }}>{detail.containerNo}</td>
                    <td style={{ padding: '1rem' }}>{contInfo?.containerType || detail.containerType || '-'}</td>
                    <td style={{ padding: '1rem' }}>{detail.serialNo || '-'}</td>
                    <td style={{ padding: '1rem' }}>{detail.fclType || '-'}</td>
                    <td style={{ padding: '1rem' }}>{detail.grossWeight || '-'}</td>
                    <td style={{ padding: '1rem' }}>{detail.noOfPackages || '-'}</td>
                    <td style={{ padding: '1rem' }}>{detail.soc ? 'Yes' : 'No'}</td>
                    <td style={{ padding: '1rem' }}>{detail.agent || '-'}</td>
                    <td style={{ padding: '1rem' }}>{detail.deposit ? 'Yes' : 'No'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Navigation & Submit */}
      <div className="form-actions" style={{ marginTop: '3rem' }}>
        <button type="button" className="btn-secondary" onClick={onPrevious}>
          ← Previous
        </button>

        <button type="button" className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Delivery Order'}
        </button>
      </div>
    </div>
  );
};

export default ContainerDetails;
