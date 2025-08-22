from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager, Group, Permission
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
import uuid
from cloudinary.models import CloudinaryField

class TimestampModel(models.Model):
    """Abstract base class with created_at and updated_at fields"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        
        # Ensure username is unique
        if self.model.objects.filter(username=username).exists():
            raise ValueError('A user with that username already exists')
            
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'ADMIN')
        return self.create_user(username, password, **extra_fields)

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('STAFF', 'Staff'),
        ('CUSTOMER', 'Customer'),
    )
    
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='CUSTOMER')
    email = models.EmailField(unique=False, blank=True, null=True)  # Made email optional and non-unique
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_joined = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    
    # Use username as the authentication field
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []  # Remove email from required fields
    
    objects = CustomUserManager()
    
    def __str__(self):
        return f"{self.get_full_name() or self.email} ({self.get_user_type_display()})"

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    bio = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.email}'s Profile"

class StaffProfile(TimestampModel):
    """Extended user profile for restaurant staff with comprehensive management features"""
    POSITION_CHOICES = (
        ('MANAGER', 'Restaurant Manager'),
        ('SUPERVISOR', 'Shift Supervisor'),
        ('HOST', 'Host/Hostess'),
        ('WAITER', 'Waiter/Waitress'),
        ('BARTENDER', 'Bartender'),
        ('CHEF', 'Head Chef'),
        ('SOUS_CHEF', 'Sous Chef'),
        ('LINE_COOK', 'Line Cook'),
        ('PASTRY_CHEF', 'Pastry Chef'),
        ('DISHWASHER', 'Dishwasher'),
        ('BARISTA', 'Barista'),
        ('CASHIER', 'Cashier'),
        ('RUNNER', 'Food Runner'),
        ('DELIVERY', 'Delivery Driver'),
        ('CLEANING', 'Cleaning Staff'),
    )
    
    DEPARTMENT_CHOICES = (
        ('MANAGEMENT', 'Management'),
        ('FRONT_OF_HOUSE', 'Front of House'),
        ('KITCHEN', 'Kitchen'),
        ('BAR', 'Bar'),
        ('BAKERY', 'Bakery'),
        ('DELIVERY', 'Delivery'),
        ('HOUSEKEEPING', 'Housekeeping'),
    )
    
    SHIFT_CHOICES = (
        ('MORNING', 'Morning (6AM-2PM)'),
        ('AFTERNOON', 'Afternoon (2PM-10PM)'),
        ('NIGHT', 'Night (10PM-6AM)'),
        ('SPLIT', 'Split Shift'),
        ('FLEXIBLE', 'Flexible'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    
    # Identification
    employee_id = models.CharField(max_length=20, unique=True, editable=False)
    badge_number = models.CharField(max_length=20, blank=True, null=True)
    
    # Employment Details
    position = models.CharField(max_length=20, choices=POSITION_CHOICES)
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, null=True, blank=True)
    hire_date = models.DateField(default=timezone.now)
    termination_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_full_time = models.BooleanField(default=True)
    
    # Work Schedule
    shift_preference = models.CharField(max_length=20, choices=SHIFT_CHOICES, null=True, blank=True)
    weekly_hours = models.PositiveIntegerField(default=40, help_text='Scheduled hours per week')
    
    # Compensation
    salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, 
                               help_text='Monthly salary')
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True,
                                    help_text='Hourly rate for part-time staff')
    
    # Contact Information
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True, null=True)
    
    # Documents
    id_proof = models.FileField(upload_to='staff/id_proofs/', null=True, blank=True)
    resume = models.FileField(upload_to='staff/resumes/', null=True, blank=True)
    photo = models.ImageField(upload_to='staff/photos/', null=True, blank=True)
    
    # Additional Information
    notes = models.TextField(blank=True, null=True, help_text='Additional notes about the staff member')
    
    class Meta:
        ordering = ['user__last_name', 'user__first_name']
        verbose_name = 'Staff Profile'
        verbose_name_plural = 'Staff Profiles'
    
    def save(self, *args, **kwargs):
        # Prevent recursion by checking if this is a user-triggered save
        if not hasattr(self, '_dirty'):
            self._dirty = True
            try:
                if not self.employee_id:
                    # Generate employee ID: DEPT-YYMM-XXX
                    dept_prefix = self.department[:3].upper() if self.department else 'STF'
                    year_month = timezone.now().strftime('%y%m')
                    last_emp = StaffProfile.objects.filter(
                        employee_id__startswith=f"{dept_prefix}-{year_month}"
                    ).order_by('-employee_id').first()
                    
                    if last_emp and last_emp.employee_id:
                        try:
                            last_num = int(last_emp.employee_id.split('-')[-1])
                            new_num = f"{last_num + 1:03d}"
                        except (IndexError, ValueError):
                            new_num = "001"
                    else:
                        new_num = "001"
                        
                    self.employee_id = f"{dept_prefix}-{year_month}-{new_num}"
                
                # Set user as staff if this is a staff profile
                if self.user and not self.user.is_staff:
                    self.user.is_staff = True
                    self.user.save(update_fields=['is_staff'])
                
                # Save the profile
                super().save(*args, **kwargs)
            finally:
                self._dirty = False
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_position_display()} ({self.get_department_display()})"
    
    @property
    def full_name(self):
        """Get the staff member's full name"""
        return self.user.get_full_name()
    
    @property
    def email(self):
        """Get the staff member's email"""
        return self.user.email
    
    @property
    def phone(self):
        """Get the staff member's phone number"""
        return self.user.phone_number
    
    @property
    def is_currently_working(self):
        """Check if the staff member is currently working based on their shift"""
        if not self.shift_preference:
            return False
            
        now = timezone.now().time()
        
        if self.shift_preference == 'MORNING' and time(6, 0) <= now < time(14, 0):
            return True
        elif self.shift_preference == 'AFTERNOON' and time(14, 0) <= now < time(22, 0):
            return True
        elif self.shift_preference == 'NIGHT' and (time(22, 0) <= now or now < time(6, 0)):
            return True
            
        return False
    
    def get_weekly_schedule(self):
        """Get the weekly work schedule for this staff member"""
        # This can be extended to integrate with a scheduling system
        schedule = {}
        weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        
        for day in weekdays:
            schedule[day] = {
                'start': '09:00' if day not in ['saturday', 'sunday'] else '10:00',
                'end': '17:00' if day not in ['saturday', 'sunday'] else '18:00',
                'is_working': day not in ['sunday']  # Default day off on Sunday
            }
            
        return schedule

