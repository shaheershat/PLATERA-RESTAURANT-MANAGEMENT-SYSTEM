import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'platera_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from platera_app.models import StaffProfile

User = get_user_model()

def create_staff_user():
    # Create staff user if not exists
    staff_user, created = User.objects.get_or_create(
        username='staff1',
        defaults={
            'email': 'staff1@example.com',
            'first_name': 'Staff',
            'last_name': 'User',
            'user_type': 'STAFF',
            'is_active': True
        }
    )
    
    if created or not hasattr(staff_user, 'staff_profile'):
        # Set password
        staff_user.set_password('staff123')
        staff_user.save()
        
        # Create staff profile
        StaffProfile.objects.create(
            user=staff_user,
            staff_id='STF001',
            position='Waiter',
            is_active=True
        )
        print('Created staff user: staff1 with password: staff123')
    else:
        print('Staff user already exists')

if __name__ == "__main__":
    create_staff_user()
