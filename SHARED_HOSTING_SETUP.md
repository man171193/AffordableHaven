# Shared Hosting Setup Guide

This document provides a step-by-step guide for setting up the Packing Report System on a shared hosting environment like Hostinger.

## Prerequisites

- A shared hosting account with:
  - PHP 7.4 or higher
  - MySQL database
  - .htaccess support

## Step 1: Create a Database

1. Log in to your hosting control panel (e.g., cPanel, Plesk, Hostinger hPanel)
2. Navigate to the MySQL Databases section
3. Create a new database (e.g., `packing_reports`)
4. Create a new database user with a strong password
5. Assign the user to the database with all privileges

Note down the database name, username, and password for later use.

## Step 2: Upload Files

There are two ways to upload the application files:

### Option A: Using the Deployment Script (Recommended)

1. Download the project to your local machine
2. Run the deployment script:
   - On Windows: `deploy-to-shared-hosting.bat`
   - On Linux/Mac: `./deploy-to-shared-hosting.sh`
3. Upload all files from the created `deploy` directory to your hosting environment (public_html or www folder)

### Option B: Manual Upload

1. Build the React application locally:
   ```
   cd client
   npm run build
   ```
2. Upload the following files to your hosting environment:
   - All files in the `client/dist` directory (to the `dist` folder)
   - All PHP files in the `api` directory (to the `api` folder)
   - `index.php` and `.htaccess` to the root folder
   - The company logo to the `attached_assets` folder

## Step 3: Configure Database Connection

1. Edit the `api/config.php` file with your database information:
   ```php
   $host = 'localhost'; // Usually 'localhost'
   $dbname = 'your_database_name'; // The database name you created
   $username = 'your_database_user'; // The database user
   $password = 'your_database_password'; // The database password
   ```

## Step 4: Set Up Database Tables

1. Visit `https://your-domain.com/api/setup.php` in your browser
2. You should see a success message indicating that the tables were created

## Step 5: Add Sample Data (Optional)

1. Visit `https://your-domain.com/api/seed.php` in your browser
2. This will populate the database with sample clients and qualities

## Step 6: Access the Application

1. Visit `https://your-domain.com` in your browser
2. You should see the Packing Report System application

## Troubleshooting

### Application Not Loading

- Check that all files are uploaded to the correct locations
- Verify that your hosting supports PHP 7.4 or higher
- Ensure that .htaccess files are enabled on your server

### Database Connection Issues

- Verify the database credentials in `api/config.php`
- Check that the database user has the necessary permissions
- Try connecting to the database using a tool like phpMyAdmin

### API Errors

- Check the PHP error logs in your hosting control panel
- Make sure all PHP files were uploaded correctly
- Verify that the database tables were created properly

## Customization

### Company Information

To update the company details displayed on reports:

1. Edit the `api/exports.php` file
2. Update the following lines:
   ```php
   $companyName = 'MYCITIUS TEX PRIVATE LIMITED';
   $companyAddress = 'Shed No.B-12, Dada Patil Wadi, Dada Patil Road, Chinchpada, Bhiwandi - 421101';
   $companyGST = 'GSTIN: 27AAECM7952M1ZU';
   ```

### Company Logo

To change the company logo:

1. Replace the file at `attached_assets/MCT_GRS_LOGO_NEW.1-removebg-preview.png` with your logo
2. Make sure to keep the same filename or update it in the `api/exports.php` file