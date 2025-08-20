import os
import sys
import subprocess

def run_command(command, cwd=None):
    """Run a shell command and return its output."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Error: {e.stderr}")
        sys.exit(1)

def main():
    print("=== Setting up PLATERA Restaurant Management System ===\n")
    
    # Install required packages
    print("1. Installing required packages...")
    run_command("python -m pip install --upgrade pip")
    run_command("python -m pip install -r requirements.txt")
    
    # Run migrations
    print("\n2. Running database migrations...")
    run_command("python manage.py migrate")
    
    # Create admin user if it doesn't exist
    print("\n3. Creating admin user...")
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123',
            user_type='admin',
            first_name='Admin',
            last_name='User'
        )
        print("   Created admin user with username 'admin' and password 'admin123'")
    else:
        print("   Admin user already exists.")
    
    # Create manager user if it doesn't exist
    if not User.objects.filter(username='manager').exists():
        User.objects.create_user(
            username='manager',
            email='manager@example.com',
            password='manager123',
            user_type='manager',
            first_name='Restaurant',
            last_name='Manager'
        )
        print("   Created manager user with username 'manager' and password 'manager123'")
    else:
        print("   Manager user already exists.")
    
    # Create staff user if it doesn't exist
    if not User.objects.filter(username='staff1').exists():
        staff = User.objects.create_user(
            username='staff1',
            email='staff1@example.com',
            password='staff123',
            user_type='staff',
            first_name='John',
            last_name='Doe'
        )
        print("   Created staff user with username 'staff1' and password 'staff123'")
    else:
        print("   Staff user already exists.")
    
    print("\n=== Setup Complete! ===")
    print("\nYou can now start the development server with:")
    print("  python manage.py runserver")
    print("\nAccess the admin interface at: http://127.0.0.1:8000/admin/")
    print("Admin credentials:")
    print("  Username: admin")
    print("  Password: admin123")
    print("\nIMPORTANT: Change these default passwords after first login!")

if __name__ == "__main__":
    # Set up Django environment
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'platera_project.settings')
    
    # Add current directory to Python path
    sys.path.insert(0, os.getcwd())
    
    # Initialize Django
    import django
    django.setup()
    
    # Run the setup
    main()
