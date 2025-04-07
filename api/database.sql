-- Database schema for Packing Report System

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create qualities table
CREATE TABLE IF NOT EXISTS qualities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    denier INT NOT NULL,
    blend VARCHAR(50) NOT NULL,
    shade_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_date DATE NOT NULL,
    client_id INT NOT NULL,
    challan_no INT NOT NULL,
    quality_name VARCHAR(50) NOT NULL,
    shade_number VARCHAR(50),
    denier INT NOT NULL,
    blend VARCHAR(50) NOT NULL,
    lot_number INT NOT NULL,
    total_bags INT NOT NULL,
    total_gross_weight DECIMAL(10,3) NOT NULL,
    total_tare_weight DECIMAL(10,3) NOT NULL,
    total_net_weight DECIMAL(10,3) NOT NULL,
    total_cones INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Create report_items table
CREATE TABLE IF NOT EXISTS report_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT NOT NULL,
    bag_no INT NOT NULL,
    gross_weight DECIMAL(10,3) NOT NULL,
    tare_weight DECIMAL(10,3) NOT NULL,
    net_weight DECIMAL(10,3) NOT NULL,
    cones INT NOT NULL,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);