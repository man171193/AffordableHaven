# Packing Report System

A dynamic web application for creating and managing packing reports/delivery challans. This system allows users to track shipments, generate professional reports, and maintain client and quality information.

## Features

- **Client Management**: Add, edit, and store client information
- **Quality Management**: Track quality specifications like denier, blend, and shade
- **Report Creation**: Generate detailed packing reports with item information
- **Multiple Outputs**: Export reports as PDF or Excel documents
- **Search & Filter**: Find historical reports by client, date, or quality
- **Auto-calculation**: Net weights are calculated automatically
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

This application is built using:

### Development Stack
- **Frontend**: React, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Node.js, Express, or PHP
- **Database**: PostgreSQL or MySQL
- **PDF Generation**: Client-side HTML to PDF conversion
- **Excel Generation**: SheetJS for client-side Excel generation

### Deployment Options

The system can be deployed in two ways:

#### 1. Node.js Deployment (Recommended for Managed Hosting)
- Requires Node.js hosting environment
- Uses the Express backend
- Full single-page application experience

#### 2. PHP Deployment (For Shared Hosting)
- Compatible with standard shared hosting environments
- Uses PHP backend API endpoints
- Same React frontend served via PHP

## Deployment Instructions

### Node.js Deployment

1. Clone the repository
2. Run `npm install` to install dependencies
3. Configure environment variables
4. Run `npm run build` to create production build
5. Start the server with `npm start`

### PHP Deployment

1. Clone the repository
2. Run `npm run build` to create production build
3. Upload the built files and PHP API files to your hosting environment
4. Configure database settings in `api/config.php`
5. Visit `https://your-domain.com/api/setup.php` to set up the database

See `PHP_IMPLEMENTATION.md` for detailed PHP deployment instructions.

## Database Configuration

The application requires a database to store client, quality, and report information:

1. Create a new database
2. Set the database connection details:
   - For Node.js: use environment variables
   - For PHP: edit `api/config.php`
3. The tables will be created automatically when running:
   - Node.js: when the application starts
   - PHP: when visiting the setup script

## Usage Guide

### Adding Clients and Qualities

Before creating reports, add client and quality information:

1. Navigate to the Create Report page
2. Click "Add New Client" to add a client
3. Click "Add New Quality" to add a quality specification

### Creating a Report

1. Select a client from the dropdown
2. Enter the challan number or use the auto-generated one
3. Select a quality from the dropdown
4. Enter the bag details (gross weight, tare weight, cones)
5. Click "Add Item" to add to the report
6. Repeat steps 3-5 for additional items
7. Click "Save Report" when complete

### Viewing Reports

1. Go to the Report History page
2. Use filters to search for specific reports
3. Click on a report to view details
4. Export to PDF or Excel as needed

## Customization

- Company logo can be replaced in the assets folder
- Company details can be updated in the exports configuration

## License

This project is licensed under proprietary terms. All rights reserved.

## Support

For support and customization requests, please contact:
- Email: developers@mycitiustex.com
- Phone: +91-XXXXXXXXXX