// frontend/src/pages/sea-freight/import/ContainerInfo.jsx
import { useState } from "react";
import toast from "react-hot-toast";

const ContainerInfo = ({ formData, setFormData, onPrevious, onSaveJob }) => {
  const [containers, setContainers] = useState([]);
  const [currentContainer, setCurrentContainer] = useState({
    sno: "",
    containerNo: "",
    containerType: "40GP",
    sealNo: "",
    yardCode: "",
    yardName: "",
    fclLcl: "FCL/FCL",
    onAccount: "",
  });

  const containerTypes = [
    "45HC",
    "45Reefer",
    "45GP",
    "AIRFreight",
    "40HC",
    "40OT",
    "40Reefdry",
    "40Flat Rack",
    "40Flat",
    "40GP",
    "20Vertical",
    "20OT",
    "20Reefdry",
    "20Flat",
    "20GP",
  ];

  const fclLclOptions = [
    "FCL/FCL",
    "FCL/LCL",
    "LCL/LCL",
    "MCC+Local",
    "MCC+Full",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentContainer((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddContainer = () => {
    if (!currentContainer.containerNo || !currentContainer.containerType) {
      toast.error("Container No and Type are required!");
      return;
    }

    const newContainer = {
      ...currentContainer,
      sno: containers.length + 1,
    };

    setContainers((prev) => [...prev, newContainer]);
    toast.success("Container added!");

    setCurrentContainer({
      sno: "",
      containerNo: "",
      containerType: "40GP",
      sealNo: "",
      yardCode: "",
      yardName: "",
      fclLcl: "FCL/FCL",
      onAccount: "",
    });
  };

  const handleRemoveContainer = (index) => {
    setContainers((prev) => prev.filter((_, i) => i !== index));
    toast.success("Container removed");
  };

  const handleSaveAndFinish = () => {
    if (containers.length === 0) {
      toast.error("Please add at least one container");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      containers: containers,
    }));

    toast.success("All containers saved! Creating job...");
    onSaveJob();
  };

  return (
    <div className="section">
      <h3>Container Information</h3>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        Add all containers for this job. You can add multiple containers.
      </p>

      <div
        className="form-grid"
        style={{
          background: "var(--bg-primary)",
          padding: "1.5rem",
          borderRadius: "16px",
          marginBottom: "2rem",
          border: "1px solid var(--border-color)"
        }}
      >
        <div className="input-group">
          <label>S. No</label>
          <input
            value={containers.length + 1}
            readOnly
            disabled
            style={{ backgroundColor: "var(--input-bg)", fontWeight: "bold", color: "var(--text-primary)" }}
          />
        </div>
        <div className="input-group">
          <label>
            Container No <span className="required">*</span>
          </label>
          <input
            name="containerNo"
            value={currentContainer.containerNo}
            onChange={handleInputChange}
            placeholder="e.g. MSKU1234567"
            maxLength="11"
          />
        </div>
        <div className="input-group">
          <label>
            Container Type <span className="required">*</span>
          </label>
          <select
            name="containerType"
            value={currentContainer.containerType}
            onChange={handleInputChange}
          >
            {containerTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>Seal No</label>
          <input
            name="sealNo"
            value={currentContainer.sealNo}
            onChange={handleInputChange}
            placeholder="e.g. SL123456"
          />
        </div>
        <div className="input-group">
          <label>Yard Code</label>
          <input
            name="yardCode"
            value={currentContainer.yardCode}
            onChange={handleInputChange}
            placeholder="e.g. COL01"
          />
        </div>
        <div className="input-group">
          <label>Yard Name</label>
          <input
            name="yardName"
            value={currentContainer.yardName}
            onChange={handleInputChange}
            placeholder="e.g. Colombo Yard"
          />
        </div>
        <div className="input-group">
          <label>FCL/LCL</label>
          <select
            name="fclLcl"
            value={currentContainer.fclLcl}
            onChange={handleInputChange}
          >
            {fclLclOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>On Account</label>
          <input
            name="onAccount"
            value={currentContainer.onAccount}
            onChange={handleInputChange}
            placeholder="e.g. Shipper"
          />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <button
          type="button"
          className="btn-primary"
          onClick={handleAddContainer}
        >
          Add Container
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            setCurrentContainer({
              sno: containers.length + 1,
              containerNo: "",
              containerType: "40GP",
              sealNo: "",
              yardCode: "",
              yardName: "",
              fclLcl: "FCL/FCL",
              onAccount: "",
            })
          }
        >
          Clear Form
        </button>
      </div>

      {/* Containers Table */}
      {containers.length > 0 && (
        <div className="table-container" style={{ marginTop: "2rem" }}>
          <h4 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>
            Added Containers ({containers.length})
          </h4>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--table-header)" }}>
                <th style={{ padding: "1rem", textAlign: "left", color: "white" }}>S.No</th>
                <th style={{ padding: "1rem", textAlign: "left", color: "white" }}>
                  Container No
                </th>
                <th style={{ padding: "1rem", textAlign: "left", color: "white" }}>Type</th>
                <th style={{ padding: "1rem", textAlign: "left", color: "white" }}>Seal No</th>
                <th style={{ padding: "1rem", textAlign: "left", color: "white" }}>Yard</th>
                <th style={{ padding: "1rem", textAlign: "left", color: "white" }}>FCL/LCL</th>
                <th style={{ padding: "1rem", textAlign: "left", color: "white" }}>
                  On Account
                </th>
                <th style={{ padding: "1rem", textAlign: "left", color: "white" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((cont, index) => (
                <tr key={index} style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
                  <td style={{ padding: "1rem" }}>{cont.sno}</td>
                  <td style={{ padding: "1rem", fontWeight: "600" }}>
                    {cont.containerNo}
                  </td>
                  <td style={{ padding: "1rem" }}>{cont.containerType}</td>
                  <td style={{ padding: "1rem" }}>{cont.sealNo || "-"}</td>
                  <td style={{ padding: "1rem" }}>
                    {cont.yardCode
                      ? `${cont.yardCode} - ${cont.yardName}`
                      : "-"}
                  </td>
                  <td style={{ padding: "1rem" }}>{cont.fclLcl}</td>
                  <td style={{ padding: "1rem" }}>{cont.onAccount || "-"}</td>
                  <td style={{ padding: "1rem" }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveContainer(index)}
                      style={{
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        padding: "0.4rem 0.8rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Navigation */}
      <div className="form-actions" style={{ marginTop: "3rem" }}>
        <button type="button" className="btn-secondary" onClick={onPrevious}>
          ← Previous
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={handleSaveAndFinish}
          disabled={containers.length === 0}
        >
          Save Job with {containers.length} Container
          {containers.length !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
};

export default ContainerInfo;
