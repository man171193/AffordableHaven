<?php
// api/qualities.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Handle quality by ID operations
if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    
    switch ($method) {
        case 'GET':
            // Get a single quality
            try {
                $stmt = $pdo->prepare('SELECT * FROM qualities WHERE id = ?');
                $stmt->execute([$id]);
                $quality = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$quality) {
                    error('Quality not found', 404);
                }
                
                response($quality);
            } catch (PDOException $e) {
                error('Error fetching quality: ' . $e->getMessage());
            }
            break;
            
        case 'PUT':
            // Update a quality
            try {
                if (empty($_POST['name']) || !isset($_POST['denier']) || !isset($_POST['blend'])) {
                    error('Name, denier, and blend are required', 400);
                }
                
                $stmt = $pdo->prepare('UPDATE qualities SET name = ?, denier = ?, blend = ?, shade_number = ? WHERE id = ?');
                $result = $stmt->execute([
                    $_POST['name'], 
                    $_POST['denier'], 
                    $_POST['blend'], 
                    $_POST['shade_number'] ?? null, 
                    $id
                ]);
                
                if (!$result) {
                    error('Failed to update quality');
                }
                
                // Return the updated quality
                $stmt = $pdo->prepare('SELECT * FROM qualities WHERE id = ?');
                $stmt->execute([$id]);
                $quality = $stmt->fetch(PDO::FETCH_ASSOC);
                
                response($quality);
            } catch (PDOException $e) {
                error('Error updating quality: ' . $e->getMessage());
            }
            break;
            
        case 'DELETE':
            // Delete a quality
            try {
                // Check if quality exists
                $stmt = $pdo->prepare('SELECT id FROM qualities WHERE id = ?');
                $stmt->execute([$id]);
                
                if ($stmt->rowCount() === 0) {
                    error('Quality not found', 404);
                }
                
                // Check if quality is used in any report items
                $stmt = $pdo->prepare('SELECT ri.id FROM report_items ri
                                      JOIN reports r ON ri.report_id = r.id
                                      WHERE ri.quality_name = (SELECT name FROM qualities WHERE id = ?)');
                $stmt->execute([$id]);
                
                if ($stmt->rowCount() > 0) {
                    error('Cannot delete quality because it is used in one or more reports', 400);
                }
                
                // Delete the quality
                $stmt = $pdo->prepare('DELETE FROM qualities WHERE id = ?');
                $result = $stmt->execute([$id]);
                
                if (!$result) {
                    error('Failed to delete quality');
                }
                
                response(['success' => true, 'message' => 'Quality deleted successfully']);
            } catch (PDOException $e) {
                error('Error deleting quality: ' . $e->getMessage());
            }
            break;
            
        default:
            error('Method not allowed', 405);
    }
} else {
    // Handle collection operations
    switch ($method) {
        case 'GET':
            // Get all qualities or search
            try {
                $sql = 'SELECT * FROM qualities';
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
                $qualities = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                response($qualities);
            } catch (PDOException $e) {
                error('Error fetching qualities: ' . $e->getMessage());
            }
            break;
            
        case 'POST':
            // Create a new quality
            try {
                if (empty($_POST['name']) || !isset($_POST['denier']) || !isset($_POST['blend'])) {
                    error('Name, denier, and blend are required', 400);
                }
                
                // Check if quality with the same name already exists
                $stmt = $pdo->prepare('SELECT id FROM qualities WHERE name = ?');
                $stmt->execute([$_POST['name']]);
                
                if ($stmt->rowCount() > 0) {
                    error('A quality with this name already exists', 400);
                }
                
                $stmt = $pdo->prepare('INSERT INTO qualities (name, denier, blend, shade_number) VALUES (?, ?, ?, ?)');
                $result = $stmt->execute([
                    $_POST['name'], 
                    $_POST['denier'], 
                    $_POST['blend'], 
                    $_POST['shade_number'] ?? null
                ]);
                
                if (!$result) {
                    error('Failed to create quality');
                }
                
                // Return the newly created quality
                $id = $pdo->lastInsertId();
                $stmt = $pdo->prepare('SELECT * FROM qualities WHERE id = ?');
                $stmt->execute([$id]);
                $quality = $stmt->fetch(PDO::FETCH_ASSOC);
                
                response($quality, 201);
            } catch (PDOException $e) {
                error('Error creating quality: ' . $e->getMessage());
            }
            break;
            
        default:
            error('Method not allowed', 405);
    }
}