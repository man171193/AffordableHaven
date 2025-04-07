<?php
// This file serves the React frontend
// Request to /api/* will be handled by the PHP API files

// Define API route handling
$request_uri = $_SERVER['REQUEST_URI'];

// Handle API requests
if (strpos($request_uri, '/api/') === 0) {
    // Extract the API endpoint
    $endpoint = substr($request_uri, 5); // Remove '/api/'
    $endpoint = strtok($endpoint, '?'); // Remove query string if present
    
    // Map endpoint to PHP file
    $file_path = '';
    
    if ($endpoint === 'clients' || strpos($endpoint, 'clients/') === 0) {
        $file_path = 'api/clients.php';
    } elseif ($endpoint === 'qualities' || strpos($endpoint, 'qualities/') === 0) {
        $file_path = 'api/qualities.php';
    } elseif ($endpoint === 'reports' || strpos($endpoint, 'reports/') === 0) {
        $file_path = 'api/reports.php';
    } elseif ($endpoint === 'seed') {
        $file_path = 'api/seed.php';
    }
    
    // Handle ID parameter for REST endpoints
    if (preg_match('~^(clients|qualities|reports)/(\d+)$~', $endpoint, $matches)) {
        $_GET['id'] = $matches[2];
    }
    
    if ($file_path) {
        // Include the API file to handle the request
        include $file_path;
        exit;
    } else {
        // API endpoint not found
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'API endpoint not found']);
        exit;
    }
}

// For all other requests, serve the React app
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Packing Report System</title>
    <!-- Include built CSS -->
    <link rel="stylesheet" href="/dist/assets/index.css">
</head>
<body>
    <div id="root"></div>
    <!-- Include built JS -->
    <script src="/dist/assets/index.js"></script>
</body>
</html>