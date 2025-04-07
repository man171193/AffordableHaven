# PHP Implementation for Shared Hosting

This document explains how to deploy the Packing Report Application to a shared hosting environment using PHP.

## Overview

The application has been developed as a React SPA (Single Page Application) with a Node.js/Express backend. For shared hosting environments that don't support Node.js, we've created a PHP implementation that mimics the original API endpoints.

## Structure

- `index.php` - Entry point that serves the React application and routes API requests
- `api/config.php` - Database configuration and utility functions
- `api/setup.php` - Script to create database tables
- `api/seed.php` - Script to add sample data
- `api/clients.php` - Client CRUD operations
- `api/qualities.php` - Quality CRUD operations
- `api/reports.php` - Report CRUD operations with report items
- `.htaccess` - Apache configuration for routing

## Database Setup

1. Create a MySQL database in your hosting panel
2. Update the database connection details in `api/config.php`:
   ```php
   $host = 'localhost'; // Replace with your database host
   $dbname = 'packing_reports'; // Replace with your database name
   $username = 'db_user'; // Replace with your database username
   $password = 'db_password'; // Replace with your database password
   ```
3. Run the `api/setup.php` script by visiting `https://your-domain.com/api/setup.php` to create the database tables
4. Optional: Run the `api/seed.php` script by visiting `https://your-domain.com/api/seed.php` to add sample data

## Deployment Steps

1. Build the React application:
   ```bash
   cd client
   npm run build
   ```

2. Upload the following files to your hosting environment:
   - The entire `/dist` folder contents (from the React build)
   - `index.php`
   - `.htaccess`
   - The entire `/api` folder

3. Make sure the PHP version on your hosting is 7.4 or above

## API Endpoints

The PHP implementation provides the following API endpoints:

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients?search=term` - Search clients by name
- `GET /api/clients?id=1` - Get a specific client
- `POST /api/clients` - Create a new client
- `PUT /api/clients?id=1` - Update a client
- `DELETE /api/clients?id=1` - Delete a client

### Qualities
- `GET /api/qualities` - Get all qualities
- `GET /api/qualities?search=term` - Search qualities by name
- `GET /api/qualities?id=1` - Get a specific quality
- `POST /api/qualities` - Create a new quality
- `PUT /api/qualities?id=1` - Update a quality
- `DELETE /api/qualities?id=1` - Delete a quality

### Reports
- `GET /api/reports` - Get all reports
- `GET /api/reports?clientId=1&qualityName=name&startDate=date&endDate=date&searchTerm=term` - Filter/search reports
- `GET /api/reports?id=1` - Get a specific report with items
- `POST /api/reports` - Create a new report with items
- `DELETE /api/reports?id=1` - Delete a report with its items

## Front-end Adaptations

The front-end has been modified to work with the PHP API endpoints:

1. Changed the way requests are made to use query parameters instead of REST-style path parameters
2. Updated error handling to match PHP API response format
3. Modified the way authentication works (removed authentication requirement)

## Troubleshooting

- **Database Connection Issues**: Check the database credentials in `api/config.php`
- **Permission Errors**: Make sure the PHP files have proper permissions (usually 644)
- **Routing Issues**: Verify that `.htaccess` is uploaded and that your hosting supports `.htaccess` files
- **API Not Working**: Check that `mod_rewrite` is enabled on your Apache server