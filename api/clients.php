<?php
// api/clients.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Handle client by ID operations
if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    
    switch ($method) {
        case 'GET':
            // Get a single client
            try {
                $stmt = $pdo->prepare('SELECT * FROM clients WHERE id = ?');
                $stmt->execute([$id]);
                $client = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$client) {
                    error('Client not found', 404);
                }
                
                response($client);
            } catch (PDOException $e) {
                error('Error fetching client: ' . $e->getMessage());
            }
            break;
            
        case 'PUT':
            // Update a client
            try {
                if (empty($_POST['name']) || empty($_POST['address'])) {
                    error('Name and address are required', 400);
                }
                
                $stmt = $pdo->prepare('UPDATE clients SET name = ?, address = ? WHERE id = ?');
                $result = $stmt->execute([$_POST['name'], $_POST['address'], $id]);
                
                if (!$result) {
                    error('Failed to update client');
                }
                
                // Return the updated client
                $stmt = $pdo->prepare('SELECT * FROM clients WHERE id = ?');
                $stmt->execute([$id]);
                $client = $stmt->fetch(PDO::FETCH_ASSOC);
                
                response($client);
            } catch (PDOException $e) {
                error('Error updating client: ' . $e->getMessage());
            }
            break;
            
        case 'DELETE':
            // Delete a client
            try {
                // Check if client exists
                $stmt = $pdo->prepare('SELECT id FROM clients WHERE id = ?');
                $stmt->execute([$id]);
                
                if ($stmt->rowCount() === 0) {
                    error('Client not found', 404);
                }
                
                // Check if client is used in any reports
                $stmt = $pdo->prepare('SELECT id FROM reports WHERE client_id = ?');
                $stmt->execute([$id]);
                
                if ($stmt->rowCount() > 0) {
                    error('Cannot delete client because it is used in one or more reports', 400);
                }
                
                // Delete the client
                $stmt = $pdo->prepare('DELETE FROM clients WHERE id = ?');
                $result = $stmt->execute([$id]);
                
                if (!$result) {
                    error('Failed to delete client');
                }
                
                response(['success' => true, 'message' => 'Client deleted successfully']);
            } catch (PDOException $e) {
                error('Error deleting client: ' . $e->getMessage());
            }
            break;
            
        default:
            error('Method not allowed', 405);
    }
} else {
    // Handle collection operations
    switch ($method) {
        case 'GET':
            // Get all clients or search
            try {
                $sql = 'SELECT * FROM clients';
                $params = [];
                
                // Handle search by name
                if (isset($_GET['search'])) {
                    $search = $_GET['search'];
                    $sql .= ' WHERE name LIKE ?';
                    $params[] = "%$search%";
                }
                
                $sql .= ' ORDER BY name ASC';
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                response($clients);
            } catch (PDOException $e) {
                error('Error fetching clients: ' . $e->getMessage());
            }
            break;
            
        case 'POST':
            // Create a new client
            try {
                if (empty($_POST['name']) || empty($_POST['address'])) {
                    error('Name and address are required', 400);
                }
                
                // Check if client with the same name already exists
                $stmt = $pdo->prepare('SELECT id FROM clients WHERE name = ?');
                $stmt->execute([$_POST['name']]);
                
                if ($stmt->rowCount() > 0) {
                    error('A client with this name already exists', 400);
                }
                
                $stmt = $pdo->prepare('INSERT INTO clients (name, address) VALUES (?, ?)');
                $result = $stmt->execute([$_POST['name'], $_POST['address']]);
                
                if (!$result) {
                    error('Failed to create client');
                }
                
                // Return the newly created client
                $id = $pdo->lastInsertId();
                $stmt = $pdo->prepare('SELECT * FROM clients WHERE id = ?');
                $stmt->execute([$id]);
                $client = $stmt->fetch(PDO::FETCH_ASSOC);
                
                response($client, 201);
            } catch (PDOException $e) {
                error('Error creating client: ' . $e->getMessage());
            }
            break;
            
        default:
            error('Method not allowed', 405);
    }
}