import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'platera_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from rest_framework.test import APITestCase
from platera_app.views import ManagerLoginView
from platera_app.serializers import ManagerLoginSerializer

User = get_user_model()

class TestAuthFlow(APITestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            username='testmanager2',
            password='test123',
            user_type='MANAGER',
            is_active=True
        )
    
    def test_manager_login(self):
        print("\nTesting manager login...")
        
        # Test with correct credentials
        request = self.factory.post('/api/manager/login/', {
            'username': 'testmanager2',
            'password': 'test123'
        })
        
        view = ManagerLoginView.as_view()
        response = view(request)
        print(f"Response status code: {response.status_code}")
        print(f"Response data: {response.data}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        
        print("Manager login test passed!")

if __name__ == "__main__":
    import unittest
    unittest.main()
