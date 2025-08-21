from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    User, Profile, StaffProfile, Category, Product, Table, 
    Order, OrderItem, Payment, Reservation, InventoryItem, 
    InventoryTransaction, Recipe, RecipeIngredient, Notification
)

User = get_user_model()

# User and Authentication
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                 'user_type', 'phone_number', 'address', 'is_active', 'date_joined')
        read_only_fields = ('id', 'user_type', 'is_active', 'date_joined')
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Profile
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

class StaffProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = StaffProfile
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

# Authentication
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name', 'phone_number', 'address')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        # Remove password2 from the data
        validated_data.pop('password2', None)
        
        # Create the user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            address=validated_data.get('address', ''),
            password=validated_data['password']
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        refresh = self.get_token(self.user)
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        data['user'] = UserSerializer(self.user).data
        return data

class StaffLoginSerializer(serializers.Serializer):
    staff_id = serializers.CharField()
    
    def validate(self, data):
        staff_id = data.get('staff_id')
        try:
            staff = StaffProfile.objects.get(staff_id=staff_id, is_active=True)
            if not staff.user.is_active:
                raise serializers.ValidationError({"staff_id": "User account is disabled."})
            return {'user': staff.user}
        except StaffProfile.DoesNotExist:
            raise serializers.ValidationError({"staff_id": "Invalid staff ID or account is inactive."})

class ManagerLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        print(f"Login attempt - Username: {username}")
        
        if not (username and password):
            error_msg = "Must include 'username' and 'password'."
            print(f"Validation failed: {error_msg}")
            raise serializers.ValidationError(error_msg)
            
        user = User.objects.filter(username=username).first()
        print(f"User found: {user is not None}")
        
        if user is None:
            error_msg = "Invalid username or password."
            print(f"Validation failed: {error_msg}")
            raise serializers.ValidationError(error_msg)
            
        if not user.check_password(password):
            error_msg = "Invalid username or password."
            print(f"Password check failed for user: {username}")
            raise serializers.ValidationError(error_msg)
            
        if not user.is_active:
            error_msg = "User account is disabled."
            print(f"User account disabled: {username}")
            raise serializers.ValidationError(error_msg)
            
        if user.user_type not in ['ADMIN', 'MANAGER']:
            error_msg = "You do not have permission to access this resource."
            print(f"Invalid user type: {user.user_type}")
            raise serializers.ValidationError(error_msg)
            
        print(f"Login successful for user: {username}")
        return {'user': user}

# Menu Management
class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None
        read_only_fields = ('created_at', 'updated_at')

class RecipeIngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeIngredient
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class RecipeSerializer(serializers.ModelSerializer):
    ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    
    class Meta:
        model = Recipe
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    recipe = RecipeSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    
    def get_image_url(self, obj):
        if obj.image and hasattr(obj.image, 'url'):
            return obj.image.url
        return None
    
    class Meta:
        model = Product
        fields = ('id', 'name', 'description', 'price', 'category', 'category_name',
                 'image', 'image_url', 'is_available', 'is_vegetarian', 'is_vegan',
                 'is_gluten_free', 'is_spicy', 'calories', 'preparation_time', 'recipe')
        read_only_fields = ('id', 'category_name', 'image_url', 'recipe')

# Table Management
class TableSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Table
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

# Order Management
class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='product.name', read_only=True)
    item_price = serializers.DecimalField(source='product.price', read_only=True, max_digits=10, decimal_places=2)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'order', 'product', 'item_name', 'item_price', 'quantity',
            'unit_price', 'special_instructions', 'status', 'total_price',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at', 'unit_price', 'total_price')
    
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value
    
    def create(self, validated_data):
        # Set unit price from product if not provided
        if 'unit_price' not in validated_data:
            validated_data['unit_price'] = validated_data['product'].price
        return super().create(validated_data)

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    table_number = serializers.CharField(source='table.table_number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('order_id', 'created_at', 'updated_at', 'grand_total')

# Payment Management
class PaymentSerializer(serializers.ModelSerializer):
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'transaction_id')

# Reservation Management
class ReservationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_email = serializers.EmailField(source='customer.email', read_only=True)
    table_number = serializers.CharField(source='table.table_number', read_only=True)
    
    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'reservation_id')

# Inventory Management
class InventoryTransactionSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = InventoryTransaction
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'total_amount')

class InventoryItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category', read_only=True)
    current_stock = serializers.DecimalField(source='quantity', max_digits=10, decimal_places=2, read_only=True)
    last_updated = serializers.DateTimeField(source='updated_at', read_only=True)
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    
    class Meta:
        model = InventoryItem
        fields = [
            'id', 'name', 'description', 'category', 'category_name', 'quantity', 
            'unit', 'unit_display', 'unit_price', 'supplier', 'minimum_stock',
            'alert_threshold', 'current_stock', 'last_restocked', 'expiry_date',
            'is_active', 'created_at', 'last_updated'
        ]
        read_only_fields = ('created_at', 'updated_at')
    
    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Quantity cannot be negative.")
        return value

# Notification System
class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('created_at', 'is_read')

# Nested Serializers for Related Fields
class OrderListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    table_number = serializers.CharField(source='table.table_number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Order
        fields = ('id', 'order_id', 'customer', 'customer_name', 'table', 'table_number', 
                 'status', 'status_display', 'grand_total', 'created_at')
        read_only_fields = ('created_at', 'updated_at')

class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = ('id', 'name', 'price', 'category_name', 'is_available', 
                 'is_vegetarian', 'is_gluten_free', 'is_spicy', 'image')
        read_only_fields = ('created_at', 'updated_at')
