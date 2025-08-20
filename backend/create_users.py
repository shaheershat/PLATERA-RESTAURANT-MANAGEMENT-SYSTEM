import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'platera_project.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def create_user(username, password, user_type, **extra_fields):
    if not User.objects.filter(username=username).exists():
        user = User.objects.create_user(
            username=username,
            password=password,
            user_type=user_type,
            **extra_fields
        )
        print(f"Created {user_type} user: {username}")
        return user
    else:
        print(f"{user_type} user {username} already exists")
        return User.objects.get(username=username)

if __name__ == "__main__":
    # Create Admin user (if not exists)
    admin = create_user(
        username='admin',
        password='admin123',  # Change this in production!
        user_type='ADMIN',
        is_staff=True,
        is_superuser=True
    )
    
    # Create Manager user
    manager = create_user(
        username='manager1',
        password='manager123',  # Change this in production!
        user_type='MANAGER',
        is_staff=True
    )
    
    # Create Staff user
    staff = create_user(
        username='staff1',
        password='staff123',  # Change this in production!
        user_type='STAFF',
        is_staff=False
    )
    
    print("\nLogin Credentials:")
    print("-" * 50)
    print(f"Admin:  \tUsername: admin\t\tPassword: admin123")
    print(f"Manager:\tUsername: manager1\tPassword: manager123")
    print(f"Staff:  \tUsername: staff1\t\tPassword: staff123")
    print("\n!! IMPORTANT: Change these default passwords in production !!")
