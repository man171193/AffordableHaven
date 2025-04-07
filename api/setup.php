<?php
// api/setup.php - Script to create database tables
require_once 'config.php';

try {
    // Create clients table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS clients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            address TEXT NOT NULL
        ) ENGINE=InnoDB;
    ");
    
    // Create qualities table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS qualities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            denier INT NOT NULL,
            blend VARCHAR(255) NOT NULL,
            shade_number VARCHAR(50) NULL
        ) ENGINE=InnoDB;
    ");
    
    // Create reports table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            client_id INT NOT NULL,
            challan_no INT NOT NULL,
            report_date DATE NOT NULL,
            vehicle_no VARCHAR(50) NULL,
            driver_name VARCHAR(100) NULL,
            destination VARCHAR(255) NULL,
            purpose VARCHAR(255) NULL,
            FOREIGN KEY (client_id) REFERENCES clients(id)
        ) ENGINE=InnoDB;
    ");
    
    // Create report_items table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS report_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            report_id INT NOT NULL,
            bag_no INT NOT NULL,
            quality_name VARCHAR(255) NOT NULL,
            denier INT NULL,
            blend VARCHAR(255) NULL,
            lot_number INT NULL,
            shade_number VARCHAR(50) NULL,
            gross_weight DECIMAL(10,3) NOT NULL,
            tare_weight DECIMAL(10,3) NOT NULL,
            net_weight DECIMAL(10,3) NOT NULL,
            cones INT NOT NULL,
            FOREIGN KEY (report_id) REFERENCES reports(id)
        ) ENGINE=InnoDB;
    ");
    
    echo "Database tables created successfully!";
} catch (PDOException $e) {
    die("Error creating tables: " . $e->getMessage());
}