<?php
// api/exports.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    error('Method not allowed', 405);
}

// Get report ID
if (!isset($_GET['id'])) {
    error('Report ID is required', 400);
}

$reportId = intval($_GET['id']);
$format = $_GET['format'] ?? 'pdf'; // Default to PDF if not specified

try {
    // Get the report with items
    $stmt = $pdo->prepare('
        SELECT r.*, c.name as client_name, c.address as client_address 
        FROM reports r
        LEFT JOIN clients c ON r.client_id = c.id
        WHERE r.id = ?
    ');
    $stmt->execute([$reportId]);
    $report = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$report) {
        error('Report not found', 404);
    }
    
    // Get the report items
    $stmt = $pdo->prepare('SELECT * FROM report_items WHERE report_id = ? ORDER BY id ASC');
    $stmt->execute([$reportId]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Group items by quality
    $grouped = [];
    $currentQuality = null;
    $currentGroup = [];
    
    foreach ($items as $item) {
        if ($currentQuality !== $item['quality_name']) {
            if (!empty($currentGroup)) {
                $grouped[] = $currentGroup;
            }
            $currentQuality = $item['quality_name'];
            $currentGroup = [];
        }
        $currentGroup[] = $item;
    }
    
    if (!empty($currentGroup)) {
        $grouped[] = $currentGroup;
    }
    
    // Calculate totals
    $totalGross = 0;
    $totalTare = 0;
    $totalNet = 0;
    $totalCones = 0;
    
    foreach ($grouped as &$group) {
        $groupGross = 0;
        $groupTare = 0;
        $groupNet = 0;
        $groupCones = 0;
        
        foreach ($group as $item) {
            $groupGross += $item['gross_weight'];
            $groupTare += $item['tare_weight'];
            $groupNet += $item['net_weight'];
            $groupCones += $item['cones'];
        }
        
        $group['subtotals'] = [
            'gross' => $groupGross,
            'tare' => $groupTare,
            'net' => $groupNet,
            'cones' => $groupCones
        ];
        
        $totalGross += $groupGross;
        $totalTare += $groupTare;
        $totalNet += $groupNet;
        $totalCones += $groupCones;
    }
    
    $report['totals'] = [
        'gross' => $totalGross,
        'tare' => $totalTare,
        'net' => $totalNet,
        'cones' => $totalCones
    ];
    
    $report['grouped_items'] = $grouped;
    
    // Format based on request
    if ($format === 'excel') {
        // Return JSON that the frontend will convert to Excel
        header('Content-Type: application/json');
        echo json_encode($report);
        exit;
    } else {
        // Generate HTML for PDF conversion
        $logoPath = '../attached_assets/MCT_GRS_LOGO_NEW.1-removebg-preview.png';
        $companyName = 'MYCITIUS TEX PRIVATE LIMITED';
        $companyAddress = 'Shed No.B-12, Dada Patil Wadi, Dada Patil Road, Chinchpada, Bhiwandi - 421101';
        $companyGST = 'GSTIN: 27AAECM7952M1ZU';
        
        $reportDate = date('d/m/Y', strtotime($report['report_date']));
        $challanNo = $report['challan_no'];
        $clientName = $report['client_name'];
        $clientAddress = $report['client_address'];
        
        // Generate HTML for the report
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Packing Report #' . $challanNo . '</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .company-info { text-align: right; }
        .logo { max-width: 200px; }
        .report-title { text-align: center; font-size: 24px; margin: 20px 0; }
        .report-info { margin-bottom: 20px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .info-col { width: 48%; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .subtotal-row { background-color: #f8f8f8; font-weight: bold; }
        .total-row { background-color: #eaeaea; font-weight: bold; }
        .group-header { background-color: #efefef; font-weight: bold; }
        .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
        .signature { width: 30%; text-align: center; }
        .signature-line { border-top: 1px solid #000; margin-top: 50px; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <img src="' . $logoPath . '" alt="Company Logo" class="logo">
        </div>
        <div class="company-info">
            <h2>' . $companyName . '</h2>
            <p>' . $companyAddress . '</p>
            <p>' . $companyGST . '</p>
        </div>
    </div>
    
    <div class="report-title">PACKING REPORT / DELIVERY CHALLAN</div>
    
    <div class="report-info">
        <div class="info-row">
            <div class="info-col">
                <p><strong>Date:</strong> ' . $reportDate . '</p>
                <p><strong>Challan No:</strong> ' . $challanNo . '</p>
            </div>
            <div class="info-col">
                <p><strong>Client:</strong> ' . $clientName . '</p>
                <p><strong>Address:</strong> ' . $clientAddress . '</p>
            </div>
        </div>';
        
        if (!empty($report['vehicle_no']) || !empty($report['driver_name']) || 
            !empty($report['destination']) || !empty($report['purpose'])) {
            $html .= '<div class="info-row">
                <div class="info-col">
                    <p><strong>Vehicle No:</strong> ' . $report['vehicle_no'] . '</p>
                    <p><strong>Driver Name:</strong> ' . $report['driver_name'] . '</p>
                </div>
                <div class="info-col">
                    <p><strong>Destination:</strong> ' . $report['destination'] . '</p>
                    <p><strong>Purpose:</strong> ' . $report['purpose'] . '</p>
                </div>
            </div>';
        }
        
        $html .= '</div>
    
    <table>
        <thead>
            <tr>
                <th>Sr. No.</th>
                <th>Bag No.</th>
                <th>Quality</th>
                <th>Denier</th>
                <th>Blend</th>
                <th>Lot No</th>
                <th>Shade</th>
                <th>Gross Wt</th>
                <th>Tare Wt</th>
                <th>Net Wt</th>
                <th>Cones</th>
            </tr>
        </thead>
        <tbody>';
        
        $srNo = 1;
        
        foreach ($grouped as $group) {
            $qualityInfo = $group[0];
            
            $html .= '<tr class="group-header">
                <td colspan="11">' . $qualityInfo['quality_name'] . ' - ' . 
                $qualityInfo['denier'] . ' - ' . 
                $qualityInfo['blend'] . ' - Lot: ' . 
                $qualityInfo['lot_number'] . 
                ($qualityInfo['shade_number'] ? ' - Shade: ' . $qualityInfo['shade_number'] : '') . 
                '</td>
            </tr>';
            
            foreach ($group as $item) {
                $html .= '<tr>
                    <td>' . $srNo++ . '</td>
                    <td>' . $item['bag_no'] . '</td>
                    <td>' . $item['quality_name'] . '</td>
                    <td>' . $item['denier'] . '</td>
                    <td>' . $item['blend'] . '</td>
                    <td>' . $item['lot_number'] . '</td>
                    <td>' . $item['shade_number'] . '</td>
                    <td>' . number_format($item['gross_weight'], 3) . '</td>
                    <td>' . number_format($item['tare_weight'], 3) . '</td>
                    <td>' . number_format($item['net_weight'], 3) . '</td>
                    <td>' . $item['cones'] . '</td>
                </tr>';
            }
            
            $html .= '<tr class="subtotal-row">
                <td colspan="7">Subtotal</td>
                <td>' . number_format($group['subtotals']['gross'], 3) . '</td>
                <td>' . number_format($group['subtotals']['tare'], 3) . '</td>
                <td>' . number_format($group['subtotals']['net'], 3) . '</td>
                <td>' . $group['subtotals']['cones'] . '</td>
            </tr>';
        }
        
        $html .= '<tr class="total-row">
            <td colspan="7">GRAND TOTAL</td>
            <td>' . number_format($report['totals']['gross'], 3) . '</td>
            <td>' . number_format($report['totals']['tare'], 3) . '</td>
            <td>' . number_format($report['totals']['net'], 3) . '</td>
            <td>' . $report['totals']['cones'] . '</td>
        </tr>
        </tbody>
    </table>
    
    <div class="signatures">
        <div class="signature">
            <div class="signature-line"></div>
            <p>Prepared By</p>
        </div>
        <div class="signature">
            <div class="signature-line"></div>
            <p>Checked By</p>
        </div>
        <div class="signature">
            <div class="signature-line"></div>
            <p>Authorized Signatory</p>
        </div>
    </div>
</body>
</html>';
        
        // Return HTML for the frontend to convert to PDF
        header('Content-Type: application/json');
        echo json_encode(['html' => $html]);
        exit;
    }
} catch (PDOException $e) {
    error('Error generating export: ' . $e->getMessage());
}