"""
URL configuration for platera_project project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from rest_framework import permissions
from rest_framework.routers import DefaultRouter
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Import views
from platera_app.views import ManagerLoginView, StaffLoginView, RegisterView
from platera_app.user_views import UserInfoView
from platera_app.api_views import (
    CustomTokenObtainPairView,
    UserViewSet,
    ProfileViewSet,
    StaffProfileViewSet,
    CategoryViewSet,
    ProductViewSet,
    TableViewSet,
    OrderViewSet,
    OrderItemViewSet,
    PaymentViewSet,
    ReservationViewSet,
    InventoryItemViewSet,
    InventoryTransactionViewSet,
    RecipeViewSet,
    RecipeIngredientViewSet,
    NotificationViewSet
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', ProfileViewSet)
router.register(r'staff', StaffProfileViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'tables', TableViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'order-items', OrderItemViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'reservations', ReservationViewSet)
router.register(r'inventory', InventoryItemViewSet)
router.register(r'inventory-transactions', InventoryTransactionViewSet)
router.register(r'recipes', RecipeViewSet)
router.register(r'recipe-ingredients', RecipeIngredientViewSet)
router.register(r'notifications', NotificationViewSet)

# Schema view for API documentation
schema_view = get_schema_view(
   openapi.Info(
      title="Platera Restaurant API",
      default_version='v1',
      description="API for Platera Restaurant Management System",
      terms_of_service="https://www.platera.com/terms/",
      contact=openapi.Contact(email="contact@platera.com"),
      license=openapi.License(name="Proprietary"),
   ),
   public=True,
   permission_classes=(permissions.IsAuthenticated,),
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Authentication
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/me/', UserInfoView.as_view(), name='user_info'),
    path('api/auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Custom login endpoints
    path('api/auth/manager/login/', ManagerLoginView.as_view(), name='manager_login'),
    path('api/auth/staff/login/', StaffLoginView.as_view(), name='staff_login'),
    
    # Main API endpoints
    path('api/', include(router.urls)),
    
    # API Documentation
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
