<?php
// api/seed.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    error('Method not allowed', 405);
}

try {
    // Sample clients
    $clients = [
        ['name' => '3AT INDIA INC', 'address' => '123 Industrial Area, Phase 1, New Delhi - 110001, India'],
        ['name' => 'ABDUL SAMAD SHABAN', 'address' => '45 Cotton Street, Mumbai - 400001, India'],
        ['name' => 'DICITEX FURNISHING PVT LTD', 'address' => 'Plot No. 15, MIDC, Andheri East, Mumbai - 400093, India'],
        ['name' => 'EASTERN SILK INDUSTRIES LIMITED', 'address' => '7 Silk Center, Bangalore - 560001, India'],
        ['name' => 'FAZE THREE LTD', 'address' => '29 Textile Park, Surat - 395003, Gujarat, India']
    ];
    
    // Sample qualities
    $qualities = [
        ['name' => 'Rct 277', 'denier' => 200, 'blend' => '2000', 'shade_number' => 'S001'],
        ['name' => 'Plt 193', 'denier' => 150, 'blend' => '1500', 'shade_number' => 'S002'],
        ['name' => 'Vct 452', 'denier' => 300, 'blend' => '3000', 'shade_number' => 'S003'],
        ['name' => 'Kct 385', 'denier' => 250, 'blend' => '2500', 'shade_number' => 'S004']
    ];
    
    // Insert clients
    foreach ($clients as $client) {
        $stmt = $pdo->prepare('SELECT id FROM clients WHERE name = ?');
        $stmt->execute([$client['name']]);
        
        if ($stmt->rowCount() === 0) {
            $stmt = $pdo->prepare('INSERT INTO clients (name, address) VALUES (?, ?)');
            $stmt->execute([$client['name'], $client['address']]);
        }
    }
    
    // Insert qualities
    foreach ($qualities as $quality) {
        $stmt = $pdo->prepare('SELECT id FROM qualities WHERE name = ?');
        $stmt->execute([$quality['name']]);
        
        if ($stmt->rowCount() === 0) {
            $stmt = $pdo->prepare('INSERT INTO qualities (name, denier, blend, shade_number) VALUES (?, ?, ?, ?)');
            $stmt->execute([$quality['name'], $quality['denier'], $quality['blend'], $quality['shade_number']]);
        }
    }
    
    response(['message' => 'Database seeded successfully']);
} catch (PDOException $e) {
    error('Error seeding database: ' . $e->getMessage());
}