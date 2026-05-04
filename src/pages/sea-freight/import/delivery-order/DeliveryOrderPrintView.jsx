// frontend/src/pages/sea-freight/import/delivery-order/DeliveryOrderPrintView.jsx
import React from 'react';

const DeliveryOrderPrintView = React.forwardRef(({ doData }, ref) => {
  // doData = your full Delivery Order object (from formData or fetched DO)

  return (
    <div ref={ref} className="do-print-container">
      <style jsx>{`
        .do-print-container {
          width: 210mm;
          min-height: 297mm;
          padding: 0;
          margin: 0;
          background: white;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11pt;
          font-weight: bold;
          color: black;
          position: relative;
          box-sizing: border-box;
        }

        /* BL Number (top right area, near "HBL No.") */
        .bl-number {
          position: absolute;
          top: 12mm;     /* Adjust if needed */
          left: 135mm;
          width: 60mm;
          text-align: left;
        }

        /* Consignee Name & Address (large box on left) */
        .consignee {
          position: absolute;
          top: 58mm;     /* Around the consignee box */
          left: 15mm;
          width: 110mm;
          line-height: 1.4;
        }

        /* Vessel / Delivery Agent (right side, near "Vessel/Delivery Agent") */
        .vessel-agent {
          position: absolute;
          top: 80mm;     /* Adjust based on form */
          left: 125mm;
          width: 70mm;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body, html {
            margin: 0;
            padding: 0;
            height: 297mm;
            width: 210mm;
          }
        }
      `}</style>

      {/* BL Number */}
      <div className="bl-number">
        {doData.houseBl || '__________________'}
      </div>

      {/* Consignee Name & Address */}
      <div className="consignee">
        {doData.consigneeName || '______________________________'}<br />
        {doData.consigneeAddress || ''}<br />
        {doData.consigneeStreet || ''}<br />
        {doData.consigneeCity || ''} {doData.consigneeCountry || ''}
      </div>

      {/* Vessel / Delivery Agent */}
      <div className="vessel-agent">
        {doData.vesselName || '______________________________'}<br />
        {doData.originAgentName || '______________________________'}
      </div>

      {/* Add more fields later as needed */}
    </div>
  );
});

DeliveryOrderPrintView.displayName = 'DeliveryOrderPrintView';

export default DeliveryOrderPrintView;