class Category(TimestampModel):
    """Menu categories (e.g., Appetizers, Main Course, Desserts)"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    image = CloudinaryField('category_image', folder='categories', null=True, blank=True)
    image_public_id = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['display_order', 'name']
    
    def __str__(self):
        return self.name

class Product(TimestampModel):
    """Menu items/products that can be ordered"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, related_name='products', on_delete=models.SET_NULL, null=True)
    
    # Cloudinary image fields
    image = CloudinaryField('product_image', folder='products', null=True, blank=True)
    image_public_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Product details
    sku = models.CharField(max_length=50, unique=True, blank=True, null=True)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_available = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Dietary information
    is_vegetarian = models.BooleanField(default=False)
    is_vegan = models.BooleanField(default=False)
    is_gluten_free = models.BooleanField(default=False)
    is_spicy = models.BooleanField(default=False)
    calories = models.PositiveIntegerField(null=True, blank=True)
    
    # Preparation
    preparation_time = models.PositiveIntegerField(
        help_text='Preparation time in minutes', 
        default=15
    )
    
    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Products'
    
    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = f"PROD-{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} - ${self.price}"

class Table(TimestampModel):
    """Restaurant tables management"""
    TABLE_STATUS = (
        ('AVAILABLE', 'Available'),
        ('OCCUPIED', 'Occupied'),
        ('RESERVED', 'Reserved'),
        ('CLEANING', 'Cleaning'),
        ('MAINTENANCE', 'Under Maintenance'),
    )
    
    TABLE_SHAPES = (
        ('RECTANGLE', 'Rectangle'),
        ('SQUARE', 'Square'),
        ('ROUND', 'Round'),
        ('BOOTH', 'Booth'),
    )
    
    table_number = models.CharField(max_length=10, unique=True, help_text='Unique identifier for the table')
    name = models.CharField(max_length=100, blank=True, null=True, help_text='Optional display name')
    capacity = models.PositiveIntegerField(help_text='Maximum number of people that can be seated')
    min_capacity = models.PositiveIntegerField(default=1, help_text='Minimum number of people recommended')
    status = models.CharField(max_length=15, choices=TABLE_STATUS, default='AVAILABLE')
    shape = models.CharField(max_length=10, choices=TABLE_SHAPES, default='RECTANGLE')
    
    # Location information
    section = models.CharField(max_length=50, blank=True, null=True, help_text='Restaurant section/area')
    floor = models.PositiveIntegerField(default=1, help_text='Floor number')
    x_position = models.PositiveIntegerField(null=True, blank=True, help_text='X position for floor plan')
    y_position = models.PositiveIntegerField(null=True, blank=True, help_text='Y position for floor plan')
    
    # Additional details
    is_active = models.BooleanField(default=True)
    is_mergeable = models.BooleanField(default=True, help_text='Can this table be merged with others?')
    has_outlet = models.BooleanField(default=False, help_text='Table has power outlet')
    is_outdoor = models.BooleanField(default=False, help_text='Is this an outdoor table?')
    
    # Metadata
    notes = models.TextField(blank=True, null=True, help_text='Special instructions or notes about this table')
    last_cleaned = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Table {self.table_number} ({self.capacity} persons)"

