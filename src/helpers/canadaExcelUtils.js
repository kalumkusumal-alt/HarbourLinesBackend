import * as XLSX from 'xlsx';

export const generateCanadaExcel = (manifest, toast) => {
    try {
        // 1. Flatten all references from all HBLs
        let allRefs = [];
        manifest.hbls.forEach(hbl => {
            hbl.references.forEach(ref => {
                allRefs.push({
                    ...ref,
                    jobNum: hbl.jobNum || hbl.hblNumber,
                    vessel: hbl.vessel,
                    voyage: hbl.voyage,
                    etd: hbl.etd,
                    parentHblShipperName: hbl.shipperName,
                    parentHblShipperAddress: hbl.shipperAddress
                });
            });
        });

        if (allRefs.length === 0) {
            if (toast) toast.error('No cargo found in this manifest');
            return;
        }

        // 2. Prepare data for Excel (One single list, no sections)
        const excelRows = [];
        
        allRefs.forEach((ref) => {
            const cbm = parseFloat(ref.cbm) || 0;
            const cbf = (cbm * 35.3147).toFixed(3);
            const weight = parseFloat(ref.weight) || 0;

            // Row 1: Name & Basic Info
            excelRows.push({
                "BOOKING": ` ${ref.hblNumber || ""}`,
                "SHIPPER": ref.shipperName || ref.parentHblShipperName || "",
                "CONSIGNEE": ref.consigneeName || "",
                "DESC.": ref.packageType || "CTN",
                "CBM": cbm,
                "CBF": cbf,
                "WEIGHT": weight
            });

            // Row 2: Addresses
            excelRows.push({
                "BOOKING": "",
                "SHIPPER": ref.shipperAddress || ref.parentHblShipperAddress || "",
                "CONSIGNEE": ref.consigneeAddress || "",
                "DESC.": "",
                "CBM": "",
                "CBF": "",
                "WEIGHT": ""
            });

            // Row 3: NIC
            excelRows.push({
                "BOOKING": "",
                "SHIPPER": "",
                "CONSIGNEE": ref.consigneeNIC ? `NIC: ${ref.consigneeNIC}` : "",
                "DESC.": "",
                "CBM": "",
                "CBF": "",
                "WEIGHT": ""
            });

            // Row 4: Phone
            excelRows.push({
                "BOOKING": "",
                "SHIPPER": "",
                "CONSIGNEE": ref.consigneePhone ? `TEL: ${ref.consigneePhone}` : "",
                "DESC.": "",
                "CBM": "",
                "CBF": "",
                "WEIGHT": ""
            });

            // Empty separator row
            excelRows.push({});
        });

        const worksheet = XLSX.utils.json_to_sheet(excelRows);

        // Set column widths for better readability
        worksheet['!cols'] = [
            { wch: 30 }, // BOOKING
            { wch: 45 }, // SHIPPER
            { wch: 45 }, // CONSIGNEE
            { wch: 15 }, // DESC
            { wch: 10 }, // CBM
            { wch: 10 }, // CBF
            { wch: 12 }  // WEIGHT
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Manifest");

        const filename = `Manifest_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(workbook, filename);
        if (toast) toast.success('Excel Generated with New Format!');
    } catch (error) {
        console.error('Excel Generation Error:', error);
        if (toast) toast.error('Failed to generate Excel');
    }
};
