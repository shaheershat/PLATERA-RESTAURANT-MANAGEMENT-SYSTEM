import os
import sys
import subprocess
import venv
import shutil

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

def create_virtualenv():
    """Create a Python virtual environment."""
    print("1. Creating Python virtual environment...")
    venv_dir = os.path.join(os.getcwd(), 'venv')
    if not os.path.exists(venv_dir):
        venv.create(venv_dir, with_pip=True)
    return venv_dir

def install_dependencies():
    """Install Python dependencies."""
    print("2. Installing dependencies...")
    pip_path = os.path.join('venv', 'bin', 'pip')
    if not os.path.exists(pip_path):
        pip_path = os.path.join('venv', 'Scripts', 'pip')
    
    # Upgrade pip
    run_command(f"{pip_path} install --upgrade pip")
    
    # Install requirements
    if os.path.exists('requirements.txt'):
        run_command(f"{pip_path} install -r requirements.txt")
    else:
        print("Warning: requirements.txt not found. Skipping dependency installation.")

def create_env_file():
    """Create .env file if it doesn't exist."""
    env_file = '.env'
    if not os.path.exists(env_file):
        print("3. Creating .env file...")
        with open(env_file, 'w') as f:
            f.write("# Django Settings\n")
            f.write("DEBUG=True\n")
            f.write("SECRET_KEY=your-secret-key-here\n")
            f.write("ALLOWED_HOSTS=localhost,127.0.0.1\n\n")
            f.write("# Database\n")
            f.write("DB_NAME=platera\n")
            f.write("DB_USER=postgres\n")
            f.write("DB_PASSWORD=postgres\n")
            f.write("DB_HOST=localhost\n")
            f.write("DB_PORT=5432\n\n")
            f.write("# CORS\n")
            f.write("CORS_ALLOW_ALL_ORIGINS=True\n")
            f.write("CORS_ALLOW_CREDENTIALS=True\n")
            f.write("CORS_ALLOWED_ORIGINS=http://localhost:3000\n\n")
            f.write("# JWT\n")
            f.write("JWT_ACCESS_TOKEN_LIFETIME=60\n")
            f.write("JWT_REFRESH_TOKEN_LIFETIME=1440\n")
            f.write("JWT_ROTATE_REFRESH_TOKENS=True\n")
            f.write("JWT_BLACKLIST_AFTER_ROTATION=True\n")
        print(f"   Created {env_file} with default values. Please review and modify as needed.")
    else:
        print("3. .env file already exists, skipping creation.")

def run_migrations():
    """Run database migrations."""
    print("4. Running database migrations...")
    python_path = os.path.join('venv', 'bin', 'python')
    if not os.path.exists(python_path):
        python_path = os.path.join('venv', 'Scripts', 'python')
    run_command(f"{python_path} manage.py migrate")

def create_admin_user():
    """Create admin user if it doesn't exist."""
    print("5. Creating admin user...")
    python_path = os.path.join('venv', 'bin', 'python')
    if not os.path.exists(python_path):
        python_path = os.path.join('venv', 'Scripts', 'python')
    
    # Create a superuser if it doesn't exist
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

def main():
    print("=== PLATERA Restaurant Management System Setup ===")
    
    # Create virtual environment
    venv_dir = create_virtualenv()
    
    # Install dependencies
    install_dependencies()
    
    # Create .env file
    create_env_file()
    
    # Set environment variables
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'platera_project.settings')
    
    # Add current directory to Python path
    sys.path.insert(0, os.getcwd())
    
    # Initialize Django
    import django
    django.setup()
    
    # Run migrations
    run_migrations()
    
    # Create admin user
    create_admin_user()
    
    print("\nSetup complete!")
    print("To start the development server, run:")
    print("  source venv/bin/activate  # On Windows: venv\Scripts\activate")
    print("  python manage.py runserver")
    print("\nAdmin credentials:")
    print("  Username: admin")
    print("  Password: admin123")
    print("\nIMPORTANT: Change the default password after first login!")

if __name__ == "__main__":
    main()
