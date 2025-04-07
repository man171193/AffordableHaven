#!/bin/bash

echo "==================================================="
echo "   Packing Report System - Deployment Helper"
echo "==================================================="
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js before running this script."
    exit 1
fi

# Build the React application
echo "Building the React application..."
cd client
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build the React application."
    exit 1
fi
cd ..

# Create a deployment directory
echo "Creating deployment directory..."
rm -rf deploy
mkdir -p deploy/api
mkdir -p deploy/dist

# Copy PHP files
echo "Copying PHP API files..."
cp api/*.php deploy/api/
cp index.php deploy/index.php
cp .htaccess deploy/.htaccess

# Copy built React files
echo "Copying built React files..."
cp -r client/dist/* deploy/dist/

# Copy company logo
echo "Copying company logo..."
mkdir -p deploy/attached_assets
cp attached_assets/MCT_GRS_LOGO_NEW.1-removebg-preview.png deploy/attached_assets/

echo
echo "==================================================="
echo "Deployment package created successfully!"
echo
echo "The deployment package is in the 'deploy' directory."
echo
echo "Next steps:"
echo "1. Upload all files in the 'deploy' directory to your web hosting"
echo "2. Edit 'api/config.php' with your database details"
echo "3. Visit your-domain.com/api/setup.php to set up the database tables"
echo "4. Optional: Visit your-domain.com/api/seed.php to add sample data"
echo "==================================================="

# Make the script executable
chmod +x deploy-to-shared-hosting.sh