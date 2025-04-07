import { ReportWithItems } from "@shared/schema";
import { format } from "date-fns";

// Function to generate Excel file
export async function generateExcel(report: ReportWithItems) {
  try {
    // Make sure XLSX is available
    if (!window.XLSX) {
      throw new Error("XLSX library not loaded");
    }
    
    const XLSX = window.XLSX;
    
    // Format the data for Excel
    const reportDate = format(new Date(report.report.reportDate), "dd/MM/yyyy");
    
    // Create company header information
    const companyData = [
      ["MYCITIUS TEX PRIVATE LIMITED"],
      ["FACTORY ADDRESS: BATIA TOLL PLAZA. PLOT NO B-14/27. HOJIWALA INDUSTRIAL ESTATE ROAD NO 13., SACHIN SURAT. GUJRAT. 394230"],
      ["GST NO: 24AANCM4112H1ZO"],
      [""],
      ["DELIVERY CHALLAN CUM PACKING LIST"],
      [""]
    ];
    
    // Create shipping information
    const shippingData = [
      ["Shipping Address:"],
      ["Client Name:", report.report.clientName],
      ["Client Address:", report.report.clientAddress],
      [""],
      ["Date:", reportDate],
      ["Challan No:", report.report.challanNo.toString()],
      ["Quality Name:", report.report.qualityName],
      ["Shade Number:", report.report.shadeNumber || ""],
      ["Denier:", report.report.denier.toString()],
      ["Blend:", report.report.blend],
      ["Lot Number:", report.report.lotNumber.toString()],
      [""],
      ["Item Details:"],
      [""]
    ];
    
    // Create the column headers for items
    const columnHeaders = [
      "Sr. No.",
      "Bag No.",
      "Gross Weight (kg)",
      "Tare Weight (kg)",
      "Net Weight (kg)",
      "Cones"
    ];
    
    // Create the rows for each item with 2 decimal places
    const itemRows = report.items.map((item, index) => [
      index + 1,
      item.bagNo,
      Number(item.grossWeight).toFixed(2),
      Number(item.tareWeight).toFixed(2),
      Number(item.netWeight).toFixed(2),
      item.cones
    ]);
    
    // Add totals row with 2 decimal places
    const totalsRow = [
      "Total",
      "",
      Number(report.report.totalGrossWeight).toFixed(2),
      Number(report.report.totalTareWeight).toFixed(2),
      Number(report.report.totalNetWeight).toFixed(2),
      report.report.totalCones
    ];
    
    // Combine all data
    const excelData = [
      ...companyData,
      ...shippingData,
      columnHeaders,
      ...itemRows,
      [],
      totalsRow
    ];
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
      { wch: 10 }, // Sr. No.
      { wch: 10 }, // Bag No.
      { wch: 18 }, // Gross Weight
      { wch: 18 }, // Tare Weight
      { wch: 18 }, // Net Weight
      { wch: 10 }  // Cones
    ];
    
    ws['!cols'] = colWidths;
    
    // Apply styles - bold headers and title
    // Company name and delivery challan title
    const range = XLSX.utils.decode_range(ws['!ref'] || "A1");
    const boldCells = ["A1", "A5"]; // Company name and DELIVERY CHALLAN title
    const centerCells = ["A1", "A2", "A3", "A5"];
    
    // Bold column headers
    const headerRowIndex = companyData.length + shippingData.length;
    for (let i = 0; i <= range.e.c; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: i });
      boldCells.push(cellRef);
    }
    
    // Apply bold styling
    boldCells.forEach(cellRef => {
      if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
      ws[cellRef].s = { font: { bold: true } };
    });
    
    // Apply center alignment
    centerCells.forEach(cellRef => {
      if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
      ws[cellRef].s = { 
        ...ws[cellRef].s,
        alignment: { horizontal: 'center' }
      };
    });
    
    // Apply bold to totals row
    const totalRowIndex = headerRowIndex + itemRows.length + 2;
    for (let i = 0; i <= range.e.c; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: totalRowIndex, c: i });
      if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
      ws[cellRef].s = { font: { bold: true } };
    }
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Delivery Challan");
    
    // Generate filename
    const fileName = `Delivery_Challan_${report.report.clientName.substring(0, 10)}_${reportDate.replace(/\//g, '-')}.xlsx`;
    
    // Write the workbook and trigger download
    XLSX.writeFile(wb, fileName);
    
    return true;
  } catch (error) {
    console.error("Error generating Excel:", error);
    throw error;
  }
}

