from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login, logout
from django.contrib.auth import get_user_model
from .models import StaffProfile
from .serializers import (
    UserSerializer, 
    StaffLoginSerializer,
    ManagerLoginSerializer,
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView

User = get_user_model()

class ManagerLoginView(APIView):
    authentication_classes = []  # Disable authentication for this view
    permission_classes = []  # Disable permission checks for this view
    
    def post(self, request, *args, **kwargs):
        print("\n=== ManagerLoginView: Received login request ===")
        print(f"Request headers: {dict(request.headers)}")
        print(f"Request data: {request.data}")
        
        serializer = ManagerLoginSerializer(data=request.data)
        if not serializer.is_valid():
            print(f"\n=== Validation failed ===")
            print(f"Errors: {serializer.errors}")
            return Response(
                {'error': 'Invalid credentials', 'details': str(serializer.errors)},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            user = serializer.validated_data.get('user')
            if not user:
                print("\n=== No user in validated data ===")
                return Response(
                    {'error': 'Authentication failed - no user data'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
            print(f"\n=== User authenticated ===")
            print(f"Username: {user.username}")
            print(f"User type: {user.user_type}")
            print(f"Is active: {user.is_active}")
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            
            print("\n=== Generated tokens ===")
            print(f"Access token: {access_token[:50]}...")
            print(f"Refresh token: {str(refresh)[:50]}...")
            
            # Prepare response data
            response_data = {
                'refresh': str(refresh),
                'access': access_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'user_type': user.user_type,
                    'email': user.email
                }
            }
            
            print("\n=== Login successful ===")
            return Response(response_data)
            
        except Exception as e:
            print(f"\n=== Error in ManagerLoginView ===")
            import traceback
            print(f"Error: {str(e)}")
            print("Traceback:")
            print(traceback.format_exc())
            
            return Response(
                {'error': 'An error occurred during login', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StaffLoginView(APIView):
    authentication_classes = []  # Disable authentication for this view
    permission_classes = []  # Disable permission checks for this view
    
    def post(self, request, *args, **kwargs):
        print("\n=== StaffLoginView: Received login request ===")
        print(f"Request data: {request.data}")
        
        serializer = StaffLoginSerializer(data=request.data)
        if not serializer.is_valid():
            print(f"\n=== Validation failed ===")
            print(f"Errors: {serializer.errors}")
            return Response(
                {'error': 'Invalid employee ID', 'details': serializer.errors},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            user = serializer.validated_data.get('user')
            if not user:
                return Response(
                    {'error': 'Authentication failed - no user data'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
            print(f"\n=== Staff user authenticated ===")
            print(f"Username: {user.username}")
            print(f"User type: {user.user_type}")
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            
            # Get staff profile
            staff_profile = StaffProfile.objects.get(user=user)
            
            # Prepare response data
            response_data = {
                'refresh': str(refresh),
                'access': access_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'user_type': user.user_type,
                    'employee_id': staff_profile.employee_id,
                    'position': staff_profile.position,
                    'department': staff_profile.department,
                    'is_active': user.is_active
                }
            }
            
            print("\n=== Staff login successful ===")
            return Response(response_data)
            
        except Exception as e:
            print(f"\n=== Error in StaffLoginView ===")
            import traceback
            print(f"Error: {str(e)}")
            print("Traceback:")
            print(traceback.format_exc())
            
            return Response(
                {'error': 'An error occurred during staff login', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens for the new user
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
