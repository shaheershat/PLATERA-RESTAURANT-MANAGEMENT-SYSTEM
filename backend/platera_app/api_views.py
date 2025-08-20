from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, F, Value, CharField
from django.db.models.functions import Concat

from .serializers import (
    CustomTokenObtainPairSerializer, UserRegistrationSerializer, 
    StaffLoginSerializer, ManagerLoginSerializer, UserSerializer
)
from .views import RegisterView, StaffLoginView, ManagerLoginView

from .models import (
    User, Profile, StaffProfile, Category, MenuItem, Table, 
    Order, OrderItem, Payment, Reservation, InventoryItem,
    InventoryTransaction, Recipe, RecipeIngredient, Notification
)
from .serializers import (
    UserSerializer, ProfileSerializer, StaffProfileSerializer, CategorySerializer,
    MenuItemSerializer, TableSerializer, OrderSerializer, OrderItemSerializer,
    PaymentSerializer, ReservationSerializer, InventoryItemSerializer,
    InventoryTransactionSerializer, RecipeSerializer, RecipeIngredientSerializer,
    NotificationSerializer, MenuItemListSerializer, OrderListSerializer
)

# User Management
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    filterset_fields = ['user_type', 'is_active']
    ordering_fields = ['date_joined', 'last_login']

    def get_queryset(self):
        # Only show non-superusers to non-superusers
        if not self.request.user.is_superuser:
            return User.objects.filter(is_superuser=False)
        return super().get_queryset()

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['user__email', 'user__first_name', 'user__last_name']

    def get_queryset(self):
        # Users can only see their own profile unless they're staff
        if self.request.user.is_staff:
            return Profile.objects.all()
        return Profile.objects.filter(user=self.request.user)

class StaffProfileViewSet(viewsets.ModelViewSet):
    queryset = StaffProfile.objects.all()
    serializer_class = StaffProfileSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'staff_id']
    filterset_fields = ['position', 'is_active']

# Menu Management
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'description']
    filterset_fields = ['is_active']
    
    @action(detail=True, methods=['post'], url_path='upload-image')
    def upload_image(self, request, pk=None):
        """Upload an image for a category"""
        category = self.get_object()
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        category.image = request.FILES['image']
        category.save()
        serializer = self.get_serializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all().select_related('category')
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'description']
    filterset_fields = ['is_available', 'is_vegetarian', 'is_gluten_free', 'is_spicy', 'category']

    def get_serializer_class(self):
        if self.action == 'list':
            return MenuItemListSerializer
        return MenuItemSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # Add filtering by category name if provided
        category_name = self.request.query_params.get('category_name')
        if category_name:
            queryset = queryset.filter(category__name__iexact=category_name)
        return queryset
        
    @action(detail=True, methods=['post'], url_path='upload-image')
    def upload_image(self, request, pk=None):
        """Upload an image for a menu item"""
        menu_item = self.get_object()
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        menu_item.image = request.FILES['image']
        menu_item.save()
        serializer = self.get_serializer(menu_item)
        return Response(serializer.data, status=status.HTTP_200_OK)

# Table Management
class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['table_number', 'location']
    filterset_fields = ['status', 'is_active', 'capacity']

# Order Management
class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['order', 'status']

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['order_id', 'customer__email', 'customer__first_name', 'customer__last_name']
    filterset_fields = ['status', 'payment_status', 'table']
    ordering_fields = ['created_at', 'updated_at', 'grand_total']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return OrderListSerializer
        return OrderSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter orders for the current user if they're not staff
        if not self.request.user.is_staff:
            queryset = queryset.filter(customer=self.request.user)
        return queryset.select_related('customer', 'table')

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status not in ['PENDING', 'CONFIRMED']:
            return Response(
                {'error': 'Only pending or confirmed orders can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = 'CANCELLED'
        order.save()
        return Response({'status': 'Order cancelled'})

# Payment Management
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['order__order_id', 'transaction_id']
    filterset_fields = ['status', 'payment_method']
    ordering_fields = ['payment_date']
    ordering = ['-payment_date']

# Reservation Management
class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['customer__email', 'customer__first_name', 'customer__last_name', 'table__table_number']
    filterset_fields = ['status', 'table']
    ordering_fields = ['reservation_date', 'start_time']
    ordering = ['-reservation_date', 'start_time']

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter reservations for the current user if they're not staff
        if not self.request.user.is_staff:
            queryset = queryset.filter(customer=self.request.user)
        return queryset.select_related('customer', 'table')

# Inventory Management
class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'description', 'supplier']
    filterset_fields = ['category', 'is_active']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """List all items that are below their alert threshold"""
        low_stock_items = InventoryItem.objects.filter(
            quantity__lte=F('alert_threshold'),
            is_active=True
        )
        page = self.paginate_queryset(low_stock_items)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(low_stock_items, many=True)
        return Response(serializer.data)

class InventoryTransactionViewSet(viewsets.ModelViewSet):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventoryTransactionSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['item', 'transaction_type']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

# Recipe Management
class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    permission_classes = [permissions.IsAuthenticated]

class RecipeIngredientViewSet(viewsets.ModelViewSet):
    queryset = RecipeIngredient.objects.all()
    serializer_class = RecipeIngredientSerializer
    permission_classes = [permissions.IsAuthenticated]

# JWT Authentication
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom Token Obtain Pair View that returns user data along with tokens.
    """
    serializer_class = CustomTokenObtainPairSerializer

# Notification System
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['notification_type', 'is_read']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        # Users can only see their own notifications
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        updated = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)
        return Response({'status': f'Marked {updated} notifications as read'})

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        if not notification.is_read:
            notification.is_read = True
            notification.save()
        return Response({'status': 'Notification marked as read'})
