#!/bin/bash

# Exit on error
set -e

echo "=== PLATERA Restaurant Management System Setup ==="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed. Please install Python 3 and try again."
    exit 1
fi

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "1. Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    
    echo "2. Upgrading pip and installing dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
else
    echo "1. Using existing virtual environment..."
    source venv/bin/activate
fi

# Set environment variables
export DJANGO_SETTINGS_MODULE=platera_project.settings
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "3. Creating .env file with default values..."
    ./create_env.sh
    echo "   Please review the .env file and update any settings if needed."
fi

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Create admin user
echo "Creating admin user..."
python manage.py setup_admin

echo ""
echo "Setup complete!"
echo "To start the development server, run:"
echo "  source venv/bin/activate"
echo "  python manage.py runserver"
echo ""
echo "Admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Manager credentials:"
echo "  Username: manager"
echo "  Password: manager123"
echo ""
echo "Staff credentials:"
echo "  Username: staff1"
echo "  Password: staff123"
echo ""
echo "IMPORTANT: Change these default passwords after first login!"
