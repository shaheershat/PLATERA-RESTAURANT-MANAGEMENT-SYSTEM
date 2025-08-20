from django.urls import path
from . import auth_views

urlpatterns = [
    path('manager/login/', auth_views.ManagerLoginView.as_view(), name='manager_login'),
    path('staff/login/', auth_views.StaffLoginView.as_view(), name='staff_login'),
]
