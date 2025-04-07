<?php
// api/reports.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Handle report by ID operations
if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    
    switch ($method) {
        case 'GET':
            // Get a single report with its items
            try {
                // Get the report
                $stmt = $pdo->prepare('
                    SELECT r.*, c.name as client_name 
                    FROM reports r
                    LEFT JOIN clients c ON r.client_id = c.id
                    WHERE r.id = ?
                ');
                $stmt->execute([$id]);
                $report = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$report) {
                    error('Report not found', 404);
                }
                
                // Get the report items
                $stmt = $pdo->prepare('SELECT * FROM report_items WHERE report_id = ? ORDER BY id ASC');
                $stmt->execute([$id]);
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Combine report and items
                $report['items'] = $items;
                
                response($report);
            } catch (PDOException $e) {
                error('Error fetching report: ' . $e->getMessage());
            }
            break;
            
        case 'DELETE':
            // Delete a report and its items
            try {
                // Begin transaction
                $pdo->beginTransaction();
                
                // Check if report exists
                $stmt = $pdo->prepare('SELECT id FROM reports WHERE id = ?');
                $stmt->execute([$id]);
                
                if ($stmt->rowCount() === 0) {
                    $pdo->rollBack();
                    error('Report not found', 404);
                }
                
                // Delete report items first
                $stmt = $pdo->prepare('DELETE FROM report_items WHERE report_id = ?');
                $stmt->execute([$id]);
                
                // Delete the report
                $stmt = $pdo->prepare('DELETE FROM reports WHERE id = ?');
                $result = $stmt->execute([$id]);
                
                if (!$result) {
                    $pdo->rollBack();
                    error('Failed to delete report');
                }
                
                // Commit transaction
                $pdo->commit();
                
                response(['success' => true, 'message' => 'Report deleted successfully']);
            } catch (PDOException $e) {
                $pdo->rollBack();
                error('Error deleting report: ' . $e->getMessage());
            }
            break;
            
        default:
            error('Method not allowed', 405);
    }
} else {
    // Handle collection operations
    switch ($method) {
        case 'GET':
            // Get all reports with search/filter capabilities
            try {
                $params = [];
                
                $sql = '
                    SELECT r.*, c.name as client_name 
                    FROM reports r
                    LEFT JOIN clients c ON r.client_id = c.id
                    WHERE 1=1
                ';
                
                // Filter by client ID
                if (isset($_GET['clientId']) && $_GET['clientId']) {
                    $sql .= ' AND r.client_id = ?';
                    $params[] = $_GET['clientId'];
                }
                
                // Filter by quality name
                if (isset($_GET['qualityName']) && $_GET['qualityName']) {
                    $sql .= ' AND r.id IN (
                        SELECT DISTINCT report_id FROM report_items
                        WHERE quality_name = ?
                    )';
                    $params[] = $_GET['qualityName'];
                }
                
                // Filter by date range
                if (isset($_GET['startDate']) && $_GET['startDate']) {
                    $sql .= ' AND r.report_date >= ?';
                    $params[] = $_GET['startDate'];
                }
                
                if (isset($_GET['endDate']) && $_GET['endDate']) {
                    $sql .= ' AND r.report_date <= ?';
                    $params[] = $_GET['endDate'];
                }
                
                // Search by challan number or client name
                if (isset($_GET['searchTerm']) && $_GET['searchTerm']) {
                    $search = $_GET['searchTerm'];
                    $sql .= ' AND (r.challan_no LIKE ? OR c.name LIKE ?)';
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                }
                
                $sql .= ' ORDER BY r.report_date DESC, r.id DESC';
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                response($reports);
            } catch (PDOException $e) {
                error('Error fetching reports: ' . $e->getMessage());
            }
            break;
            
        case 'POST':
            // Create a new report with items
            try {
                // Validate input data
                if (empty($_POST['client_id']) || !isset($_POST['challan_no']) || 
                    empty($_POST['report_date']) || empty($_POST['items']) || 
                    !is_array($_POST['items'])) {
                    error('Missing required fields', 400);
                }
                
                // Begin transaction
                $pdo->beginTransaction();
                
                // Get the next challan number if not provided
                if (empty($_POST['challan_no'])) {
                    $stmt = $pdo->query('SELECT MAX(challan_no) as max_challan FROM reports');
                    $result = $stmt->fetch(PDO::FETCH_ASSOC);
                    $challanNo = $result['max_challan'] ? $result['max_challan'] + 1 : 1;
                } else {
                    $challanNo = $_POST['challan_no'];
                }
                
                // Check client exists
                $stmt = $pdo->prepare('SELECT id FROM clients WHERE id = ?');
                $stmt->execute([$_POST['client_id']]);
                
                if ($stmt->rowCount() === 0) {
                    $pdo->rollBack();
                    error('Client not found', 400);
                }
                
                // Insert report
                $stmt = $pdo->prepare('
                    INSERT INTO reports (
                        client_id, challan_no, report_date, vehicle_no, driver_name, 
                        destination, purpose
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ');
                
                $result = $stmt->execute([
                    $_POST['client_id'],
                    $challanNo,
                    $_POST['report_date'],
                    $_POST['vehicle_no'] ?? null,
                    $_POST['driver_name'] ?? null,
                    $_POST['destination'] ?? null,
                    $_POST['purpose'] ?? null
                ]);
                
                if (!$result) {
                    $pdo->rollBack();
                    error('Failed to create report');
                }
                
                $reportId = $pdo->lastInsertId();
                
                // Insert report items
                foreach ($_POST['items'] as $item) {
                    if (empty($item['quality_name']) || !isset($item['bag_no']) || 
                        !isset($item['gross_weight']) || !isset($item['tare_weight']) || 
                        !isset($item['net_weight']) || !isset($item['cones'])) {
                        $pdo->rollBack();
                        error('Invalid item data', 400);
                    }
                    
                    $stmt = $pdo->prepare('
                        INSERT INTO report_items (
                            report_id, bag_no, quality_name, denier, blend, lot_number,
                            shade_number, gross_weight, tare_weight, net_weight, cones
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ');
                    
                    $result = $stmt->execute([
                        $reportId,
                        $item['bag_no'],
                        $item['quality_name'],
                        $item['denier'] ?? null,
                        $item['blend'] ?? null,
                        $item['lot_number'] ?? null,
                        $item['shade_number'] ?? null,
                        $item['gross_weight'],
                        $item['tare_weight'],
                        $item['net_weight'],
                        $item['cones']
                    ]);
                    
                    if (!$result) {
                        $pdo->rollBack();
                        error('Failed to create report item');
                    }
                }
                
                // Commit transaction
                $pdo->commit();
                
                // Return the new report
                $stmt = $pdo->prepare('
                    SELECT r.*, c.name as client_name 
                    FROM reports r
                    LEFT JOIN clients c ON r.client_id = c.id
                    WHERE r.id = ?
                ');
                $stmt->execute([$reportId]);
                $report = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Get the report items
                $stmt = $pdo->prepare('SELECT * FROM report_items WHERE report_id = ? ORDER BY id ASC');
                $stmt->execute([$reportId]);
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Combine report and items
                $report['items'] = $items;
                
                response($report, 201);
            } catch (PDOException $e) {
                $pdo->rollBack();
                error('Error creating report: ' . $e->getMessage());
            }
            break;
            
        default:
            error('Method not allowed', 405);
    }
}