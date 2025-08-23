from django.urls import path
from . import auth_views

urlpatterns = [
    # Authentication endpoints with /api/ prefix
    path('api/auth/manager/login/', auth_views.ManagerLoginView.as_view(), name='manager_login'),
    path('api/auth/staff/login/', auth_views.StaffLoginView.as_view(), name='staff_login'),
    
    # User endpoints
    path('api/users/me/', auth_views.CurrentUserView.as_view(), name='current_user'),
]
