import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, login
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny

# Set up logging
logger = logging.getLogger(__name__)

User = get_user_model()

class ManagerLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        logger.info(f"Manager login attempt - Data: {request.data}")
        
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            logger.warning("Login failed - Missing username or password")
            return Response(
                {'error': 'Please provide both username and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Attempting to authenticate user: {username}")
        user = authenticate(request, username=username, password=password)
        
        if user is None:
            logger.warning(f"Authentication failed for user: {username}")
        else:
            logger.info(f"User authenticated: {user.username}, Type: {user.user_type}")
        
        if user is not None and (user.user_type in ['ADMIN', 'MANAGER'] or user.is_superuser):
            if not user.is_active:
                logger.warning(f"User {username} is inactive")
                return Response(
                    {'error': 'This account is inactive'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
            login(request, user)
            refresh = RefreshToken.for_user(user)
            logger.info(f"Login successful for user: {user.username}")
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'user_type': user.user_type,
                    'is_superuser': user.is_superuser,
                    'is_staff': user.is_staff
                }
            }, status=status.HTTP_200_OK)
            
        logger.warning(f"Unauthorized access attempt for user: {username}")
        return Response(
            {'error': 'Invalid credentials or unauthorized access'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

class StaffLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        # Log the incoming request data for debugging
        logger.info(f'Staff login request data: {request.data}')
        
        try:
            # Check if staff_id is provided in the request data
            if 'staff_id' not in request.data:
                logger.warning('No staff_id provided in request')
                return Response(
                    {'error': 'Staff ID is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get and validate staff_id
            staff_id = str(request.data.get('staff_id', '')).strip()
            if not staff_id:
                logger.warning('Empty staff_id provided')
                return Response(
                    {'error': 'Staff ID cannot be empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f'Attempting to find staff with ID: {staff_id}')
            
            # Get staff user with related profile
            try:
                # First, try to find any user with this staff ID, regardless of status
                user = User.objects.select_related('staff_profile').get(
                    staff_profile__staff_id__iexact=staff_id
                )
                
                logger.info(f'Found user with staff ID {staff_id}: {user.username} (ID: {user.id})')
                
                # Check if user is active
                if not user.is_active:
                    logger.warning(f'User {user.id} is inactive')
                    return Response(
                        {'staff_id': 'Account is inactive. Please contact an administrator.'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                    
                # Check if user has staff type
                if user.user_type != 'STAFF':
                    logger.warning(f'User {user.id} is not a staff member (type: {user.user_type})')
                    return Response(
                        {'staff_id': 'This account does not have staff access.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                    
                # Check if user has a staff profile
                if not hasattr(user, 'staff_profile'):
                    logger.error(f'User {user.id} is missing staff profile')
                    return Response(
                        {'staff_id': 'Staff profile configuration error.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                    
                logger.info(f'Staff user validated: {user.username} (ID: {user.id})')
                    
            except User.DoesNotExist:
                logger.warning(f'No user found with staff ID: {staff_id}')
                return Response(
                    {'staff_id': 'Invalid staff ID. Please check and try again.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            except Exception as e:
                logger.error(f'Error fetching staff user: {str(e)}')
                return Response(
                    {'error': 'Error processing your request'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Create tokens
            refresh = RefreshToken.for_user(user)
            logger.info(f"Login successful for user: {user.username}")
            
            # Prepare user data
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': user.user_type,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                'last_login': user.last_login.isoformat() if user.last_login else None
            }
            
            # Add staff-specific data if available
            if hasattr(user, 'staff_profile'):
                user_data.update({
                    'staff_id': user.staff_profile.staff_id,
                    'position': user.staff_profile.position,
                    'hire_date': user.staff_profile.hire_date.isoformat() if user.staff_profile.hire_date else None,
                    'phone_number': user.staff_profile.phone_number
                })
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': user_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f'Staff login error: {str(e)}')
            return Response(
                {'error': 'An error occurred during login'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
