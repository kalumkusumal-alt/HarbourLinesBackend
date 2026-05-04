// frontend/src/helpers/generateEManifestXML.js

export const generateEManifestXML = ({
  filteredDOs,
  selectedVoyage,
  lastPortDeparture,
  customsOfficeCode,
  selectedMBL,
  jobs
}) => {
  if (!filteredDOs || filteredDOs.length === 0) {
    throw new Error("No Delivery Orders available to generate E-Manifest XML");
  }

  // Sort DOs by createdAt (ascending)
  const sortedDOs = [...filteredDOs].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateA - dateB;
  });

  const firstDO = sortedDOs[0];
  const job = jobs.find(j => j._id === firstDO.jobId) || {};

  let xml = `<?xml version="1.0"?>\n<Awbolds>\n`;

  // Master_bol
  xml += `  <Master_bol>\n`;
  xml += `    <Customs_office_code>${customsOfficeCode || 'SECMB'}</Customs_office_code>\n`;
  xml += `    <Voyage_number>${selectedVoyage || job.voyage || 'UNKNOWN'}</Voyage_number>\n`;

  const departureDate = job.lastPortEtd 
    ? new Date(job.lastPortEtd).toISOString().split('T')[0]
    : (lastPortDeparture || new Date().toISOString().split('T')[0]);
  xml += `    <Date_of_departure>${departureDate}</Date_of_departure>\n`;

  xml += `    <Reference_number>${firstDO.masterBlNumber || selectedMBL || job.mblNumber || 'UNKNOWN'}</Reference_number>\n`;
  xml += `  </Master_bol>\n\n`;

  sortedDOs.forEach((doItem, index) => {
    const lineNumber = index + 1;
    const currentJob = jobs.find(j => j._id === doItem.jobId) || job;

    xml += `  <Bol_segment>\n`;

    xml += `    <Bol_id>\n`;
    xml += `      <Bol_reference>${doItem.houseBl || 'N/A'}</Bol_reference>\n`;
    xml += `      <Line_number>${lineNumber}</Line_number>\n`;
    xml += `      <Bol_nature>23</Bol_nature>\n`;
    xml += `      <Bol_type_code>HSB</Bol_type_code>\n`;
    xml += `      <Master_bol_ref_number />\n`;
    xml += `    </Bol_id>\n`;

    // Consolidated_Cargo = count of containers with grossWeight not null
    const filledContainers = (doItem.containerDetails || []).filter(
      c => c.grossWeight != null && c.grossWeight !== undefined
    );
    const containerCount = filledContainers.length || 0;
    xml += `    <Consolidated_Cargo>${containerCount}</Consolidated_Cargo>\n`;

    xml += `    <Load_unload_place>\n`;
    xml += `      <Place_of_loading_code>${doItem.portOfLoadingCode || 'UNKNOWN'}</Place_of_loading_code>\n`;
    xml += `      <Place_of_unloading_code>${doItem.portOfDischargeCode || currentJob.portDischargeCode || 'LKCMB'}</Place_of_unloading_code>\n`;
    xml += `    </Load_unload_place>\n`;

    xml += `    <Traders_segment>\n`;
    xml += `      <Carrier>\n`;
    xml += `        <Carrier_code>FF343</Carrier_code>\n`;
    xml += `        <Carrier_name>HARBOUR LINES (PVT) LTD.,</Carrier_name>\n`;
    xml += `        <Carrier_address> No. 94/1, Lauries Road COLOMBO 04, SRI LANKA.</Carrier_address>\n`;
    xml += `      </Carrier>\n`;

    xml += `      <Exporter>\n`;
    xml += `        <Exporter_name>${doItem.shipperName || 'UNKNOWN'}</Exporter_name>\n`;
    xml += `        <Exporter_address>${doItem.shipperAddress || ''}</Exporter_address>\n`;
    xml += `      </Exporter>\n`;

    xml += `      <Notify>\n`;
    xml += `        <Notify_name>${doItem.notifyPartyName || 'UNKNOWN'}</Notify_name>\n`;
    xml += `        <Notify_address>${doItem.notifyPartyAddress || ''}</Notify_address>\n`;
    xml += `      </Notify>\n`;

    xml += `      <Consignee>\n`;
    xml += `        <Consignee_name>${doItem.consigneeName || 'UNKNOWN'}</Consignee_name>\n`;
    xml += `        <Consignee_address>${doItem.consigneeAddress || ''}</Consignee_address>\n`;
    xml += `      </Consignee>\n`;
    xml += `    </Traders_segment>\n`;

    // ctn_segment — use the container with grossWeight (or first container)
    const containerWithWeight = (doItem.containerDetails || []).find(c => c.grossWeight != null);
    const containerToUse = containerWithWeight || doItem.containerDetails?.[0] || {};

    // UPDATED: Get sealNo from SeaImportJob.containers by matching containerNo
    let sealNo = '';
    if (containerToUse.containerNo && currentJob.containers) {
      const matchingJobContainer = currentJob.containers.find(
        c => c.containerNo === containerToUse.containerNo
      );
      sealNo = matchingJobContainer?.sealNo || '';
    }

    xml += `    <ctn_segment>\n`;
    xml += `      <Ctn_reference>${containerToUse.containerNo || 'UNKNOWN'}</Ctn_reference>\n`;
    xml += `      <Number_of_packages>${doItem.noOfPackages || '01'}</Number_of_packages>\n`;
    xml += `      <Type_of_container>${containerToUse.containerType || '45GP'}</Type_of_container>\n`;
    xml += `      <Empty_Full>02</Empty_Full>\n`;
    xml += `      <Marks1>${sealNo}</Marks1>\n`; // ← now uses sealNo from job
    xml += `    </ctn_segment>\n`;

    xml += `    <Goods_segment>\n`;
    xml += `      <Number_of_packages>${doItem.noOfPackages || '1'}</Number_of_packages>\n`;
    xml += `      <Package_type_code>${doItem.packageTypeCode || 'UN'}</Package_type_code>\n`;
    xml += `      <Gross_mass>${(doItem.grossWeight || 2150).toFixed(2)}</Gross_mass>\n`;
    xml += `      <Shipping_marks>${doItem.marksNumbers || ''}</Shipping_marks>\n`;
    xml += `      <Goods_description>${doItem.description || 'NO DESCRIPTION PROVIDED'}</Goods_description>\n`;
    xml += `      <Volume_in_cubic_meters>${(doItem.cbm || 20).toFixed(2)}</Volume_in_cubic_meters>\n`;
    xml += `      <Num_of_ctn_for_this_bol>1</Num_of_ctn_for_this_bol>\n`;

    const etaFormatted = currentJob.etaDateTime 
      ? new Date(currentJob.etaDateTime).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0];
    xml += `      <Information>${etaFormatted}</Information>\n`;

    xml += `    </Goods_segment>\n`;

    xml += `    <Value_segment>\n`;
    xml += `      <Freight_segment>\n`;
    xml += `        <Freight_value>00</Freight_value>\n`;
    xml += `        <Freight_currency>ZZZ</Freight_currency>\n`;
    xml += `      </Freight_segment>\n`;
    xml += `    </Value_segment>\n`;

    xml += `  </Bol_segment>\n\n`;
  });

  xml += `</Awbolds>`;

  return xml;
};