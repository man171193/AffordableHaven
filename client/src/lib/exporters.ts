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
    
    // Create header information
    const headerData = [
      ["Packing Material Report"],
      [""],
      ["Date:", reportDate],
      ["Client Name:", report.report.clientName],
      ["Client Address:", report.report.clientAddress],
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
      "Gross Weight",
      "Tare Weight",
      "Net Weight",
      "Cones"
    ];
    
    // Create the rows for each item
    const itemRows = report.items.map((item, index) => [
      index + 1,
      item.bagNo,
      item.grossWeight,
      item.tareWeight,
      item.netWeight,
      item.cones
    ]);
    
    // Add totals row
    const totalsRow = [
      "Total",
      "",
      report.report.totalGrossWeight,
      report.report.totalTareWeight,
      report.report.totalNetWeight,
      report.report.totalCones
    ];
    
    // Combine all data
    const excelData = [
      ...headerData,
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
      { wch: 15 }, // Gross Weight
      { wch: 15 }, // Tare Weight
      { wch: 15 }, // Net Weight
      { wch: 10 }  // Cones
    ];
    
    ws['!cols'] = colWidths;
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Packing Report");
    
    // Generate filename
    const fileName = `Packing_Report_${report.report.clientName.substring(0, 10)}_${reportDate.replace(/\//g, '-')}.xlsx`;
    
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
        <title>Packing Material Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 20px;
          }
          h1 {
            color: #4a90e2;
            text-align: center;
            margin-bottom: 20px;
          }
          .report-header {
            margin-bottom: 30px;
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
            background-color: #4a90e2;
            color: white;
            font-weight: bold;
            text-align: left;
            padding: 8px;
          }
          .items-table td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          .items-table tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          .items-table tfoot {
            font-weight: bold;
            background-color: #e6e6e6;
          }
          @media print {
            body {
              margin: 0;
              padding: 10px;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <h1>Packing Material Report</h1>
        
        <div class="report-header">
          <table>
            <tr>
              <td class="label">Date:</td>
              <td>${reportDate}</td>
              <td class="label">Challan No:</td>
              <td>${report.report.challanNo}</td>
            </tr>
            <tr>
              <td class="label">Client Name:</td>
              <td>${report.report.clientName}</td>
              <td class="label">Quality Name:</td>
              <td>${report.report.qualityName}</td>
            </tr>
            <tr>
              <td class="label">Client Address:</td>
              <td>${report.report.clientAddress}</td>
              <td class="label">Shade Number:</td>
              <td>${report.report.shadeNumber || "-"}</td>
            </tr>
            <tr>
              <td class="label">Denier:</td>
              <td>${report.report.denier}</td>
              <td class="label">Lot Number:</td>
              <td>${report.report.lotNumber}</td>
            </tr>
            <tr>
              <td class="label">Blend:</td>
              <td>${report.report.blend}</td>
              <td></td>
              <td></td>
            </tr>
          </table>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Bag No.</th>
              <th>Gross Weight</th>
              <th>Tare Weight</th>
              <th>Net Weight</th>
              <th>Cones</th>
            </tr>
          </thead>
          <tbody>
            ${report.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.bagNo}</td>
                <td>${item.grossWeight.toFixed(1)}</td>
                <td>${item.tareWeight.toFixed(1)}</td>
                <td>${item.netWeight.toFixed(1)}</td>
                <td>${item.cones}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2">Grand Total</td>
              <td>${Number(report.report.totalGrossWeight).toFixed(1)}</td>
              <td>${Number(report.report.totalTareWeight).toFixed(1)}</td>
              <td>${Number(report.report.totalNetWeight).toFixed(1)}</td>
              <td>${report.report.totalCones}</td>
            </tr>
          </tfoot>
        </table>
        
        <div style="margin-top: 50px;">
          <div style="float: left; width: 50%;">
            <p>Prepared By: _________________</p>
          </div>
          <div style="float: right; width: 50%; text-align: right;">
            <p>Approved By: _________________</p>
          </div>
        </div>
        
        <button onclick="window.print()" style="margin-top: 30px; padding: 10px 20px; background-color: #4a90e2; color: white; border: none; border-radius: 4px; cursor: pointer;">
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
