from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from platera_app.models import StaffProfile, Profile

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates default admin, manager, and staff users'

    def handle(self, *args, **options):
        # Create Admin user
        admin_data = {
            'username': 'admin',
            'email': 'admin@platera.com',
            'password': 'admin123',
            'first_name': 'Admin',
            'last_name': 'User',
            'phone_number': '+1234567890',
            'user_type': 'ADMIN',
            'is_staff': True,
            'is_superuser': True
        }
        
        # Create Manager user
        manager_data = {
            'username': 'manager1',
            'email': 'manager@platera.com',
            'password': 'manager123',
            'first_name': 'John',
            'last_name': 'Manager',
            'phone_number': '+1234567891',
            'user_type': 'MANAGER',
            'is_staff': True,
            'is_superuser': False
        }
        
        # Create Staff user
        staff_data = {
            'username': 'staff1',
            'email': 'staff@platera.com',
            'password': 'staff123',
            'first_name': 'Jane',
            'last_name': 'Staff',
            'phone_number': '+1234567892',
            'user_type': 'STAFF',
            'is_staff': False,
            'is_superuser': False
        }
        
        # Create or update users
        for user_data in [admin_data, manager_data, staff_data]:
            username = user_data['username']
            email = user_data.pop('email')
            password = user_data.pop('password')
            
            user, created = User.objects.update_or_create(
                username=username,
                defaults={
                    'email': email,
                    **user_data
                }
            )
            
            if password:
                user.set_password(password)
                user.save()
            
            # Create staff profile for staff user with all required fields
            if user.user_type == 'STAFF' and not hasattr(user, 'staff_profile'):
                # First create with a temporary employee_id
                staff_profile = StaffProfile.objects.create(
                    user=user,
                    employee_id='TEMP',  # Will be updated in save()
                    position='WAITER',
                    department='FRONT_OF_HOUSE',
                    hire_date=timezone.now().date(),
                    is_active=True,
                    is_full_time=True,
                    shift_preference='AFTERNOON',
                    weekly_hours=40,
                    emergency_contact_name='Emergency Contact',
                    emergency_contact_phone='+1234567890',
                    emergency_contact_relation='Parent'
                )
                # Now generate the proper employee ID and save again
                dept_prefix = staff_profile.department[:3].upper()
                year_month = timezone.now().strftime('%y%m')
                staff_profile.employee_id = f"{dept_prefix}-{year_month}-{staff_profile.id:03d}"
                staff_profile.save()
            
            # Create profile for all users
            if not hasattr(user, 'profile'):
                Profile.objects.create(user=user)
            
            action = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{action} {user.user_type.lower()} user: {username}'))
        
        self.stdout.write(self.style.SUCCESS('\nSuccessfully created/updated all users!'))
        self.stdout.write('\nLogin Credentials:')
        self.stdout.write('-' * 50)
        self.stdout.write('Admin:  \tUsername: admin\t\tPassword: admin123')
        self.stdout.write('Manager:\tUsername: manager1\tPassword: manager123')
        self.stdout.write('Staff:  \tUsername: staff1\t\tPassword: staff123')
        self.stdout.write('\nIMPORTANT: Change these default passwords after first login!')