class Order(TimestampModel):
    """Customer orders in the restaurant"""
    ORDER_STATUS = (
        ('DRAFT', 'Draft'),
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('PREPARING', 'Preparing'),
        ('READY', 'Ready to Serve'),
        ('SERVED', 'Served'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )
    
    PAYMENT_STATUS = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('PARTIALLY_PAID', 'Partially Paid'),
        ('REFUNDED', 'Refunded'),
        ('FAILED', 'Failed'),
    )    
    
    PAYMENT_METHODS = (
        ('CASH', 'Cash'),
        ('CARD', 'Credit/Debit Card'),
        ('UPI', 'UPI'),
        ('WALLET', 'Digital Wallet'),
        ('ONLINE', 'Online Payment'),
        ('OTHER', 'Other'),
    )
    
    # Order identification
    order_id = models.CharField(max_length=20, unique=True, editable=False)
    reference = models.CharField(max_length=50, blank=True, null=True, help_text='External reference number')
    
    # Relationships
    customer = models.ForeignKey(User, related_name='orders', on_delete=models.SET_NULL, null=True, blank=True)
    table = models.ForeignKey(Table, related_name='orders', on_delete=models.SET_NULL, null=True, blank=True)
    staff = models.ForeignKey(User, related_name='served_orders', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='DRAFT')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='PENDING')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, blank=True, null=True)
    
    # Financials
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    service_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    rounding_adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Additional charges
    packaging_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Customer details
    customer_name = models.CharField(max_length=255, blank=True, null=True)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    customer_email = models.EmailField(blank=True, null=True)
    
    # Order details
    is_takeaway = models.BooleanField(default=False)
    is_delivery = models.BooleanField(default=False)
    estimated_ready_time = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    notes = models.TextField(blank=True, null=True, help_text='Special instructions')
    internal_notes = models.TextField(blank=True, null=True, help_text='Staff only notes')
    
    # Payment details
    payment_reference = models.CharField(max_length=100, blank=True, null=True)
    payment_date = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.order_id:
            # Format: ORD-YYMMDD-XXXX
            date_str = timezone.now().strftime('%y%m%d')
            last_order = Order.objects.filter(order_id__startswith=f'ORD-{date_str}').order_by('-order_id').first()
            if last_order:
                last_num = int(last_order.order_id.split('-')[-1])
                new_num = f"{last_num + 1:04d}"
            else:
                new_num = "0001"
            self.order_id = f"ORD-{date_str}-{new_num}"
            
        # Auto-calculate totals if not set
        if not self.pk or any(field in ['subtotal', 'tax_amount', 'discount_amount', 'grand_total'] for field in kwargs.get('update_fields', [])):
            self.grand_total = (
                self.subtotal + 
                self.tax_amount + 
                self.service_charge + 
                self.packaging_charge +
                self.delivery_charge -
                self.discount_amount +
                self.rounding_adjustment
            )
            
        super().save(*args, **kwargs)
    
    def save(self, *args, **kwargs):
        if not self.order_id:
            self.order_id = f"ORD-{timezone.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.order_id} - {self.get_status_display()}"