// Function to generate PDF
export async function generatePDF(report: ReportWithItems) {
  try {
    // Create a printable HTML representation
    const reportDate = format(new Date(report.report.reportDate), "dd MMMM yyyy");
    
    // Create the HTML content
    const content = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Delivery Challan cum Packing List</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 20px;
          }
          .company-header {
            text-align: center;
            margin-bottom: 10px;
          }
          .company-logo {
            max-width: 150px;
            height: auto;
            margin: 0 auto;
            display: block;
          }
          .company-name {
            font-size: 22px;
            font-weight: bold;
            margin: 10px 0;
            color: #00308F;
          }
          .company-address {
            font-size: 12px;
            margin: 5px 0;
          }
          .company-gst {
            font-size: 14px;
            font-weight: bold;
            margin: 5px 0;
          }
          h1 {
            color: #00308F;
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            border-top: 2px solid #00308F;
            border-bottom: 2px solid #00308F;
          }
          .shipping-header {
            margin-bottom: 20px;
          }
          .shipping-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
          }
          .report-info {
            display: flex;
            justify-content: space-between;
          }
          .report-info-section {
            width: 48%;
          }
          .report-header table {
            width: 100%;
            border-collapse: collapse;
          }
          .report-header td {
            padding: 5px;
            vertical-align: top;
          }
          .label {
            font-weight: bold;
            width: 150px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .items-table th {
            background-color: #00308F;
            color: white;
            font-weight: bold;
            text-align: center;
            padding: 8px;
            border: 1px solid #333;
          }
          .items-table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: center;
          }
          .items-table tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          .items-table tfoot {
            font-weight: bold;
            background-color: #e6e6e6;
          }
          .text-right {
            text-align: right;
          }
          .signatures {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }
          .signature-section {
            width: 45%;
          }
          .signature-line {
            margin-top: 40px;
            border-top: 1px solid #333;
            padding-top: 5px;
          }
          @media print {
            body {
              margin: 0;
              padding: 15px;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="company-header">
          <div class="company-name">MYCITIUS TEX PRIVATE LIMITED</div>
          <div class="company-address">FACTORY ADDRESS: BATIA TOLL PLAZA. PLOT NO B-14/27. HOJIWALA INDUSTRIAL ESTATE ROAD NO 13., SACHIN SURAT. GUJRAT. 394230</div>
          <div class="company-gst">GST NO: 24AANCM4112H1ZO</div>
        </div>
        
        <h1>DELIVERY CHALLAN CUM PACKING LIST</h1>
        
        <div class="shipping-header">
          <div class="shipping-title">Shipping Address:</div>
          <div>${report.report.clientName}</div>
          <div>${report.report.clientAddress}</div>
        </div>
        
        <div class="report-info">
          <div class="report-info-section">
            <table>
              <tr>
                <td class="label">Date:</td>
                <td>${reportDate}</td>
              </tr>
              <tr>
                <td class="label">Challan No:</td>
                <td>${report.report.challanNo}</td>
              </tr>
            </table>
          </div>
          <div class="report-info-section">
            <table>
              <tr>
                <td class="label">Quality Name:</td>
                <td>${report.report.qualityName}</td>
              </tr>
              <tr>
                <td class="label">Shade Number:</td>
                <td>${report.report.shadeNumber || "-"}</td>
              </tr>
              <tr>
                <td class="label">Denier:</td>
                <td>${report.report.denier}</td>
              </tr>
              <tr>
                <td class="label">Blend:</td>
                <td>${report.report.blend}</td>
              </tr>
              <tr>
                <td class="label">Lot Number:</td>
                <td>${report.report.lotNumber}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Bag No.</th>
              <th>Gross Weight (kg)</th>
              <th>Tare Weight (kg)</th>
              <th>Net Weight (kg)</th>
              <th>Cones</th>
            </tr>
          </thead>
          <tbody>
            ${report.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.bagNo}</td>
                <td>${Number(item.grossWeight).toFixed(2)}</td>
                <td>${Number(item.tareWeight).toFixed(2)}</td>
                <td>${Number(item.netWeight).toFixed(2)}</td>
                <td>${item.cones}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2"><strong>Grand Total</strong></td>
              <td><strong>${Number(report.report.totalGrossWeight).toFixed(2)}</strong></td>
              <td><strong>${Number(report.report.totalTareWeight).toFixed(2)}</strong></td>
              <td><strong>${Number(report.report.totalNetWeight).toFixed(2)}</strong></td>
              <td><strong>${report.report.totalCones}</strong></td>
            </tr>
          </tfoot>
        </table>
        
        <div class="signatures">
          <div class="signature-section">
            <div class="signature-line">Prepared By</div>
          </div>
          <div class="signature-section" style="text-align: right;">
            <div class="signature-line">Approved By</div>
          </div>
        </div>
        
        <button onclick="window.print()" style="margin-top: 30px; padding: 10px 20px; background-color: #00308F; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Print Report
        </button>
      </body>
      </html>
    `;
    
    // Open a new window with the content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      
      // Add a slight delay to allow styles to load before printing
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      throw new Error("Unable to open print window. Check if pop-up blocker is enabled.");
    }
    
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
