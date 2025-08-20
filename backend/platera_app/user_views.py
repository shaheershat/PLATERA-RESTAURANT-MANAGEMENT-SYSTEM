from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        user = request.user
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'user_type': user.user_type,
        }
        
        # Add staff_id if user is staff
        if hasattr(user, 'staff_profile'):
            user_data['staff_id'] = user.staff_profile.staff_id
            
        return Response(user_data, status=status.HTTP_200_OK)