class OrderItem(TimestampModel):
    """Individual items within an order"""
    ITEM_STATUS = (
        ('PENDING', 'Pending'),
        ('PREPARING', 'Preparing'),
        ('READY', 'Ready to Serve'),
        ('SERVED', 'Served'),
        ('CANCELLED', 'Cancelled'),
    )
    
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name='order_items', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Item details
    name = models.CharField(max_length=255, blank=True, null=True, help_text='Name at the time of ordering')
    description = models.TextField(blank=True, null=True, help_text='Description at the time of ordering')
    
    # Pricing
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Status and tracking
    status = models.CharField(max_length=20, choices=ITEM_STATUS, default='PENDING')
    prepared_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='prepared_items')
    prepared_at = models.DateTimeField(null=True, blank=True)
    served_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='served_items')
    served_at = models.DateTimeField(null=True, blank=True)
    
    # Customization
    special_instructions = models.TextField(blank=True, null=True)
    is_priority = models.BooleanField(default=False)
    
    # Kitchen notes
    kitchen_notes = models.TextField(blank=True, null=True, help_text='Internal notes for kitchen staff')
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'
    
    def save(self, *args, **kwargs):
        # Set product details if not set
        if not self.pk and self.product:
            self.name = self.name or self.product.name
            self.description = self.description or self.product.description
            self.unit_price = self.unit_price or self.product.price
        
        # Calculate totals
        self.total_price = (self.quantity * self.unit_price) - self.discount_amount
        
        # Update timestamps based on status
        if self.status == 'PREPARING' and not self.prepared_at:
            self.prepared_at = timezone.now()
        elif self.status == 'SERVED' and not self.served_at:
            self.served_at = timezone.now()
        
        super().save(*args, **kwargs)
        
        # Update order totals
        if self.order:
            self.order.save()
    
    def __str__(self):
        return f"{self.quantity}x {self.name} - {self.get_status_display()}"
    
    @property
    def is_editable(self):
        """Check if this item can be modified"""
        return self.status in ['PENDING', 'PREPARING']
    
    def cancel(self, reason=None):
        """Helper method to cancel this order item"""
        if self.status != 'CANCELLED':
            self.status = 'CANCELLED'
            if reason:
                self.kitchen_notes = f"{self.kitchen_notes or ''}\nCancelled: {reason}"
            self.save()
            return True
        return False

class KOT(TimestampModel):
    """Kitchen Order Ticket - Tracks orders sent to the kitchen"""
    KOT_STATUS = (
        ('PENDING', 'Pending'),
        ('PREPARING', 'Preparing'),
        ('READY', 'Ready'),
        ('SERVED', 'Served'),
        ('CANCELLED', 'Cancelled'),
    )
    
    kot_number = models.CharField(max_length=20, unique=True, editable=False)
    order = models.ForeignKey(Order, related_name='kots', on_delete=models.CASCADE)
    table = models.ForeignKey(Table, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=KOT_STATUS, default='PENDING')
    
    # Staff information
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_kots')
    prepared_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='prepared_kots')
    served_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='served_kots')
    
    # Timestamps
    prepared_at = models.DateTimeField(null=True, blank=True)
    served_at = models.DateTimeField(null=True, blank=True)
    
    # Additional information
    is_priority = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True, help_text='Special instructions for the kitchen')
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Kitchen Order Ticket'
        verbose_name_plural = 'Kitchen Order Tickets'
    
    def save(self, *args, **kwargs):
        if not self.kot_number:
            # Format: KOT-YYMMDD-XXXX
            date_str = timezone.now().strftime('%y%m%d')
            last_kot = KOT.objects.filter(kot_number__startswith=f'KOT-{date_str}').order_by('-kot_number').first()
            if last_kot:
                last_num = int(last_kot.kot_number.split('-')[-1])
                new_num = f"{last_num + 1:04d}"
            else:
                new_num = "0001"
            self.kot_number = f"KOT-{date_str}-{new_num}"
        
        # Update timestamps based on status
        if self.status == 'PREPARING' and not self.prepared_at:
            self.prepared_at = timezone.now()
        elif self.status == 'SERVED' and not self.served_at:
            self.served_at = timezone.now()
            
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.kot_number} - {self.get_status_display()}"
    
    @property
    def items(self):
        """Get all items associated with this KOT"""
        return self.kot_items.select_related('order_item__product')
    
    def mark_as_ready(self, user):
        """Mark this KOT as ready to serve"""
        if self.status != 'READY':
            self.status = 'READY'
            self.prepared_by = user
            self.prepared_at = timezone.now()
            self.save(update_fields=['status', 'prepared_by', 'prepared_at', 'updated_at'])
            return True
        return False


