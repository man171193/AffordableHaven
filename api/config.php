<?php
// Database connection settings
$host = 'localhost'; // Replace with your database host
$dbname = 'packing_reports'; // Replace with your database name
$username = 'db_user'; // Replace with your database username
$password = 'db_password'; // Replace with your database password

try {
    // Create PDO connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    
    // Set error mode to exceptions
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Use actual prepared statements (not emulated)
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    
} catch(PDOException $e) {
    die('Database connection failed: ' . $e->getMessage());
}

// Helper functions for API responses
function response($data, $status = 200) {
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function error($message, $status = 500) {
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}

// Parse JSON input for POST/PUT requests
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = file_get_contents('php://input');
    if (!empty($input)) {
        $_POST = json_decode($input, true);
    }
}