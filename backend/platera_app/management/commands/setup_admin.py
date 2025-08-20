from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates an admin user if it doesn\'t exist'

    def handle(self, *args, **options):
        admin_username = 'admin'
        admin_email = 'admin@example.com'
        admin_password = 'admin123'

        if not User.objects.filter(username=admin_username).exists():
            admin = User.objects.create_superuser(
                username=admin_username,
                email=admin_email,
                password=admin_password,
                user_type='admin',
                first_name='Admin',
                last_name='User',
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created admin user: {admin_username}'))
            self.stdout.write(self.style.WARNING(f'IMPORTANT: Please change the default password for {admin_username} immediately!'))
        else:
            self.stdout.write(self.style.WARNING(f'Admin user {admin_username} already exists'))
            
        # Create a sample manager user
        manager_username = 'manager'
        if not User.objects.filter(username=manager_username).exists():
            manager = User.objects.create_user(
                username=manager_username,
                email='manager@example.com',
                password='manager123',
                user_type='manager',
                first_name='Restaurant',
                last_name='Manager',
                is_staff=True
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created manager user: {manager_username}'))
        else:
            self.stdout.write(self.style.WARNING(f'Manager user {manager_username} already exists'))
            
        # Create a sample staff user
        staff_username = 'staff1'
        if not User.objects.filter(username=staff_username).exists():
            staff = User.objects.create_user(
                username=staff_username,
                email='staff1@example.com',
                password='staff123',
                user_type='staff',
                first_name='John',
                last_name='Doe',
                is_staff=False
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created staff user: {staff_username}'))
        else:
            self.stdout.write(self.style.WARNING(f'Staff user {staff_username} already exists'))
