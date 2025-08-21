from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import (
    User, Profile, StaffProfile, Category, Product, Table, 
    Order, OrderItem, Payment, Reservation, InventoryItem, 
    InventoryTransaction, Recipe, RecipeIngredient, Notification
)

# Custom User Admin
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'

class StaffProfileInline(admin.StackedInline):
    model = StaffProfile
    can_delete = False
    verbose_name_plural = 'Staff Profile'
    fk_name = 'user'

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline, StaffProfileInline)
    list_display = ('email', 'first_name', 'last_name', 'user_type', 'is_staff', 'is_active')
    list_filter = ('user_type', 'is_staff', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    filter_horizontal = ('groups', 'user_permissions',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone_number', 'address')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('User Type', {'fields': ('user_type',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'user_type', 'is_staff', 'is_active')}
        ),
    )

    def get_inline_instances(self, request, obj=None):
        if not obj:
            return list()
        return super().get_inline_instances(request, obj)

# Category Admin
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    prepopulated_fields = {}

# Product Admin
class RecipeInline(admin.StackedInline):
    model = Recipe
    can_delete = False
    extra = 0
    fields = ('preparation_time', 'cooking_time', 'servings', 'instructions')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_available', 'is_vegetarian', 'is_gluten_free', 'is_spicy')
    list_filter = ('is_available', 'is_vegetarian', 'is_gluten_free', 'is_spicy', 'category')
    search_fields = ('name', 'description')
    list_editable = ('is_available', 'price')
    inlines = [RecipeInline]
    filter_horizontal = ()

# Table Admin
@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('table_number', 'capacity', 'status', 'is_active')
    list_filter = ('status', 'is_active')
    search_fields = ('table_number', 'location')
    list_editable = ('status', 'is_active')

# Order Admin
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('total_price',)
    fields = ('menu_item', 'quantity', 'unit_price', 'total_price', 'special_instructions', 'status')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'customer', 'table', 'status', 'payment_status', 'grand_total', 'created_at')
    list_filter = ('status', 'payment_status', 'created_at')
    search_fields = ('order_id', 'customer__email', 'table__table_number')
    readonly_fields = ('order_id', 'created_at', 'updated_at')
    inlines = [OrderItemInline]
    date_hierarchy = 'created_at'

# Payment Admin
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'amount', 'payment_method', 'status', 'payment_date')
    list_filter = ('payment_method', 'status', 'payment_date')
    search_fields = ('order__order_id', 'transaction_id')
    date_hierarchy = 'payment_date'

# Reservation Admin
@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('customer', 'table', 'reservation_date', 'start_time', 'party_size', 'status')
    list_filter = ('status', 'reservation_date')
    search_fields = ('customer__email', 'table__table_number')
    date_hierarchy = 'reservation_date'

# Inventory Admin
class InventoryTransactionInline(admin.TabularInline):
    model = InventoryTransaction
    extra = 0
    readonly_fields = ('created_at', 'created_by')
    fields = ('transaction_type', 'quantity', 'unit', 'unit_price', 'total_amount', 'reference', 'created_at', 'created_by')

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'current_stock', 'unit_display', 'average_cost', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'description', 'supplier__name')
    inlines = [InventoryTransactionInline]
    list_editable = ('is_active',)
    
    def current_stock(self, obj):
        return obj.quantity
    current_stock.short_description = 'Current Stock'
    
    def unit_display(self, obj):
        return obj.unit.abbreviation if obj.unit else ''
    unit_display.short_description = 'Unit'
    
    def average_cost(self, obj):
        return f"${obj.average_cost:.2f}" if obj.average_cost else 'N/A'
    average_cost.short_description = 'Avg Cost'
    
    actions = ['mark_as_active', 'mark_as_inactive']

    def mark_as_active(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} items marked as active.")
    mark_as_active.short_description = "Mark selected items as active"

    def mark_as_inactive(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} items marked as inactive.")
    mark_as_inactive.short_description = "Mark selected items as inactive"

# Recipe Admin
class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 1
    fields = ('inventory_item', 'quantity', 'unit', 'notes')

@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('product', 'preparation_time', 'cooking_time', 'servings')
    search_fields = ('product__name', 'description')
    inlines = [RecipeIngredientInline]

# Notification Admin
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'recipient', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('title', 'message', 'recipient__email')
    list_editable = ('is_read',)
    date_hierarchy = 'created_at'
    actions = ['mark_as_read', 'mark_as_unread']

    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f"{updated} notifications marked as read.")
    mark_as_read.short_description = "Mark selected notifications as read"

    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False)
        self.message_user(request, f"{updated} notifications marked as unread.")
    mark_as_unread.short_description = "Mark selected notifications as unread"

# Register remaining models with default admin
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'date_of_birth')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')

@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'position', 'hire_date', 'is_active')
    list_filter = ('position', 'is_active')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'staff_id')

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('product_name', 'order', 'quantity', 'unit_price', 'total_price', 'status')
    list_filter = ('status',)
    search_fields = ('product__name', 'order__order_id')
    
    def product_name(self, obj):
        return obj.product.name if obj.product else 'N/A'
    product_name.short_description = 'Product'

@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ('inventory_item_name', 'transaction_type', 'quantity_with_unit', 'total_cost', 'get_reference', 'created_at')
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('inventory_item__name', 'reference', 'notes')
    date_hierarchy = 'created_at'
    
    def get_reference(self, obj):
        return obj.reference or 'N/A'
    get_reference.short_description = 'Reference'
    
    def inventory_item_name(self, obj):
        return obj.inventory_item.name if obj.inventory_item else 'N/A'
    inventory_item_name.short_description = 'Item'
    
    def quantity_with_unit(self, obj):
        unit = obj.unit.abbreviation if obj.unit else ''
        return f"{obj.quantity} {unit}"
    quantity_with_unit.short_description = 'Quantity'
    
    def total_cost(self, obj):
        return f"${obj.total_amount:.2f}" if obj.total_amount else 'N/A'
    total_cost.short_description = 'Total Cost'

@admin.register(RecipeIngredient)
class RecipeIngredientAdmin(admin.ModelAdmin):
    list_display = ('recipe', 'inventory_item', 'quantity', 'unit')
    search_fields = ('recipe__menu_item__name', 'inventory_item__name')