class KOTItem(TimestampModel):
    """Individual items in a Kitchen Order Ticket"""
    kot = models.ForeignKey(KOT, related_name='kot_items', on_delete=models.CASCADE)
    order_item = models.ForeignKey(OrderItem, related_name='kot_items', on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=KOT.KOT_STATUS, default='PENDING')
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'KOT Item'
        verbose_name_plural = 'KOT Items'
    
    def __str__(self):
        return f"{self.quantity}x {self.order_item.name} - {self.get_status_display()}"


class Payment(models.Model):
    PAYMENT_METHODS = (
        ('CASH', 'Cash'),
        ('CARD', 'Credit/Debit Card'),
        ('ONLINE', 'Online Payment'),
        ('WALLET', 'Digital Wallet'),
    )
    
    order = models.ForeignKey(Order, related_name='payments', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, default='COMPLETED')
    payment_date = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.get_payment_method_display()} - ${self.amount} for {self.order.order_id}"

class Reservation(models.Model):
    RESERVATION_STATUS = (
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('SEATED', 'Seated'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('NO_SHOW', 'No Show'),
    )
    
    customer = models.ForeignKey(User, related_name='reservations', on_delete=models.CASCADE)
    table = models.ForeignKey(Table, related_name='reservations', on_delete=models.CASCADE)
    reservation_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    party_size = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=RESERVATION_STATUS, default='PENDING')
    special_requests = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-reservation_date', '-start_time']
        verbose_name = 'Reservation'
        verbose_name_plural = 'Reservations'
        
    def __str__(self):
        return f"Reservation #{self.id} - {self.customer.get_full_name()} - {self.reservation_date} {self.start_time}"

