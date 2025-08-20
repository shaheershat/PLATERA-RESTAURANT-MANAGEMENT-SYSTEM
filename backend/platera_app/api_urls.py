from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import api_views

# Create a router and register our viewsets with it
router = DefaultRouter()

# User Management
router.register(r'users', api_views.UserViewSet)
router.register(r'profiles', api_views.ProfileViewSet)
router.register(r'staff', api_views.StaffProfileViewSet)

# Menu Management
router.register(r'categories', api_views.CategoryViewSet)
router.register(r'menu-items', api_views.MenuItemViewSet)

# Table Management
router.register(r'tables', api_views.TableViewSet)

# Order Management
router.register(r'orders', api_views.OrderViewSet)
router.register(r'order-items', api_views.OrderItemViewSet)

# Payment Management
router.register(r'payments', api_views.PaymentViewSet)

# Reservation Management
router.register(r'reservations', api_views.ReservationViewSet)

# Inventory Management
router.register(r'inventory', api_views.InventoryItemViewSet)
router.register(r'inventory-transactions', api_views.InventoryTransactionViewSet)

# Recipe Management
router.register(r'recipes', api_views.RecipeViewSet)
router.register(r'recipe-ingredients', api_views.RecipeIngredientViewSet)

# Notification System
router.register(r'notifications', api_views.NotificationViewSet, basename='notifications')

# Additional API endpoints
urlpatterns = [
    path('', include(router.urls)),
    
    # Additional endpoints for specific actions
    path('orders/<int:pk>/cancel/', api_views.OrderViewSet.as_view({'post': 'cancel'}), name='order-cancel'),
    path('notifications/mark-all-read/', api_views.NotificationViewSet.as_view({'post': 'mark_all_as_read'}), 
         name='notifications-mark-all-read'),
    path('notifications/<int:pk>/mark-read/', api_views.NotificationViewSet.as_view({'post': 'mark_as_read'}), 
         name='notification-mark-read'),
         
    # Image upload endpoints
    path('categories/<int:pk>/upload-image/', 
         api_views.CategoryViewSet.as_view({'post': 'upload_image'}), 
         name='category-upload-image'),
    path('menu-items/<int:pk>/upload-image/', 
         api_views.MenuItemViewSet.as_view({'post': 'upload_image'}), 
         name='menu-item-upload-image'),
         
    # Inventory management endpoints
    path('inventory/low-stock/', 
         api_views.InventoryItemViewSet.as_view({'get': 'low_stock'}), 
         name='inventory-low-stock'),
    
    # Authentication endpoints
    path('auth/', include('rest_framework.urls')),  # For browsable API login
    path('auth/token/', api_views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', api_views.RegisterView.as_view(), name='auth_register'),
    path('auth/staff-login/', api_views.StaffLoginView.as_view(), name='staff_login'),
    path('auth/manager-login/', api_views.ManagerLoginView.as_view(), name='manager_login'),
]

# Add schema view for API documentation
from rest_framework.schemas import get_schema_view
from rest_framework.documentation import include_docs_urls

schema_view = get_schema_view(
    title='Platera Restaurant Management API',
    description='API for managing restaurant operations',
    version='1.0.0'
)

urlpatterns += [
    path('schema/', schema_view),
    path('docs/', include_docs_urls(title='Platera API Documentation')),
]