class InventoryCategory(TimestampModel):
    """Categories for inventory items"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, 
                             related_name='subcategories')
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = 'Inventory Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    @property
    def item_count(self):
        """Get the count of active items in this category"""
        return self.items.filter(is_active=True).count()


class UnitOfMeasurement(TimestampModel):
    """Units of measurement for inventory items"""
    name = models.CharField(max_length=50, unique=True)
    abbreviation = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.abbreviation})"


class Supplier(TimestampModel):
    """Suppliers for inventory items"""
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class InventoryItem(TimestampModel):
    """Inventory items for the restaurant"""
    ITEM_TYPES = (
        ('INGREDIENT', 'Ingredient'),
        ('PACKAGING', 'Packaging Material'),
        ('CLEANING', 'Cleaning Supply'),
        ('OFFICE', 'Office Supply'),
        ('EQUIPMENT', 'Equipment'),
        ('OTHER', 'Other'),
    )
    
    # Basic Information
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True, blank=True, null=True)
    barcode = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    item_type = models.CharField(max_length=20, choices=ITEM_TYPES, default='INGREDIENT')
    category = models.ForeignKey(InventoryCategory, on_delete=models.SET_NULL, null=True, 
                                blank=True, related_name='items')
    
    # Stock Information
    quantity_in_stock = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    unit = models.ForeignKey(UnitOfMeasurement, on_delete=models.PROTECT, 
                            related_name='inventory_items')
    
    # Reorder Information
    reorder_level = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    reorder_quantity = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    
    # Cost Information
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    average_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Supplier Information
    preferred_supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, 
                                         blank=True, related_name='inventory_items')
    supplier_sku = models.CharField(max_length=100, blank=True, null=True)
    
    # Product Relationships
    products = models.ManyToManyField('Product', through='RecipeItem', 
                                     related_name='inventory_items')
    
    # Status
    is_active = models.BooleanField(default=True)
    is_tracked = models.BooleanField(default=True, 
                                   help_text='Track quantity changes for this item')
    
    # Location
    storage_location = models.CharField(max_length=100, blank=True, null=True)
    
    # Images
    image = models.ImageField(upload_to='inventory/', blank=True, null=True)
    
    # Additional Information
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Inventory Items'
    
    def save(self, *args, **kwargs):
        if not self.sku:
            # Generate SKU if not provided
            prefix = ''.join(word[0].upper() for word in self.name.split()[:3])
            prefix = ''.join(c for c in prefix if c.isalnum())
            prefix = prefix[:3].ljust(3, 'X')
            
            last_item = InventoryItem.objects.filter(sku__startswith=prefix).order_by('-sku').first()
            if last_item and last_item.sku:
                last_num = int(last_item.sku[3:]) if last_item.sku[3:].isdigit() else 0
                new_num = f"{last_num + 1:04d}"
            else:
                new_num = "0001"
            self.sku = f"{prefix}{new_num}"
        
        # Update average cost if needed
        if self.quantity_in_stock > 0 and hasattr(self, 'last_transaction'):
            last_transaction = self.last_transaction
            if last_transaction and last_transaction.transaction_type == 'PURCHASE':
                total_cost = (self.average_cost * (self.quantity_in_stock - last_transaction.quantity) + 
                             last_transaction.total_cost)
                self.average_cost = total_cost / self.quantity_in_stock
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} ({self.quantity_in_stock} {self.unit.abbreviation if self.unit else ''})"
    
    @property
    def needs_reorder(self):
        """Check if item needs to be reordered"""
        return self.quantity_in_stock <= self.reorder_level
    
    @property
    def stock_value(self):
        """Calculate total value of current stock"""
        return self.quantity_in_stock * self.average_cost
    
    def add_stock(self, quantity, cost_per_unit=None, notes='', transaction_type='PURCHASE'):
        """Add stock to inventory"""
        if not cost_per_unit:
            cost_per_unit = self.cost_per_unit
            
        # Create inventory transaction
        transaction = InventoryTransaction.objects.create(
            inventory_item=self,
            transaction_type=transaction_type,
            quantity=quantity,
            unit_cost=cost_per_unit,
            notes=notes
        )
        
        # Update stock levels
        self.quantity_in_stock += quantity
        self.cost_per_unit = cost_per_unit  # Update to latest cost
        
        # Update average cost
        if self.quantity_in_stock > 0:
            self.average_cost = (
                (self.average_cost * (self.quantity_in_stock - quantity) + 
                 cost_per_unit * quantity) / self.quantity_in_stock
            )
        
        self.save()
        return transaction
    
    def remove_stock(self, quantity, notes='', transaction_type='USAGE'):
        """Remove stock from inventory"""
        if quantity > self.quantity_in_stock:
            raise ValueError("Insufficient stock available")
            
        # Create inventory transaction
        transaction = InventoryTransaction.objects.create(
            inventory_item=self,
            transaction_type=transaction_type,
            quantity=-quantity,  # Negative for removal
            unit_cost=self.average_cost,
            notes=notes
        )
        
        # Update stock level
        self.quantity_in_stock -= quantity
        self.save()
        return transaction


class InventoryTransaction(TimestampModel):
    """Tracks all inventory movements and changes"""
    TRANSACTION_TYPES = (
        ('PURCHASE', 'Purchase'),
        ('USAGE', 'Usage'),
        ('ADJUSTMENT', 'Adjustment'),
        ('WASTAGE', 'Wastage'),
        ('RETURN', 'Return to Supplier'),
        ('TRANSFER', 'Transfer'),
        ('PRODUCTION', 'Production'),
        ('CONSUMPTION', 'Consumption'),
    )
    
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions', help_text='Reference to the inventory item')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=12, decimal_places=3)
    unit = models.ForeignKey(UnitOfMeasurement, on_delete=models.PROTECT)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text='Total cost of this transaction')
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text='Alias for total_amount for backward compatibility')
    reference = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='inventory_transactions')
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Inventory Transaction'
        verbose_name_plural = 'Inventory Transactions'
    
    def save(self, *args, **kwargs):
        # Auto-calculate total cost if not provided
        if not self.total_cost and self.quantity and self.unit_cost:
            self.total_cost = abs(self.quantity) * self.unit_cost
            
        # Set unit from inventory item if not provided
        if not hasattr(self, 'unit') or not self.unit:
            self.unit = self.inventory_item.unit
            
        super().save(*args, **kwargs)
        
        # Update inventory item's stock level
        if self.transaction_type in ['PURCHASE', 'RETURN', 'TRANSFER_IN', 'PRODUCTION']:
            self.inventory_item.quantity_in_stock += abs(self.quantity)
        elif self.transaction_type in ['USAGE', 'WASTAGE', 'TRANSFER_OUT', 'CONSUMPTION']:
            self.inventory_item.quantity_in_stock -= abs(self.quantity)
            
        # Update average cost for purchase transactions
        if self.transaction_type == 'PURCHASE':
            total_value = (self.inventory_item.average_cost * self.inventory_item.quantity_in_stock + 
                          self.total_cost)
            self.inventory_item.average_cost = total_value / (self.inventory_item.quantity_in_stock + abs(self.quantity))
            
        self.inventory_item.save()
    
    def __str__(self):
        return (f"{self.get_transaction_type_display()} - {abs(self.quantity)} {self.unit.abbreviation} "
                f"of {self.inventory_item.name} on {self.created_at.strftime('%Y-%m-%d')}")
    
    @property
    def is_addition(self):
        """Check if this transaction adds to inventory"""
        return self.transaction_type in ['PURCHASE', 'RETURN', 'TRANSFER_IN', 'PRODUCTION']
    
    @property
    def is_deduction(self):
        """Check if this transaction removes from inventory"""
        return self.transaction_type in ['USAGE', 'WASTAGE', 'TRANSFER_OUT', 'CONSUMPTION']


class RecipeItem(models.Model):
    """Links products to their ingredients in the inventory"""
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='recipe_items')
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='used_in_products')
    quantity = models.DecimalField(max_digits=10, decimal_places=3, help_text='Quantity needed per serving')
    unit = models.ForeignKey(UnitOfMeasurement, on_delete=models.PROTECT, related_name='recipe_items')
    notes = models.TextField(blank=True, null=True, help_text='Special preparation instructions')
    is_optional = models.BooleanField(default=False, help_text='Can this ingredient be omitted?')
    
    class Meta:
        ordering = ['product__name', 'inventory_item__name']
        unique_together = (('product', 'inventory_item'),)
        verbose_name = 'Recipe Item'
        verbose_name_plural = 'Recipe Items'
    
    def __str__(self):
        return f"{self.product.name} - {self.quantity} {self.unit.abbreviation} {self.inventory_item.name}"
    
    def calculate_cost(self, quantity=1):
        """Calculate the cost of this ingredient for the given quantity of product"""
        return self.quantity * quantity * self.inventory_item.average_cost

class Recipe(TimestampModel):
    """Recipe for products, containing multiple ingredients and preparation instructions"""
    name = models.CharField(max_length=200, help_text='Name of the recipe')
    description = models.TextField(blank=True, null=True, help_text='Brief description of the recipe')
    product = models.OneToOneField('Product', on_delete=models.SET_NULL, null=True, blank=True, 
                                 related_name='recipe', help_text='Product this recipe is for')
    instructions = models.TextField(help_text='Step-by-step preparation instructions')
    preparation_time = models.PositiveIntegerField(help_text='Preparation time in minutes')
    cooking_time = models.PositiveIntegerField(help_text='Cooking time in minutes')
    servings = models.PositiveIntegerField(help_text='Number of servings this recipe makes')
    is_active = models.BooleanField(default=True, help_text='Whether this recipe is currently in use')
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Recipe'
        verbose_name_plural = 'Recipes'
    
    def __str__(self):
        product_name = self.product.name if self.product else 'No Product'
        return f"{self.name} (for {product_name})"
    
    @property
    def total_preparation_time(self):
        """Total time required (prep + cooking) in minutes"""
        return self.preparation_time + self.cooking_time
    
    @property
    def cost_per_serving(self):
        """Calculate the cost per serving based on ingredient costs"""
        total_cost = sum(ingredient.cost for ingredient in self.ingredients.all())
        return total_cost / self.servings if self.servings > 0 else 0


class RecipeIngredient(TimestampModel):
    """Ingredients required for a recipe"""
    recipe = models.ForeignKey(Recipe, related_name='ingredients', on_delete=models.CASCADE)
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, 
                                     related_name='recipe_ingredients')
    quantity = models.DecimalField(max_digits=10, decimal_places=3, 
                                 help_text='Quantity needed for the recipe')
    unit = models.ForeignKey(UnitOfMeasurement, on_delete=models.PROTECT, 
                           related_name='recipe_ingredients')
    preparation_notes = models.TextField(blank=True, null=True, 
                                       help_text='Special preparation instructions')
    is_optional = models.BooleanField(default=False, 
                                    help_text='Whether this ingredient can be omitted')
    step = models.PositiveIntegerField(default=1, 
                                     help_text='Step number in the recipe when this ingredient is used')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        ordering = ['recipe', 'step', 'inventory_item__name']
        verbose_name = 'Recipe Ingredient'
        verbose_name_plural = 'Recipe Ingredients'
    
    def __str__(self):
        return (f"{self.quantity} {self.unit.abbreviation} {self.inventory_item.name} "
                f"for {self.recipe}")
    
    @property
    def cost(self):
        """Calculate the total cost of this ingredient for the recipe"""
        # Convert to the inventory item's base unit if needed
        if self.unit != self.inventory_item.unit:
            # Implement unit conversion logic here if needed
            # For now, we'll assume the units are compatible
            pass
        return self.quantity * self.inventory_item.average_cost
    
    def save(self, *args, **kwargs):
        # If no unit is specified, use the inventory item's default unit
        if not hasattr(self, 'unit') or not self.unit:
            self.unit = self.inventory_item.unit
        super().save(*args, **kwargs)

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('ORDER', 'New Order'),
        ('RESERVATION', 'New Reservation'),
        ('LOW_STOCK', 'Low Stock Alert'),
        ('SYSTEM', 'System Notification'),
        ('PROMOTION', 'Promotion'),
    )
    
    recipient = models.ForeignKey(User, related_name='notifications', on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object_type = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_notification_type_display()} - {self.title}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Create a basic profile for all users
        if not hasattr(instance, 'profile'):
            Profile.objects.create(user=instance)
            
        # Create staff profile for staff users
        if instance.user_type == 'STAFF' and not hasattr(instance, 'staff_profile'):
            # Create staff profile with required fields only
            staff_profile = StaffProfile(
                user=instance,
                employee_id=f"TEMP-{str(instance.id).zfill(3)}",
                position='WAITER',
                department='FRONT_OF_HOUSE',
                hire_date=timezone.now().date(),
                is_active=True,
                is_full_time=True,
                shift_preference='AFTERNOON',
                weekly_hours=40,
                emergency_contact_name=f"Emergency Contact for {instance.get_full_name() or 'User'}",
                emergency_contact_phone='+1234567890',
                emergency_contact_relation='Parent',
                # Set default values for required fields
                hourly_rate=15.00,
                salary=2000.00
            )
            
            # Save the staff profile (this will trigger the save method to generate a proper employee_id)
            staff_profile.save()

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # Only save if this is not a recursive call
    if not hasattr(instance, '_dirty'):
        instance._dirty = True
        try:
            # Save profile if it exists
            if hasattr(instance, 'profile'):
                instance.profile.save()
                
            # Save staff profile if it exists
            if hasattr(instance, 'staff_profile'):
                instance.staff_profile.save(update_fields=[])
        finally:
            # Clean up the dirty flag
            instance._dirty = False
