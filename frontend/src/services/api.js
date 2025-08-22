import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (error) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_type');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  // Admin login
  adminLogin: (credentials) =>
    api.post('/auth/admin/login/', credentials).then((res) => {
      if (res.data.access) {
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);
        localStorage.setItem('user_type', 'admin');
      }
      return res;
    }),

  // Manager login (also used for admin login)
  managerLogin: (credentials) =>
    api.post('/auth/manager/login/', credentials)
      .then((res) => {
        if (res.data && res.data.access) {
          localStorage.setItem('access_token', res.data.access);
          localStorage.setItem('refresh_token', res.data.refresh);
          
          // Store user data if available
          if (res.data.user) {
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
          
          // Set user type based on response or default to 'manager'
          const userType = res.data.user?.user_type?.toLowerCase() || 'manager';
          localStorage.setItem('user_type', userType);
          
          return res.data;
        }
        throw new Error('Invalid response from server');
      })
      .catch(error => {
        console.error('Login error:', error);
        throw error.response?.data || { error: 'Failed to log in. Please check your credentials.' };
      }),

  // Staff login
  staffLogin: async (staffId) => {
    try {
      // Ensure staffId is a string and trim any whitespace
      const cleanStaffId = String(staffId || '').trim();
      
      if (!cleanStaffId) {
        throw new Error('Staff ID is required');
      }
      
      const response = await api.post(
        '/auth/staff/login/',
        { employee_id: cleanStaffId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true
        }
      );
      
      if (response.data && response.data.access) {
        // Store tokens
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        
        // Store user data if available
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          // If user data isn't in the response, fetch it
          try {
            const userResponse = await api.get('/auth/me/');
            if (userResponse.data) {
              localStorage.setItem('user', JSON.stringify(userResponse.data));
              response.data.user = userResponse.data;
            }
          } catch (userError) {
            console.warn('Could not fetch user data:', userError);
          }
        }
        
        return response.data;
      }
      
      throw new Error('Invalid response from server');
      
    } catch (error) {
      console.error('Staff login error:', error);
      throw error;
    }
  },

  // Register new user
  register: (userData) => api.post('/api/auth/register/', userData),
  
  // Logout
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    return Promise.resolve();
  },
  
  // Get current user
  getCurrentUser: () => api.get('/auth/me/'),
  
  // Refresh token
  refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
  
  // Verify token
  verifyToken: (token) => api.post('/auth/token/verify/', { token })
};

// Cloudinary API
export const cloudinaryApi = {
  // Upload image to Cloudinary
  uploadImage: (file, folder = 'platera') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    return api.post('/cloudinary/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete image from Cloudinary
  deleteImage: (publicId) => {
    return api.delete('/cloudinary/delete', { data: { publicId } });
  },
};

// Products API
export const productsApi = {
  // Get all products with optional filtering
  getProducts: (params = {}) => api.get('/api/products/', { params }),
  
  // Get a single product by ID
  getProduct: (id) => api.get(`/api/products/${id}/`),
  
  // Create a new product
  createProduct: (productData) => {
    const formData = new FormData();
    
    // Append all fields to form data
    Object.keys(productData).forEach(key => {
      if (key === 'image' && productData[key]) {
        formData.append('image', productData[key]);
      } else if (Array.isArray(productData[key])) {
        productData[key].forEach(item => formData.append(key, item));
      } else if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });
    
    return api.post('/api/products/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Update an existing product
  updateProduct: (id, productData) => {
    const formData = new FormData();
    
    // Append all fields to form data
    Object.keys(productData).forEach(key => {
      if (key === 'image' && productData[key]) {
        if (productData[key] instanceof File) {
          formData.append('image', productData[key]);
        }
      } else if (Array.isArray(productData[key])) {
        productData[key].forEach(item => formData.append(key, item));
      } else if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });
    
    return api.patch(`/api/products/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete a product
  deleteProduct: (id) => api.delete(`/api/products/${id}/`),
  
  // Toggle product availability
  toggleAvailability: (id, isAvailable) => 
    api.patch(`/api/products/${id}/`, { is_available: isAvailable }),
};

// Categories API
export const categoriesApi = {
  // Get all categories
  getCategories: () => api.get('/api/categories/'),
  
  // Get a single category by ID
  getCategory: (id) => api.get(`/api/categories/${id}/`),
  
  // Create a new category
  createCategory: (categoryData) => {
    const formData = new FormData();
    
    // Append all fields to form data
    Object.keys(categoryData).forEach(key => {
      if (key === 'image' && categoryData[key]) {
        formData.append('image', categoryData[key]);
      } else if (categoryData[key] !== null && categoryData[key] !== undefined) {
        formData.append(key, categoryData[key]);
      }
    });
    
    return api.post('/api/categories/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Update an existing category
  updateCategory: (id, categoryData) => {
    const formData = new FormData();
    
    // Append all fields to form data
    Object.keys(categoryData).forEach(key => {
      if (key === 'image' && categoryData[key]) {
        if (categoryData[key] instanceof File) {
          formData.append('image', categoryData[key]);
        }
      } else if (categoryData[key] !== null && categoryData[key] !== undefined) {
        formData.append(key, categoryData[key]);
      }
    });
    
    return api.patch(`/api/categories/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete a category
  deleteCategory: (id) => api.delete(`/categories/${id}/`),
};

// Staff API
export const staffApi = {
  // Get all staff members with optional filtering
  getStaffMembers: async (params = {}) => {
    try {
      console.log('Fetching staff members with params:', params);
      const response = await api.get('/users/', { 
        ...params,
        user_type: 'STAFF' // Filter only staff users
      });
      console.log('Staff members response:', response);
      return response;
    } catch (error) {
      console.error('Error in getStaffMembers:', error);
      throw error;
    }
  },
  
  // Get a single staff member by ID
  getStaffMember: (id) => api.get(`/users/${id}/`),
  
  // Create a new staff member
  createStaffMember: async (staffData) => {
    try {
      const formData = new FormData();
      
      // Add user_type as STAFF
      const staffDataWithType = {
        ...staffData,
        user_type: 'STAFF' // Ensure new users are created as STAFF type
      };
      
      // Append all fields to form data
      Object.keys(staffDataWithType).forEach(key => {
        if (key === 'profile_picture' && staffDataWithType[key]) {
          formData.append('profile_picture', staffDataWithType[key]);
        } else if (staffDataWithType[key] !== null && staffDataWithType[key] !== undefined) {
          formData.append(key, staffDataWithType[key]);
        }
      });
      
      // Add user type and staff status
      formData.append('user_type', 'STAFF');
      formData.append('is_staff', 'true');
      
      console.log('Creating staff with data:', Object.fromEntries(formData));
      const response = await api.post('/auth/register/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Staff created successfully:', response.data);
      return response;
    } catch (error) {
      console.error('Error in createStaffMember:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  },
  
  // Update an existing staff member
  updateStaffMember: (id, staffData) => {
    const formData = new FormData();
    
    // Append all fields to form data
    Object.keys(staffData).forEach(key => {
      if (key === 'profile_picture' && staffData[key]) {
        if (staffData[key] instanceof File) {
          formData.append('profile_picture', staffData[key]);
        }
      } else if (staffData[key] !== null && staffData[key] !== undefined) {
        formData.append(key, staffData[key]);
      }
    });
    
    return api.patch(`/users/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete a staff member
  deleteStaffMember: (id) => api.delete(`/users/${id}/`),
  
  // Update staff status (active/inactive)
  updateStaffStatus: (id, isActive) => 
    api.patch(`/users/${id}/`, { is_active: isActive }),
  
  // Get staff shifts
  getShifts: (params = {}) => {
    // If we have a staff ID, filter shifts by that staff member
    if (params.staffId) {
      return api.get(`/users/${params.staffId}/shifts/`);
    }
    // Otherwise get all shifts
    return api.get('/shifts/');
  },
  
  // Create a new shift
  createShift: (shiftData) => api.post('/shifts/', shiftData),
  
  // Update an existing shift
  updateShift: (id, shiftData) => api.patch(`/shifts/${id}/`, shiftData),
  
  // Delete a shift
  deleteShift: (id) => api.delete(`/shifts/${id}/`)
};

// Tables API
export const tableApi = {
  // Get all tables with optional filtering
  getTables: (params = {}) => api.get('/api/tables/', { params }),
  
  // Get a single table by ID
  getTable: (id) => api.get(`/api/tables/${id}/`),
  
  // Create a new table
  createTable: (tableData) => api.post('/api/tables/', tableData),
  
  // Update an existing table
  updateTable: (id, tableData) => api.patch(`/api/tables/${id}/`, tableData),
  
  // Delete a table
  deleteTable: (id) => api.delete(`/api/tables/${id}/`),
  
  // Update table status (available, occupied, reserved, cleaning, etc.)
  updateTableStatus: (id, status, orderId = null) => {
    const data = { status };
    if (orderId) data.order = orderId;
    return api.patch(`/api/tables/${id}/status/`, data);
  },
  
  // Get tables by status
  getTablesByStatus: (status, params = {}) => 
    api.get('/api/tables/', { params: { status, ...params } }),
    
  // Get tables by section/area
  getTablesBySection: (sectionId, params = {}) => 
    api.get('/api/tables/', { params: { section: sectionId, ...params } }),
    
  // Get tables by capacity (min and max)
  getTablesByCapacity: (minCapacity, maxCapacity = null, params = {}) => {
    const queryParams = { min_capacity: minCapacity, ...params };
    if (maxCapacity) queryParams.max_capacity = maxCapacity;
    return api.get('/api/tables/', { params: queryParams });
  },
  
  // Get available tables for a given party size and time
  getAvailableTables: (partySize, startTime, endTime, params = {}) => 
    api.get('/api/tables/available/', { 
      params: { 
        party_size: partySize, 
        start_time: startTime, 
        end_time: endTime,
        ...params 
      } 
    }),
    
  // Reserve a table
  reserveTable: (tableId, reservationData) => 
    api.post(`/api/tables/${tableId}/reserve/`, reservationData),
    
  // Cancel a reservation
  cancelReservation: (tableId, reservationId) => 
    api.post(`/api/tables/${tableId}/cancel-reservation/`, { reservation_id: reservationId }),
    
  // Get table reservations
  getTableReservations: (tableId, params = {}) => 
    api.get(`/api/tables/${tableId}/reservations/`, { params }),
    
  // Get table current order
  getTableOrder: (tableId) => 
    api.get(`/api/tables/${tableId}/current-order/`),
    
  // Assign table to server/staff
  assignTable: (tableId, staffId) => 
    api.patch(`/api/tables/${tableId}/assign/`, { staff: staffId }),
    
  // Clear table (after service)
  clearTable: (tableId) => 
    api.post(`/api/tables/${tableId}/clear/`),
    
  // Get table status history
  getTableStatusHistory: (tableId, params = {}) => 
    api.get(`/api/tables/${tableId}/status-history/`, { params }),
};

// Reservations API
export const reservationApi = {
  // Get all reservations with optional filtering
  getReservations: (params = {}) => api.get('/api/reservations/', { params }),
  
  // Get a single reservation by ID
  getReservation: (id) => api.get(`/api/reservations/${id}/`),
  
  // Create a new reservation
  createReservation: (reservationData) => 
    api.post('/api/reservations/', reservationData),
  
  // Update an existing reservation
  updateReservation: (id, reservationData) => 
    api.patch(`/api/reservations/${id}/`, reservationData),
  
  // Delete a reservation
  deleteReservation: (id) => api.delete(`/api/reservations/${id}/`),
  
  // Update reservation status (confirmed, seated, cancelled, no-show, completed)
  updateReservationStatus: (id, status, notes = '') => 
    api.patch(`/api/reservations/${id}/status/`, { status, notes }),
    
  // Get reservations by status
  getReservationsByStatus: (status, params = {}) => 
    api.get('/api/reservations/', { params: { status, ...params } }),
    
  // Get reservations by customer
  getReservationsByCustomer: (customerId, params = {}) => 
    api.get('/api/reservations/', { params: { customer: customerId, ...params } }),
    
  // Get reservations by date range
  getReservationsByDateRange: (startDate, endDate, params = {}) => 
    api.get('/api/reservations/', { 
      params: { 
        start_date: startDate,
        end_date: endDate,
        ...params 
      } 
    }),
    
  // Get reservations by table
  getReservationsByTable: (tableId, params = {}) => 
    api.get('/api/reservations/', { params: { table: tableId, ...params } }),
    
  // Get upcoming reservations
  getUpcomingReservations: (params = {}) => 
    api.get('/api/reservations/upcoming/', { params }),
    
  // Get today's reservations
  getTodaysReservations: (params = {}) => 
    api.get('/api/reservations/today/', { params }),
    
  // Check table availability
  checkTableAvailability: (partySize, startTime, endTime, excludeReservationId = null) => {
    const params = { 
      party_size: partySize, 
      start_time: startTime, 
      end_time: endTime 
    };
    
    if (excludeReservationId) {
      params.exclude_reservation = excludeReservationId;
    }
    
    return api.get('/api/reservations/check-availability/', { params });
  },
  
  // Get reservation history for a customer
  getCustomerReservationHistory: (customerId, params = {}) => 
    api.get(`/api/customers/${customerId}/reservations/`, { params }),
    
  // Get no-show history for a customer
  getCustomerNoShowHistory: (customerId, params = {}) => 
    api.get(`/api/customers/${customerId}/no-shows/`, { params }),
    
  // Send reservation confirmation
  sendConfirmation: (reservationId, method = 'email') => 
    api.post(`/api/reservations/${reservationId}/send-confirmation/`, { method }),
    
  // Send reminder for upcoming reservation
  sendReminder: (reservationId, method = 'sms') => 
    api.post(`/api/reservations/${reservationId}/send-reminder/`, { method }),
    
  // Get waitlist entries
  getWaitlist: (params = {}) => 
    api.get('/api/reservations/waitlist/', { params }),
    
  // Add to waitlist
  addToWaitlist: (waitlistData) => 
    api.post('/api/reservations/waitlist/', waitlistData),
    
  // Remove from waitlist
  removeFromWaitlist: (waitlistId) => 
    api.delete(`/api/reservations/waitlist/${waitlistId}/`),
    
  // Get reservation statistics
  getStatistics: (params = {}) => 
    api.get('/api/reservations/statistics/', { params })
};

// Inventory API
export const inventoryApi = {
  // ===== INVENTORY ITEMS =====
  
  // Get all inventory items with optional filtering
  getInventoryItems: (params = {}) => api.get('/api/inventory/items/', { params }),
  
  // Get a single inventory item by ID
  getInventoryItem: (id) => api.get(`/api/inventory/items/${id}/`),
  
  // Create a new inventory item
  createInventoryItem: (itemData) => {
    const formData = new FormData();
    
    // Append all fields to form data
    Object.keys(itemData).forEach(key => {
      if (key === 'image' && itemData[key]) {
        formData.append('image', itemData[key]);
      } else if (itemData[key] !== null && itemData[key] !== undefined) {
        formData.append(key, itemData[key]);
      }
    });
    
    return api.post('/api/inventory/items/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  // Update an existing inventory item
  updateInventoryItem: (id, itemData) => {
    const formData = new FormData();
    
    // Append all fields to form data
    Object.keys(itemData).forEach(key => {
      if (key === 'image' && itemData[key]) {
        if (itemData[key] instanceof File) {
          formData.append('image', itemData[key]);
        }
      } else if (itemData[key] !== null && itemData[key] !== undefined) {
        formData.append(key, itemData[key]);
      }
    });
    
    return api.patch(`/api/inventory/items/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete an inventory item (soft delete)
  deleteInventoryItem: (id) => api.delete(`/api/inventory/items/${id}/`),
  
  // Get low stock items
  getLowStockItems: (threshold = null, params = {}) => {
    const queryParams = { ...params };
    if (threshold !== null) queryParams.threshold = threshold;
    return api.get('/api/inventory/items/low-stock/', { params: queryParams });
  },
  
  // Get items by category
  getItemsByCategory: (categoryId, params = {}) => 
    api.get('/api/inventory/items/', { params: { category: categoryId, ...params } }),
    
  // Search inventory items
  searchItems: (query, params = {}) => 
    api.get('/api/inventory/items/search/', { params: { q: query, ...params } }),
    
  // ===== INVENTORY CATEGORIES =====
  
  // Get all categories
  getCategories: (params = {}) => api.get('/api/inventory/categories/', { params }),
  
  // Get a single category
  getCategory: (id) => api.get(`/api/inventory/categories/${id}/`),
  
  // Create a new category
  createCategory: (categoryData) => 
    api.post('/api/inventory/categories/', categoryData),
    
  // Update a category
  updateCategory: (id, categoryData) => 
    api.patch(`/api/inventory/categories/${id}/`, categoryData),
    
  // Delete a category
  deleteCategory: (id) => api.delete(`/api/inventory/categories/${id}/`),
  
  // ===== SUPPLIERS =====
  
  // Get all suppliers
  getSuppliers: (params = {}) => api.get('/api/inventory/suppliers/', { params }),
  
  // Get a single supplier
  getSupplier: (id) => api.get(`/api/inventory/suppliers/${id}/`),
  
  // Create a new supplier
  createSupplier: (supplierData) => 
    api.post('/api/inventory/suppliers/', supplierData),
    
  // Update a supplier
  updateSupplier: (id, supplierData) => 
    api.patch(`/api/inventory/suppliers/${id}/`, supplierData),
    
  // Delete a supplier
  deleteSupplier: (id) => api.delete(`/api/inventory/suppliers/${id}/`),
  
  // Get items by supplier
  getItemsBySupplier: (supplierId, params = {}) => 
    api.get('/api/inventory/items/', { params: { supplier: supplierId, ...params } }),
    
  // ===== STOCK MOVEMENTS =====
  
  // Get all stock movements
  getStockMovements: (params = {}) => 
    api.get('/api/inventory/movements/', { params }),
    
  // Get a single stock movement
  getStockMovement: (id) => 
    api.get(`/api/inventory/movements/${id}/`),
    
  // Add stock (increment)
  addStock: (itemId, quantity, notes = '', unitCost = null) => {
    const data = { quantity, notes, movement_type: 'addition' };
    if (unitCost !== null) data.unit_cost = unitCost;
    return api.post(`/api/inventory/items/${itemId}/movements/`, data);
  },
  
  // Remove stock (decrement)
  removeStock: (itemId, quantity, notes = '') => 
    api.post(`/api/inventory/items/${itemId}/movements/`, {
      quantity,
      notes,
      movement_type: 'subtraction'
    }),
    
  // Adjust stock (set to specific quantity)
  adjustStock: (itemId, newQuantity, notes = '') => 
    api.post(`/api/inventory/items/${itemId}/adjust/`, {
      new_quantity: newQuantity,
      notes
    }),
    
  // Get stock movements for an item
  getItemStockMovements: (itemId, params = {}) => 
    api.get(`/api/inventory/items/${itemId}/movements/`, { params }),
    
  // Get stock movement statistics
  getStockMovementStats: (params = {}) => 
    api.get('/api/inventory/movements/stats/', { params }),
    
  // ===== INVENTORY REPORTS =====
  
  // Get inventory valuation report
  getValuationReport: (params = {}) => 
    api.get('/api/inventory/reports/valuation/', { params }),
    
  // Get stock movement report
  getMovementReport: (startDate, endDate, params = {}) => 
    api.get('/api/inventory/reports/movements/', { 
      params: { start_date: startDate, end_date: endDate, ...params } 
    }),
    
  // Get expiry report
  getExpiryReport: (daysUntilExpiry = 30, params = {}) => 
    api.get('/api/inventory/reports/expiry/', { 
      params: { days: daysUntilExpiry, ...params } 
    }),
    
  // Get low stock report
  getLowStockReport: (threshold = null, params = {}) => {
    const queryParams = { ...params };
    if (threshold !== null) queryParams.threshold = threshold;
    return api.get('/api/inventory/reports/low-stock/', { params: queryParams });
  },
  
  // ===== INVENTORY SETTINGS =====
  
  // Get inventory settings
  getSettings: () => api.get('/api/inventory/settings/'),
  
  // Update inventory settings
  updateSettings: (settings) => api.patch('/api/inventory/settings/', settings),
  
  // Get units of measurement
  getUnits: () => api.get('/api/inventory/units/'),
  
  // Create a custom unit
  createUnit: (unitData) => api.post('/api/inventory/units/', unitData),
  
  // Update a unit
  updateUnit: (id, unitData) => api.patch(`/api/inventory/units/${id}/`, unitData),
  
  // Delete a unit
  deleteUnit: (id) => api.delete(`/api/inventory/units/${id}/`),
};

// Menu API
export const menuApi = {
  // Get all menu categories
  getCategories() {
    return api.get('/api/menu/categories/');
  },
  
  // Get all menu items with pagination
  getMenuItems(params = {}) {
    return api.get('/api/menu/items/', { params });
  },
  
  // Get a single menu item by ID
  getMenuItem(id) {
    return api.get(`/api/menu/items/${id}/`);
  },
  
  // Create a new menu item
  createMenuItem(itemData) {
    return api.post('/api/menu/items/', itemData);
  },
  
  // Update an existing menu item
  updateMenuItem(id, itemData) {
    return api.patch(`/api/menu/items/${id}/`, itemData);
  },
  
  // Delete a menu item
  deleteMenuItem(id) {
    return api.delete(`/api/menu/items/${id}/`);
  },
  
  // Get menu items by category
  getItemsByCategory(categoryId, params = {}) {
    return api.get(`/api/menu/categories/${categoryId}/items/`, { params });
  },
  
  // Search menu items
  searchItems(query, params = {}) {
    return api.get('/api/menu/items/search/', { 
      params: { q: query, ...params } 
    });
  },
  
  // Update menu item availability
  updateAvailability(id, isAvailable) {
    return api.patch(`/api/menu/items/${id}/availability/`, { is_available: isAvailable });
  },
  
  // Get featured menu items
  getFeaturedItems(params = {}) {
    return api.get('/api/menu/featured/', { params });
  },
  
  // Get popular menu items
  getPopularItems(limit = 10) {
    return api.get('/api/menu/popular/', { params: { limit } });
  },
  
  // Get menu item nutrition information
  getNutritionInfo(itemId) {
    return api.get(`/api/menu/items/${itemId}/nutrition/`);
  },
  
  // Get menu item ingredients
  getIngredients(itemId) {
    return api.get(`/api/menu/items/${itemId}/ingredients/`);
  },
  
  // Get menu item variations
  getVariations(itemId) {
    return api.get(`/api/menu/items/${itemId}/variations/`);
  },
  
  // Get menu item add-ons
  getAddOns(itemId) {
    return api.get(`/api/menu/items/${itemId}/addons/`);
  },
  
  // Get menu item reviews
  getReviews(itemId, params = {}) {
    return api.get(`/api/menu/items/${itemId}/reviews/`, { params });
  },
  
  // Add a review to a menu item
  addReview(itemId, reviewData) {
    return api.post(`/api/menu/items/${itemId}/reviews/`, reviewData);
  },
  
  // Get menu item images
  getItemImages(itemId) {
    return api.get(`/api/menu/items/${itemId}/images/`);
  },
  
  // Upload menu item image
  uploadItemImage(itemId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post(`/api/menu/items/${itemId}/images/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Get all menu tags
  getTags() {
    return api.get('/api/menu/tags/');
  },
  
  // Get menu items by tag
  getItemsByTag(tag, params = {}) {
    return api.get(`/api/menu/tags/${encodeURIComponent(tag)}/items/`, { params });
  },
  
  // Get menu item options
  getItemOptions(itemId) {
    return api.get(`/api/menu/items/${itemId}/options/`);
  },
  
  // Get menu item modifiers
  getItemModifiers(itemId) {
    return api.get(`/api/menu/items/${itemId}/modifiers/`);
  },
  
  // Get menu item availability
  getItemAvailability(itemId) {
    return api.get(`/api/menu/items/${itemId}/availability/`);
  }
};

// Recipes API
export const recipeApi = {
  // ===== RECIPES =====
  
  // Get all recipes with optional filtering
  getRecipes: (params = {}) => api.get('/api/recipes/', { params }),
  
  // Get a single recipe by ID
  getRecipe: (id) => api.get(`/api/recipes/${id}/`),
  
  // Create a new recipe
  createRecipe: (recipeData) => {
    const formData = new FormData();
    
    // Append all fields to form data
    Object.keys(recipeData).forEach(key => {
      if (key === 'image' && recipeData[key]) {
        if (recipeData[key] instanceof File) {
          formData.append('image', recipeData[key]);
        }
      } else if (recipeData[key] !== null && recipeData[key] !== undefined) {
        formData.append(key, recipeData[key]);
      }
    });
    
    return api.post('/api/recipes/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Update an existing recipe
  updateRecipe: (id, recipeData) => {
    const formData = new FormData();
    
    // Append all fields to form data
    Object.keys(recipeData).forEach(key => {
      if (key === 'image' && recipeData[key]) {
        if (recipeData[key] instanceof File) {
          formData.append('image', recipeData[key]);
        } else if (recipeData[key] === null) {
          // This is how we can remove an image
          formData.append('image', '');
        }
      } else if (recipeData[key] !== null && recipeData[key] !== undefined) {
        formData.append(key, recipeData[key]);
      }
    });
    
    return api.patch(`/api/recipes/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete a recipe (soft delete)
  deleteRecipe: (id) => api.delete(`/api/recipes/${id}/`),
  
  // Search recipes
  searchRecipes: (query, params = {}) => 
    api.get('/api/recipes/search/', { params: { q: query, ...params } }),
    
  // Get recipes by category
  getRecipesByCategory: (categoryId, params = {}) => 
    api.get('/api/recipes/', { params: { category: categoryId, ...params } }),
    
  // Get recipes by tag
  getRecipesByTag: (tag, params = {}) => 
    api.get('/api/recipes/', { params: { tag, ...params } }),
    
  // Get popular recipes
  getPopularRecipes: (limit = 10, params = {}) => 
    api.get('/api/recipes/popular/', { params: { limit, ...params } }),
    
  // Get recommended recipes (based on user preferences/order history)
  getRecommendedRecipes: (params = {}) => 
    api.get('/api/recipes/recommended/', { params }),
    
  // ===== RECIPE INGREDIENTS =====
  
  // Get all ingredients for a recipe
  getRecipeIngredients: (recipeId, params = {}) => 
    api.get(`/api/recipes/${recipeId}/ingredients/`, { params }),
    
  // Get a single recipe ingredient
  getRecipeIngredient: (recipeId, ingredientId) => 
    api.get(`/api/recipes/${recipeId}/ingredients/${ingredientId}/`),
    
  // Add an ingredient to a recipe
  addRecipeIngredient: (recipeId, ingredientData) => 
    api.post(`/api/recipes/${recipeId}/ingredients/`, ingredientData),
    
  // Update a recipe ingredient
  updateRecipeIngredient: (recipeId, ingredientId, ingredientData) => 
    api.patch(`/api/recipes/${recipeId}/ingredients/${ingredientId}/`, ingredientData),
    
  // Remove an ingredient from a recipe
  removeRecipeIngredient: (recipeId, ingredientId) => 
    api.delete(`/api/recipes/${recipeId}/ingredients/${ingredientId}/`),
    
  // Bulk update recipe ingredients
  bulkUpdateRecipeIngredients: (recipeId, ingredientsData) => 
    api.put(`/api/recipes/${recipeId}/ingredients/bulk-update/`, { ingredients: ingredientsData }),
    
  // ===== RECIPE STEPS =====
  
  // Get all steps for a recipe
  getRecipeSteps: (recipeId, params = {}) => 
    api.get(`/api/recipes/${recipeId}/steps/`, { params }),
    
  // Get a single recipe step
  getRecipeStep: (recipeId, stepId) => 
    api.get(`/api/recipes/${recipeId}/steps/${stepId}/`),
    
  // Add a step to a recipe
  addRecipeStep: (recipeId, stepData) => 
    api.post(`/api/recipes/${recipeId}/steps/`, stepData),
    
  // Update a recipe step
  updateRecipeStep: (recipeId, stepId, stepData) => 
    api.patch(`/api/recipes/${recipeId}/steps/${stepId}/`, stepData),
    
  // Reorder recipe steps
  reorderRecipeSteps: (recipeId, stepsOrder) => 
    api.post(`/api/recipes/${recipeId}/steps/reorder/`, { order: stepsOrder }),
    
  // Delete a recipe step
  deleteRecipeStep: (recipeId, stepId) => 
    api.delete(`/api/recipes/${recipeId}/steps/${stepId}/`),
    
  // ===== RECIPE NUTRITION =====
  
  // Get nutrition information for a recipe
  getRecipeNutrition: (recipeId) => 
    api.get(`/api/recipes/${recipeId}/nutrition/`),
    
  // Calculate nutrition for a recipe
  calculateRecipeNutrition: (recipeId) => 
    api.post(`/api/recipes/${recipeId}/calculate-nutrition/`),
    
  // ===== RECIPE TAGS & CATEGORIES =====
  
  // Get all recipe tags
  getRecipeTags: (params = {}) => 
    api.get('/api/recipes/tags/', { params }),
    
  // Get all recipe categories
  getRecipeCategories: (params = {}) => 
    api.get('/api/recipes/categories/', { params }),
    
  // ===== RECIPE RATINGS & REVIEWS =====
  
  // Get recipe ratings
  getRecipeRatings: (recipeId, params = {}) => 
    api.get(`/api/recipes/${recipeId}/ratings/`, { params }),
    
  // Add or update a recipe rating
  rateRecipe: (recipeId, rating, review = '') => 
    api.post(`/api/recipes/${recipeId}/rate/`, { rating, review }),
    
  // Delete a recipe rating
  deleteRecipeRating: (recipeId) => 
    api.delete(`/api/recipes/${recipeId}/rate/`),
    
  // ===== RECIPE SCALING =====
  
  // Scale a recipe
  scaleRecipe: (recipeId, scaleFactor) => 
    api.get(`/api/recipes/${recipeId}/scale/`, { params: { scale: scaleFactor } }),
    
  // ===== RECIPE COSTING =====
  
  // Get recipe cost breakdown
  getRecipeCost: (recipeId) => 
    api.get(`/api/recipes/${recipeId}/cost/`),
    
  // Calculate recipe cost based on current ingredient prices
  calculateRecipeCost: (recipeId) => 
    api.post(`/api/recipes/${recipeId}/calculate-cost/`),
    
  // ===== RECIPE MENU ITEMS =====
  
  // Get menu items that use this recipe
  getRecipeMenuItems: (recipeId, params = {}) => 
    api.get(`/api/recipes/${recipeId}/menu-items/`, { params }),
    
  // Get all recipes that can be used in menu items
  getRecipesForMenu: (params = {}) => 
    api.get('/api/recipes/for-menu/', { params }),
    
  // ===== RECIPE BATCHES =====
  
  // Get all batches of a recipe
  getRecipeBatches: (recipeId, params = {}) => 
    api.get(`/api/recipes/${recipeId}/batches/`, { params }),
    
  // Get a single recipe batch
  getRecipeBatch: (recipeId, batchId) => 
    api.get(`/api/recipes/${recipeId}/batches/${batchId}/`),
    
  // Create a new recipe batch
  createRecipeBatch: (recipeId, batchData) => 
    api.post(`/api/recipes/${recipeId}/batches/`, batchData),
    
  // Update a recipe batch
  updateRecipeBatch: (recipeId, batchId, batchData) => 
    api.patch(`/api/recipes/${recipeId}/batches/${batchId}/`, batchData),
    
  // Complete a recipe batch
  completeRecipeBatch: (recipeId, batchId, actualYield = null) => 
    api.post(`/api/recipes/${recipeId}/batches/${batchId}/complete/`, { actual_yield: actualYield }),
    
  // Get batch history for a recipe
  getRecipeBatchHistory: (recipeId, params = {}) => 
    api.get(`/api/recipes/${recipeId}/batch-history/`, { params }),
    
  // ===== RECIPE REPORTS =====
  
  // Get recipe usage report
  getRecipeUsageReport: (startDate, endDate, params = {}) => 
    api.get('/api/recipes/reports/usage/', { 
      params: { start_date: startDate, end_date: endDate, ...params } 
    }),
    
  // Get recipe cost report
  getRecipeCostReport: (params = {}) => 
    api.get('/api/recipes/reports/cost/', { params }),
    
  // Get recipe waste report
  getRecipeWasteReport: (startDate, endDate, params = {}) => 
    api.get('/api/recipes/reports/waste/', { 
      params: { start_date: startDate, end_date: endDate, ...params } 
    }),
    
  // Export recipe data
  exportRecipes: (format = 'csv', params = {}) => 
    api.get('/api/recipes/export/', { 
      params: { format, ...params },
      responseType: 'blob'
    })
};

// Payments API
export const paymentApi = {
  // ===== PAYMENTS =====
  
  // Get all payments with optional filtering
  getPayments: (params = {}) => api.get('/api/payments/', { params }),
  
  // Get a single payment by ID
  getPayment: (id) => api.get(`/api/payments/${id}/`),
  
  // Create a new payment
  createPayment: (paymentData) => api.post('/api/payments/', paymentData),
  
  // Update a payment
  updatePayment: (id, paymentData) => api.patch(`/api/payments/${id}/`, paymentData),
  
  // Delete a payment (soft delete)
  deletePayment: (id) => api.delete(`/api/payments/${id}/`),
  
  // Process a payment for an order
  processPayment: (orderId, paymentData) => 
    api.post(`/api/orders/${orderId}/payments/`, paymentData),
    
  // Process a card payment
  processCardPayment: (orderId, cardData, amount = null, tip = 0) => {
    const data = { 
      payment_method: 'card',
      card: cardData,
      amount,
      tip
    };
    return api.post(`/api/orders/${orderId}/payments/`, data);
  },
  
  // Process a cash payment
  processCashPayment: (orderId, amount, tip = 0) => 
    api.post(`/api/orders/${orderId}/payments/`, {
      payment_method: 'cash',
      amount,
      tip
    }),
    
  // Process a mobile payment (Apple Pay, Google Pay, etc.)
  processMobilePayment: (orderId, paymentToken, amount = null, tip = 0) => 
    api.post(`/api/orders/${orderId}/payments/`, {
      payment_method: 'mobile',
      payment_token: paymentToken,
      amount,
      tip
    }),
    
  // Process a gift card payment
  processGiftCardPayment: (orderId, cardNumber, pin, amount = null) => 
    api.post(`/api/orders/${orderId}/payments/`, {
      payment_method: 'gift_card',
      card_number: cardNumber,
      pin,
      amount
    }),
    
  // Process a split payment
  processSplitPayment: (orderId, payments) => 
    api.post(`/api/orders/${orderId}/split-payment/`, { payments }),
    
  // ===== REFUNDS =====
  
  // Process a refund
  processRefund: (paymentId, amount = null, reason = '') => 
    api.post(`/api/payments/${paymentId}/refund/`, { amount, reason }),
    
  // Get refund details
  getRefund: (refundId) => api.get(`/api/refunds/${refundId}/`),
  
  // Get all refunds for a payment
  getPaymentRefunds: (paymentId, params = {}) => 
    api.get(`/api/payments/${paymentId}/refunds/`, { params }),
    
  // Get all refunds with optional filtering
  getRefunds: (params = {}) => api.get('/api/refunds/', { params }),
  
  // ===== PAYMENT METHODS =====
  
  // Get available payment methods
  getPaymentMethods: (params = {}) => api.get('/api/payment-methods/', { params }),
  
  // Get a specific payment method
  getPaymentMethod: (id) => api.get(`/api/payment-methods/${id}/`),
  
  // Add a payment method
  addPaymentMethod: (methodData) => api.post('/api/payment-methods/', methodData),
  
  // Update a payment method
  updatePaymentMethod: (id, methodData) => 
    api.patch(`/api/payment-methods/${id}/`, methodData),
    
  // Delete a payment method
  deletePaymentMethod: (id) => api.delete(`/api/payment-methods/${id}/`),
  
  // Set default payment method
  setDefaultPaymentMethod: (id) => 
    api.post(`/api/payment-methods/${id}/set-default/`),
    
  // Get customer's saved payment methods
  getCustomerPaymentMethods: (customerId, params = {}) => 
    api.get(`/api/customers/${customerId}/payment-methods/`, { params }),
    
  // ===== TRANSACTIONS =====
  
  // Get all transactions with optional filtering
  getTransactions: (params = {}) => api.get('/api/transactions/', { params }),
  
  // Get a single transaction
  getTransaction: (id) => api.get(`/api/transactions/${id}/`),
  
  // Get transactions for a payment
  getPaymentTransactions: (paymentId, params = {}) => 
    api.get(`/api/payments/${paymentId}/transactions/`, { params }),
    
  // Get transactions for an order
  getOrderTransactions: (orderId, params = {}) => 
    api.get(`/api/orders/${orderId}/transactions/`, { params }),
    
  // ===== INVOICES & RECEIPTS =====
  
  // Get an invoice
  getInvoice: (invoiceId) => api.get(`/api/invoices/${invoiceId}/`),
  
  // Get all invoices with optional filtering
  getInvoices: (params = {}) => api.get('/api/invoices/', { params }),
  
  // Get invoice for a payment
  getPaymentInvoice: (paymentId) => 
    api.get(`/api/payments/${paymentId}/invoice/`),
    
  // Send invoice via email
  sendInvoice: (invoiceId, email = null) => 
    api.post(`/api/invoices/${invoiceId}/send/`, { email }),
    
  // Get payment receipt
  getReceipt: (paymentId) => api.get(`/api/payments/${paymentId}/receipt/`),
  
  // Send receipt via email
  sendReceipt: (paymentId, email = null, resend = false) => 
    api.post(`/api/payments/${paymentId}/send-receipt/`, { email, resend }),
    
  // ===== PAYMENT GATEWAYS =====
  
  // Get available payment gateways
  getPaymentGateways: (params = {}) => 
    api.get('/api/payment-gateways/', { params }),
    
  // Get payment gateway configuration
  getGatewayConfiguration: (gatewayId) => 
    api.get(`/api/payment-gateways/${gatewayId}/`),
    
  // Update payment gateway configuration
  updateGatewayConfiguration: (gatewayId, configData) => 
    api.patch(`/api/payment-gateways/${gatewayId}/`, configData),
    
  // Test payment gateway connection
  testGatewayConnection: (gatewayId) => 
    api.post(`/api/payment-gateways/${gatewayId}/test-connection/`),
    
  // ===== TIPS & GRATUITY =====
  
  // Add tip to a payment
  addTip: (paymentId, amount, distribution = {}) => 
    api.post(`/api/payments/${paymentId}/add-tip/`, { amount, distribution }),
    
  // Update tip distribution
  updateTipDistribution: (paymentId, distribution) => 
    api.post(`/api/payments/${paymentId}/update-tip-distribution/`, { distribution }),
    
  // Get tip distribution report
  getTipDistributionReport: (startDate, endDate, params = {}) => 
    api.get('/api/reports/tip-distribution/', { 
      params: { start_date: startDate, end_date: endDate, ...params } 
    }),
    
  // ===== PAYMENT REPORTS =====
  
  // Get payment summary report
  getPaymentSummaryReport: (startDate, endDate, params = {}) => 
    api.get('/api/reports/payment-summary/', { 
      params: { start_date: startDate, end_date: endDate, ...params } 
    }),
    
  // Get payment method breakdown
  getPaymentMethodBreakdown: (startDate, endDate, params = {}) => 
    api.get('/api/reports/payment-methods/', { 
      params: { start_date: startDate, end_date: endDate, ...params } 
    }),
    
  // Get daily sales report
  getDailySalesReport: (date, params = {}) => 
    api.get('/api/reports/daily-sales/', { 
      params: { date, ...params } 
    }),
    
  // Export payment data
  exportPayments: (format = 'csv', params = {}) => 
    api.get('/api/payments/export/', { 
      params: { format, ...params },
      responseType: 'blob'
    }),
    
  // ===== PAYMENT SECURITY =====
  
  // Get payment security settings
  getPaymentSecuritySettings: () => 
    api.get('/api/payment-security/settings/'),
    
  // Update payment security settings
  updatePaymentSecuritySettings: (settings) => 
    api.patch('/api/payment-security/settings/', settings),
    
  // Get PCI compliance status
  getPCIComplianceStatus: () => 
    api.get('/api/payment-security/pci-compliance/'),
    
  // Run PCI compliance check
  runPCIComplianceCheck: () => 
    api.post('/api/payment-security/pci-compliance/check/'),
    
  // Get payment security alerts
  getPaymentSecurityAlerts: (params = {}) => 
    api.get('/api/payment-security/alerts/', { params }),
    
  // Acknowledge security alert
  acknowledgeSecurityAlert: (alertId) => 
    api.post(`/api/payment-security/alerts/${alertId}/acknowledge/`),
    
  // ===== PAYMENT INTEGRATIONS =====
  
  // Get available payment integrations
  getPaymentIntegrations: (params = {}) => 
    api.get('/api/payment-integrations/', { params }),
    
  // Get integration details
  getPaymentIntegration: (integrationId) => 
    api.get(`/api/payment-integrations/${integrationId}/`),
    
  // Configure payment integration
  configurePaymentIntegration: (integrationId, config) => 
    api.post(`/api/payment-integrations/${integrationId}/configure/`, config),
    
  // Test payment integration
  testPaymentIntegration: (integrationId) => 
    api.post(`/api/payment-integrations/${integrationId}/test/`),
    
  // Disable payment integration
  disablePaymentIntegration: (integrationId) => 
    api.post(`/api/payment-integrations/${integrationId}/disable/`),
    
  // Enable payment integration
  enablePaymentIntegration: (integrationId) => 
    api.post(`/api/payment-integrations/${integrationId}/enable/`),
};

// Notifications API
export const notificationApi = {
  // ===== NOTIFICATIONS =====
  
  // Get all notifications with optional filtering
  getNotifications: (params = {}) => api.get('/api/notifications/', { params }),
  
  // Get a single notification by ID
  getNotification: (id) => api.get(`/api/notifications/${id}/`),
  
  // Get unread notifications count
  getUnreadCount: () => api.get('/api/notifications/unread/count/'),
  
  // Get unread notifications
  getUnreadNotifications: (params = {}) => 
    api.get('/api/notifications/unread/', { params }),
    
  // Get read notifications
  getReadNotifications: (params = {}) => 
    api.get('/api/notifications/read/', { params }),
    
  // Get notifications by type
  getNotificationsByType: (type, params = {}) => 
    api.get('/api/notifications/', { params: { type, ...params } }),
    
  // Get notifications by priority
  getNotificationsByPriority: (priority, params = {}) => 
    api.get('/api/notifications/', { params: { priority, ...params } }),
    
  // Get notifications by date range
  getNotificationsByDateRange: (startDate, endDate, params = {}) => 
    api.get('/api/notifications/', { 
      params: { start_date: startDate, end_date: endDate, ...params } 
    }),
    
  // Search notifications
  searchNotifications: (query, params = {}) => 
    api.get('/api/notifications/search/', { params: { q: query, ...params } }),
    
  // Mark a notification as read
  markAsRead: (id) => api.patch(`/api/notifications/${id}/mark-as-read/`),
  
  // Mark all notifications as read
  markAllAsRead: () => api.post('/api/notifications/mark-all-as-read/'),
  
  // Mark multiple notifications as read
  markMultipleAsRead: (notificationIds) => 
    api.post('/api/notifications/mark-multiple-as-read/', { ids: notificationIds }),
    
  // Mark a notification as unread
  markAsUnread: (id) => api.patch(`/api/notifications/${id}/mark-as-unread/`),
  
  // Archive a notification
  archive: (id) => api.patch(`/api/notifications/${id}/archive/`),
  
  // Unarchive a notification
  unarchive: (id) => api.patch(`/api/notifications/${id}/unarchive/`),
  
  // Delete a notification
  deleteNotification: (id) => api.delete(`/api/notifications/${id}/`),
  
  // Delete multiple notifications
  deleteMultipleNotifications: (notificationIds) => 
    api.post('/api/notifications/delete-multiple/', { ids: notificationIds }),
    
  // Clear all notifications
  clearAll: () => api.post('/api/notifications/clear-all/'),
  
  // ===== NOTIFICATION PREFERENCES =====
  
  // Get notification preferences
  getPreferences: () => api.get('/api/notifications/preferences/'),
  
  // Update notification preferences
  updatePreferences: (preferences) => 
    api.patch('/api/notifications/preferences/', preferences),
    
  // Get email notification preferences
  getEmailPreferences: () => 
    api.get('/api/notifications/preferences/email/'),
    
  // Update email notification preferences
  updateEmailPreferences: (emailPreferences) => 
    api.patch('/api/notifications/preferences/email/', emailPreferences),
    
  // Get push notification preferences
  getPushPreferences: () => 
    api.get('/api/notifications/preferences/push/'),
    
  // Update push notification preferences
  updatePushPreferences: (pushPreferences) => 
    api.patch('/api/notifications/preferences/push/', pushPreferences),
    
  // Get SMS notification preferences
  getSMSPreferences: () => 
    api.get('/api/notifications/preferences/sms/'),
    
  // Update SMS notification preferences
  updateSMSPreferences: (smsPreferences) => 
    api.patch('/api/notifications/preferences/sms/', smsPreferences),
    
  // ===== NOTIFICATION TEMPLATES =====
  
  // Get all notification templates
  getTemplates: (params = {}) => 
    api.get('/api/notifications/templates/', { params }),
    
  // Get a single notification template
  getTemplate: (id) => 
    api.get(`/api/notifications/templates/${id}/`),
    
  // Create a notification template
  createTemplate: (templateData) => 
    api.post('/api/notifications/templates/', templateData),
    
  // Update a notification template
  updateTemplate: (id, templateData) => 
    api.patch(`/api/notifications/templates/${id}/`, templateData),
    
  // Delete a notification template
  deleteTemplate: (id) => 
    api.delete(`/api/notifications/templates/${id}/`),
    
  // Get template by type and channel
  getTemplateByType: (type, channel) => 
    api.get('/api/notifications/templates/by-type/', { 
      params: { type, channel } 
    }),
    
  // ===== NOTIFICATION SUBSCRIPTIONS =====
  
  // Get all notification subscriptions
  getSubscriptions: (params = {}) => 
    api.get('/api/notifications/subscriptions/', { params }),
    
  // Get a single subscription
  getSubscription: (id) => 
    api.get(`/api/notifications/subscriptions/${id}/`),
    
  // Create a subscription
  createSubscription: (subscriptionData) => 
    api.post('/api/notifications/subscriptions/', subscriptionData),
    
  // Update a subscription
  updateSubscription: (id, subscriptionData) => 
    api.patch(`/api/notifications/subscriptions/${id}/`, subscriptionData),
    
  // Delete a subscription
  deleteSubscription: (id) => 
    api.delete(`/api/notifications/subscriptions/${id}/`),
    
  // Get user's subscriptions
  getUserSubscriptions: (userId, params = {}) => 
    api.get(`/api/users/${userId}/notification-subscriptions/`, { params }),
    
  // Subscribe to a notification type
  subscribeToType: (notificationType, channel = 'email') => 
    api.post('/api/notifications/subscribe/', { type: notificationType, channel }),
    
  // Unsubscribe from a notification type
  unsubscribeFromType: (notificationType, channel = 'email') => 
    api.post('/api/notifications/unsubscribe/', { type: notificationType, channel }),
    
  // ===== NOTIFICATION DELIVERY =====
  
  // Get notification delivery status
  getDeliveryStatus: (notificationId) => 
    api.get(`/api/notifications/${notificationId}/delivery-status/`),
    
  // Retry failed notification delivery
  retryDelivery: (notificationId) => 
    api.post(`/api/notifications/${notificationId}/retry-delivery/`),
    
  // Get delivery statistics
  getDeliveryStats: (params = {}) => 
    api.get('/api/notifications/delivery-stats/', { params }),
    
  // ===== NOTIFICATION LOGS =====
  
  // Get notification logs
  getLogs: (params = {}) => 
    api.get('/api/notifications/logs/', { params }),
    
  // Get a single log entry
  getLog: (logId) => 
    api.get(`/api/notifications/logs/${logId}/`),
    
  // Get error logs
  getErrorLogs: (params = {}) => 
    api.get('/api/notifications/logs/errors/', { params }),
    
  // Clear old logs
  clearOldLogs: (days = 30) => 
    api.post('/api/notifications/logs/clear-old/', { days }),
    
  // ===== NOTIFICATION TESTING =====
  
  // Send a test notification
  sendTestNotification: (type, channel, recipient, templateData = {}) => 
    api.post('/api/notifications/test/send/', {
      type,
      channel,
      recipient,
      template_data: templateData
    }),
    
  // Preview notification template
  previewTemplate: (templateId, templateData = {}) => 
    api.post(`/api/notifications/templates/${templateId}/preview/`, 
      { template_data: templateData }
    ),
    
  // ===== NOTIFICATION SETTINGS =====
  
  // Get notification settings
  getSettings: () => 
    api.get('/api/notifications/settings/'),
    
  // Update notification settings
  updateSettings: (settings) => 
    api.patch('/api/notifications/settings/', settings),
    
  // Test notification configuration
  testConfiguration: (channel) => 
    api.post('/api/notifications/test-configuration/', { channel }),
    
  // ===== REAL-TIME NOTIFICATIONS =====
  
  // Get WebSocket connection URL
  getWebSocketUrl: () => 
    api.get('/api/notifications/websocket/url/'),
    
  // Get unread count for real-time updates
  getRealtimeUnreadCount: () => 
    api.get('/api/notifications/realtime/unread-count/'),
    
  // Subscribe to real-time updates
  subscribeToRealtime: (channels = []) => 
    api.post('/api/notifications/realtime/subscribe/', { channels }),
    
  // Unsubscribe from real-time updates
  unsubscribeFromRealtime: (subscriptionId) => 
    api.post('/api/notifications/realtime/unsubscribe/', { subscription_id: subscriptionId }),
    
  // Get active real-time subscriptions
  getRealtimeSubscriptions: () => 
    api.get('/api/notifications/realtime/subscriptions/'),
};

// Reports API
export const reportApi = {
  // ===== SALES REPORTS =====
  
  // Get sales report with filtering options
  getSalesReport: (params = {}) =>
    api.get('/api/reports/sales/', { 
      params,
      responseType: params.export ? 'blob' : 'json' 
    }),
    
  // Get sales summary report
  getSalesSummary: (startDate, endDate, groupBy = 'day', params = {}) => 
    api.get('/api/reports/sales/summary/', { 
      params: { start_date: startDate, end_date: endDate, group_by: groupBy, ...params } 
    }),
    
  // Get sales by category
  getSalesByCategory: (startDate, endDate, params = {}) =>
    api.get('/api/reports/sales/by-category/', {
      params: { start_date: startDate, end_date: endDate, ...params }
    }),
    
  // Get sales by menu item
  getSalesByMenuItem: (startDate, endDate, params = {}) =>
    api.get('/api/reports/sales/by-menu-item/', {
      params: { start_date: startDate, end_date: endDate, ...params }
    }),
    
  // Get sales by hour of day
  getSalesByHour: (startDate, endDate, params = {}) =>
    api.get('/api/reports/sales/by-hour/', {
      params: { start_date: startDate, end_date: endDate, ...params }
    }),
    
  // Get sales by day of week
  getSalesByDay: (startDate, endDate, params = {}) =>
    api.get('/api/reports/sales/by-day/', {
      params: { start_date: startDate, end_date: endDate, ...params }
    }),
    
  // Get sales by server
  getSalesByServer: (startDate, endDate, params = {}) =>
    api.get('/api/reports/sales/by-server/', {
      params: { start_date: startDate, end_date: endDate, ...params }
    }),
    
  // Get sales by payment method
  getSalesByPaymentMethod: (startDate, endDate, params = {}) =>
    api.get('/api/reports/sales/by-payment-method/', {
      params: { start_date: startDate, end_date: endDate, ...params }
    }),
    
  // Get sales comparison report
  getSalesComparison: (period1, period2, compareBy = 'day', params = {}) =>
    api.get('/api/reports/sales/comparison/', {
      params: { 
        period1_start: period1.start, 
        period1_end: period1.end,
        period2_start: period2.start,
        period2_end: period2.end,
        compare_by: compareBy,
        ...params 
      }
    }),
    
  // Get sales trends
  getSalesTrends: (startDate, endDate, trendBy = 'day', params = {}) =>
    api.get('/api/reports/sales/trends/', {
      params: { start_date: startDate, end_date: endDate, trend_by: trendBy, ...params }
    }),
    
  // Get sales forecast
  getSalesForecast: (periods = 7, params = {}) =>
    api.get('/api/reports/sales/forecast/', {
      params: { periods, ...params }
    }),
    
  // ===== INVENTORY REPORTS =====
  
  // Get inventory valuation report
  getInventoryValuation: (asOfDate = null, params = {}) =>
    api.get('/api/reports/inventory/valuation/', {
      params: asOfDate ? { as_of_date: asOfDate, ...params } : params
    }),
    
  // Get inventory movement report
  getInventoryMovement: (startDate, endDate, itemId = null, params = {}) =>
    api.get('/api/reports/inventory/movement/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        item_id: itemId,
        ...params 
      }
    }),
    
  // Get low stock report
  getLowStockReport: (threshold = null, params = {}) =>
    api.get('/api/reports/inventory/low-stock/', {
      params: threshold ? { threshold, ...params } : params
    }),
    
  // Get stock adjustment report
  getStockAdjustments: (startDate, endDate, params = {}) =>
    api.get('/api/reports/inventory/adjustments/', {
      params: { start_date: startDate, end_date: endDate, ...params }
    }),
    
  // Get inventory turnover report
  getInventoryTurnover: (startDate, endDate, groupBy = 'item', params = {}) =>
    api.get('/api/reports/inventory/turnover/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        group_by: groupBy,
        ...params 
      }
    }),
    
  // Get inventory aging report
  getInventoryAging: (asOfDate = null, params = {}) =>
    api.get('/api/reports/inventory/aging/', {
      params: asOfDate ? { as_of_date: asOfDate, ...params } : params
    }),
    
  // Get inventory forecast
  getInventoryForecast: (periods = 30, confidence = 0.95, params = {}) =>
    api.get('/api/reports/inventory/forecast/', {
      params: { periods, confidence, ...params }
    }),
    
  // Get inventory valuation by location
  getInventoryByLocation: (asOfDate = null, params = {}) =>
    api.get('/api/reports/inventory/by-location/', {
      params: asOfDate ? { as_of_date: asOfDate, ...params } : params
    }),
    
  // Get inventory variance report
  getInventoryVariance: (startDate, endDate, params = {}) =>
    api.get('/api/reports/inventory/variance/', {
      params: { start_date: startDate, end_date: endDate, ...params }
    }),
    
  // Export inventory report
  exportInventoryReport: (format = 'csv', params = {}) =>
    api.get('/api/reports/inventory/export/', {
      params: { format, ...params },
      responseType: 'blob'
    }),
    
  // ===== STAFF PERFORMANCE REPORTS =====
  
  // Get staff performance summary
  getStaffPerformance: (startDate, endDate, params = {}) =>
    api.get('/api/reports/staff/performance/', {
      params: { start_date: startDate, end_date: endDate, ...params }
    }),
    
  // Get server sales performance
  getServerSalesPerformance: (startDate, endDate, groupBy = 'day', params = {}) =>
    api.get('/api/reports/staff/server-sales/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        group_by: groupBy,
        ...params 
      }
    }),
    
  // Get staff attendance report
  getStaffAttendance: (startDate, endDate, params = {}) =>
    api.get('/api/reports/staff/attendance/', {
      params: { start_date: startDate, end_date: endDate, ...params }
    }),
    
  // Get staff sales by category
  getStaffSalesByCategory: (startDate, endDate, staffId = null, params = {}) =>
    api.get('/api/reports/staff/sales-by-category/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        staff_id: staffId,
        ...params 
      }
    }),
    
  // Get staff tip report
  getStaffTips: (startDate, endDate, groupBy = 'day', params = {}) =>
    api.get('/api/reports/staff/tips/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        group_by: groupBy,
        ...params 
      }
    }),
    
  // Get staff productivity metrics
  getStaffProductivity: (startDate, endDate, metrics = [], params = {}) =>
    api.get('/api/reports/staff/productivity/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        metrics: metrics.join(','),
        ...params 
      }
    }),
    
  // Export staff performance report
  exportStaffPerformance: (format = 'csv', params = {}) =>
    api.get('/api/reports/staff/export/', {
      params: { format, ...params },
      responseType: 'blob'
    }),
    
  // ===== POPULAR ITEMS REPORTS =====
  
  // Get popular items report
  getPopularItems: (startDate, endDate, limit = 10, params = {}) =>
    api.get('/api/reports/items/popular/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        limit,
        ...params 
      }
    }),
    
  // Get least popular items
  getLeastPopularItems: (startDate, endDate, limit = 10, params = {}) =>
    api.get('/api/reports/items/least-popular/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        limit,
        ...params 
      }
    }),
    
  // Get items by profitability
  getItemsByProfitability: (startDate, endDate, limit = 10, params = {}) =>
    api.get('/api/reports/items/by-profitability/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        limit,
        ...params 
      }
    }),
    
  // Get item sales trends
  getItemSalesTrends: (itemId, startDate, endDate, trendBy = 'day', params = {}) =>
    api.get(`/api/reports/items/${itemId}/trends/`, {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        trend_by: trendBy,
        ...params 
      }
    }),
    
  // Get item sales comparison
  compareItems: (itemIds, startDate, endDate, params = {}) =>
    api.get('/api/reports/items/compare/', {
      params: { 
        item_ids: itemIds.join(','),
        start_date: startDate, 
        end_date: endDate, 
        ...params 
      }
    }),
    
  // Get item category performance
  getCategoryPerformance: (startDate, endDate, params = {}) =>
    api.get('/api/reports/items/category-performance/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        ...params 
      }
    }),
    
  // Get menu item profitability
  getMenuItemProfitability: (startDate, endDate, params = {}) =>
    api.get('/api/reports/items/menu-profitability/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        ...params 
      }
    }),
    
  // Get item waste report
  getItemWaste: (startDate, endDate, params = {}) =>
    api.get('/api/reports/items/waste/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        ...params 
      }
    }),
    
  // Export popular items report
  exportPopularItems: (format = 'csv', params = {}) =>
    api.get('/api/reports/items/export-popular/', {
      params: { format, ...params },
      responseType: 'blob'
    }),
    
  // ===== FINANCIAL REPORTS =====
  
  // Get financial summary
  getFinancialSummary: (startDate, endDate, params = {}) =>
    api.get('/api/reports/financial/summary/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        ...params 
      }
    }),
    
  // Get profit and loss statement
  getProfitAndLoss: (startDate, endDate, compareToPrevious = false, params = {}) =>
    api.get('/api/reports/financial/profit-and-loss/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        compare_to_previous: compareToPrevious,
        ...params 
      }
    }),
    
  // Get balance sheet
  getBalanceSheet: (asOfDate = null, params = {}) =>
    api.get('/api/reports/financial/balance-sheet/', {
      params: asOfDate ? { as_of_date: asOfDate, ...params } : params
    }),
    
  // Get cash flow statement
  getCashFlow: (startDate, endDate, params = {}) =>
    api.get('/api/reports/financial/cash-flow/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        ...params 
      }
    }),
    
  // Get expense report
  getExpenseReport: (startDate, endDate, groupBy = 'category', params = {}) =>
    api.get('/api/reports/financial/expenses/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        group_by: groupBy,
        ...params 
      }
    }),
    
  // Get revenue report
  getRevenueReport: (startDate, endDate, groupBy = 'category', params = {}) =>
    api.get('/api/reports/financial/revenue/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        group_by: groupBy,
        ...params 
      }
    }),
    
  // Get tax report
  getTaxReport: (startDate, endDate, params = {}) =>
    api.get('/api/reports/financial/tax/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        ...params 
      }
    }),
    
  // Get financial ratios
  getFinancialRatios: (asOfDate = null, params = {}) =>
    api.get('/api/reports/financial/ratios/', {
      params: asOfDate ? { as_of_date: asOfDate, ...params } : params
    }),
    
  // Get financial forecast
  getFinancialForecast: (periods = 12, params = {}) =>
    api.get('/api/reports/financial/forecast/', {
      params: { periods, ...params }
    }),
    
  // Export financial report
  exportFinancialReport: (reportType, format = 'pdf', params = {}) =>
    api.get(`/api/reports/financial/export/${reportType}/`, {
      params: { format, ...params },
      responseType: 'blob'
    }),
    
  // ===== CUSTOMER REPORTS =====
  
  // Get customer spending report
  getCustomerSpending: (startDate, endDate, limit = 100, params = {}) =>
    api.get('/api/reports/customers/spending/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        limit,
        ...params 
      }
    }),
    
  // Get customer retention report
  getCustomerRetention: (startDate, endDate, params = {}) =>
    api.get('/api/reports/customers/retention/', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        ...params 
      }
    }),
    
  // Get customer demographics
  getCustomerDemographics: (params = {}) =>
    api.get('/api/reports/customers/demographics/', { params }),
    
  // Get customer lifetime value
  getCustomerLifetimeValue: (params = {}) =>
    api.get('/api/reports/customers/lifetime-value/', { params }),
    
  // Get customer segmentation
  getCustomerSegmentation: (params = {}) =>
    api.get('/api/reports/customers/segmentation/', { params }),
    
  // Export customer report
  exportCustomerReport: (reportType, format = 'csv', params = {}) =>
    api.get(`/api/reports/customers/export/${reportType}/`, {
      params: { format, ...params },
      responseType: 'blob'
    }),
    
  // ===== REPORT EXPORT & MANAGEMENT =====
  
  // Generate report
  generateReport: (reportType, params = {}) =>
    api.post('/api/reports/generate/', { report_type: reportType, params }),
    
  // Get report status
  getReportStatus: (reportId) =>
    api.get(`/api/reports/${reportId}/status/`),
    
  // Download generated report
  downloadReport: (reportId) =>
    api.get(`/api/reports/${reportId}/download/`, { responseType: 'blob' }),
    
  // List available reports
  listAvailableReports: (params = {}) =>
    api.get('/api/reports/available/', { params }),
    
  // Get report parameters
  getReportParameters: (reportType) =>
    api.get(`/api/reports/parameters/${reportType}/`),
    
  // Schedule report
  scheduleReport: (reportType, schedule, params = {}) =>
    api.post('/api/reports/schedule/', { 
      report_type: reportType, 
      schedule,
      params 
    }),
    
  // List scheduled reports
  listScheduledReports: (params = {}) =>
    api.get('/api/reports/scheduled/', { params }),
    
  // Update scheduled report
  updateScheduledReport: (scheduleId, updates) =>
    api.patch(`/api/reports/scheduled/${scheduleId}/`, updates),
    
  // Delete scheduled report
  deleteScheduledReport: (scheduleId) =>
    api.delete(`/api/reports/scheduled/${scheduleId}/`),
    
  // Get report history
  getReportHistory: (params = {}) =>
    api.get('/api/reports/history/', { params }),
    
  // Get report favorites
  getReportFavorites: () =>
    api.get('/api/reports/favorites/'),
    
  // Add report to favorites
  addReportToFavorites: (reportType, name, params = {}) =>
    api.post('/api/reports/favorites/', { 
      report_type: reportType, 
      name, 
      params 
    }),
    
  // Remove report from favorites
  removeReportFromFavorites: (favoriteId) =>
    api.delete(`/api/reports/favorites/${favoriteId}/`),
    
  // Get report templates
  getReportTemplates: (params = {}) =>
    api.get('/api/reports/templates/', { params }),
    
  // Save report as template
  saveReportTemplate: (name, reportType, params = {}) =>
    api.post('/api/reports/templates/', {
      name,
      report_type: reportType,
      parameters: params
    }),
    
  // Delete report template
  deleteReportTemplate: (templateId) =>
    api.delete(`/api/reports/templates/${templateId}/`),
    
  // Export report data
  exportReportData: (reportType, format = 'csv', params = {}) =>
    api.get(`/api/reports/export/${reportType}/`, {
      params: { format, ...params },
      responseType: 'blob'
    }),
};

// Settings API
export const settingsApi = {
  // ===== GENERAL SETTINGS =====
  
  // Get all settings
  getSettings: (params = {}) => api.get('/api/settings/', { params }),
  
  // Update multiple settings
  updateSettings: (settings) => api.patch('/api/settings/', settings),
  
  // Get a specific setting
  getSetting: (key) => api.get(`/api/settings/${key}/`),
  
  // Update a specific setting
  updateSetting: (key, value) => api.patch(`/api/settings/${key}/`, { value }),
  
  // Reset settings to defaults
  resetToDefaults: () => api.post('/api/settings/reset/'),
  
  // Import settings
  importSettings: (settings) => api.post('/api/settings/import/', settings),
  
  // Export settings
  exportSettings: (format = 'json') =>
    api.get('/api/settings/export/', { 
      params: { format },
      responseType: 'blob'
    }),
    
  // Get settings schema
  getSettingsSchema: () => api.get('/api/settings/schema/'),
  
  // ===== BUSINESS HOURS =====
  
  // Get business hours
  getBusinessHours: () => api.get('/api/settings/business-hours/'),
  
  // Update business hours
  updateBusinessHours: (hours) => api.patch('/api/settings/business-hours/', { hours }),
  
  // Get special hours
  getSpecialHours: (startDate = null, endDate = null) =>
    api.get('/api/settings/special-hours/', {
      params: { start_date: startDate, end_date: endDate }
    }),
    
  // Set special hours for a date range
  setSpecialHours: (startDate, endDate, hours, name = 'Special Hours') =>
    api.post('/api/settings/special-hours/', {
      start_date: startDate,
      end_date: endDate,
      name,
      hours
    }),
    
  // Delete special hours
  deleteSpecialHours: (specialHoursId) =>
    api.delete(`/api/settings/special-hours/${specialHoursId}/`),
    
  // ===== TAX SETTINGS =====
  
  // Get all tax rates
  getTaxRates: (params = {}) => api.get('/api/settings/tax-rates/', { params }),
  
  // Create a tax rate
  createTaxRate: (taxRateData) => api.post('/api/settings/tax-rates/', taxRateData),
  
  // Get a specific tax rate
  getTaxRate: (taxRateId) => api.get(`/api/settings/tax-rates/${taxRateId}/`),
  
  // Update a tax rate
  updateTaxRate: (taxRateId, taxRateData) =>
    api.patch(`/api/settings/tax-rates/${taxRateId}/`, taxRateData),
    
  // Delete a tax rate
  deleteTaxRate: (taxRateId) => api.delete(`/api/settings/tax-rates/${taxRateId}/`),
  
  // Get tax categories
  getTaxCategories: () => api.get('/api/settings/tax-categories/'),
  
  // Get tax settings
  getTaxSettings: () => api.get('/api/settings/tax-settings/'),
  
  // Update tax settings
  updateTaxSettings: (settings) => api.patch('/api/settings/tax-settings/', settings),
  
  // ===== LOCATION SETTINGS =====
  
  // Get location settings
  getLocationSettings: () => api.get('/api/settings/location/'),
  
  // Update location settings
  updateLocationSettings: (locationData) =>
    api.patch('/api/settings/location/', locationData),
    
  // Get timezone list
  getTimezones: () => api.get('/api/settings/timezones/'),
  
  // Get country list
  getCountries: () => api.get('/api/settings/countries/'),
  
  // Get regions for a country
  getRegions: (countryCode) =>
    api.get(`/api/settings/countries/${countryCode}/regions/`),
    
  // ===== LOCALIZATION =====
  
  // Get localization settings
  getLocalizationSettings: () => api.get('/api/settings/localization/'),
  
  // Update localization settings
  updateLocalizationSettings: (settings) =>
    api.patch('/api/settings/localization/', settings),
    
  // Get available languages
  getAvailableLanguages: () => api.get('/api/settings/languages/'),
  
  // Get date formats
  getDateFormats: () => api.get('/api/settings/date-formats/'),
  
  // Get time formats
  getTimeFormats: () => api.get('/api/settings/time-formats/'),
  
  // Get number formats
  getNumberFormats: () => api.get('/api/settings/number-formats/'),
  
  // Get currency list
  getCurrencies: () => api.get('/api/settings/currencies/'),
  
  // Get currency format
  getCurrencyFormat: (currencyCode) =>
    api.get(`/api/settings/currencies/${currencyCode}/format/`),
    
  // ===== NOTIFICATION SETTINGS =====
  
  // Get notification settings
  getNotificationSettings: () => api.get('/api/settings/notifications/'),
  
  // Update notification settings
  updateNotificationSettings: (settings) =>
    api.patch('/api/settings/notifications/', settings),
    
  // Test notification
  testNotification: (type, recipient) =>
    api.post('/api/settings/notifications/test/', { type, recipient }),
    
  // Get notification templates
  getNotificationTemplates: (params = {}) =>
    api.get('/api/settings/notification-templates/', { params }),
    
  // Get a notification template
  getNotificationTemplate: (templateId) =>
    api.get(`/api/settings/notification-templates/${templateId}/`),
    
  // Update a notification template
  updateNotificationTemplate: (templateId, templateData) =>
    api.patch(`/api/settings/notification-templates/${templateId}/`, templateData),
    
  // Reset a notification template to default
  resetNotificationTemplate: (templateId) =>
    api.post(`/api/settings/notification-templates/${templateId}/reset/`),
    
  // ===== INTEGRATION SETTINGS =====
  
  // Get integration settings
  getIntegrationSettings: (integrationId) =>
    api.get(`/api/settings/integrations/${integrationId}/`),
    
  // Update integration settings
  updateIntegrationSettings: (integrationId, settings) =>
    api.patch(`/api/settings/integrations/${integrationId}/`, settings),
    
  // Test integration connection
  testIntegrationConnection: (integrationId) =>
    api.post(`/api/settings/integrations/${integrationId}/test/`),
    
  // Get available integrations
  getAvailableIntegrations: (params = {}) =>
    api.get('/api/settings/integrations/available/', { params }),
    
  // Get installed integrations
  getInstalledIntegrations: (params = {}) =>
    api.get('/api/settings/integrations/installed/', { params }),
    
  // Install an integration
  installIntegration: (integrationId, settings = {}) =>
    api.post(`/api/settings/integrations/${integrationId}/install/`, settings),
    
  // Uninstall an integration
  uninstallIntegration: (integrationId) =>
    api.post(`/api/settings/integrations/${integrationId}/uninstall/`),
    
  // Get integration logs
  getIntegrationLogs: (integrationId, params = {}) =>
    api.get(`/api/settings/integrations/${integrationId}/logs/`, { params }),
    
  // ===== SECURITY SETTINGS =====
  
  // Get security settings
  getSecuritySettings: () => api.get('/api/settings/security/'),
  
  // Update security settings
  updateSecuritySettings: (settings) =>
    api.patch('/api/settings/security/', settings),
    
  // Get password policy
  getPasswordPolicy: () => api.get('/api/settings/security/password-policy/'),
  
  // Update password policy
  updatePasswordPolicy: (policy) =>
    api.patch('/api/settings/security/password-policy/', policy),
    
  // Get session settings
  getSessionSettings: () => api.get('/api/settings/security/sessions/'),
  
  // Update session settings
  updateSessionSettings: (settings) =>
    api.patch('/api/settings/security/sessions/', settings),
    
  // Get API keys
  getApiKeys: (params = {}) =>
    api.get('/api/settings/security/api-keys/', { params }),
    
  // Create an API key
  createApiKey: (name, permissions, expiresAt = null) =>
    api.post('/api/settings/security/api-keys/', {
      name,
      permissions,
      expires_at: expiresAt
    }),
    
  // Revoke an API key
  revokeApiKey: (keyId) =>
    api.delete(`/api/settings/security/api-keys/${keyId}/`),
    
  // Get audit logs
  getAuditLogs: (params = {}) =>
    api.get('/api/settings/security/audit-logs/', { params }),
    
  // ===== BACKUP & RESTORE =====
  
  // Create a backup
  createBackup: (options = {}) =>
    api.post('/api/settings/backup/', options, { responseType: 'blob' }),
    
  // Restore from backup
  restoreBackup: (backupFile, options = {}) => {
    const formData = new FormData();
    formData.append('file', backupFile);
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return api.post('/api/settings/restore/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Get backup settings
  getBackupSettings: () => api.get('/api/settings/backup/settings/'),
  
  // Update backup settings
  updateBackupSettings: (settings) =>
    api.patch('/api/settings/backup/settings/', settings),
    
  // Get backup history
  getBackupHistory: (params = {}) =>
    api.get('/api/settings/backup/history/', { params }),
    
  // Delete a backup
  deleteBackup: (backupId) =>
    api.delete(`/api/settings/backup/history/${backupId}/`),
    
  // ===== SYSTEM INFO =====
  
  // Get system information
  getSystemInfo: () => api.get('/api/settings/system/info/'),
  
  // Get system health
  getSystemHealth: () => api.get('/api/settings/system/health/'),
  
  // Get system logs
  getSystemLogs: (params = {}) =>
    api.get('/api/settings/system/logs/', { params }),
    
  // Clear system logs
  clearSystemLogs: () => api.post('/api/settings/system/logs/clear/'),
  
  // Get server status
  getServerStatus: () => api.get('/api/settings/system/status/'),
  
  // Get server metrics
  getServerMetrics: (params = {}) =>
    api.get('/api/settings/system/metrics/', { params }),
    
  // ===== MAINTENANCE =====
  
  // Clear cache
  clearCache: () => api.post('/api/settings/maintenance/clear-cache/'),
  
  // Run database migrations
  runMigrations: () => api.post('/api/settings/maintenance/run-migrations/'),
  
  // Optimize database
  optimizeDatabase: () => api.post('/api/settings/maintenance/optimize-database/'),
  
  // Get maintenance tasks
  getMaintenanceTasks: () => api.get('/api/settings/maintenance/tasks/'),
  
  // Run a maintenance task
  runMaintenanceTask: (taskId, params = {}) =>
    api.post(`/api/settings/maintenance/tasks/${taskId}/run/`, params),
    
  // Get scheduled tasks
  getScheduledTasks: () => api.get('/api/settings/maintenance/scheduled-tasks/'),
  
  // Run a scheduled task now
  runScheduledTask: (taskId) =>
    api.post(`/api/settings/maintenance/scheduled-tasks/${taskId}/run/`),
    
  // ===== LICENSE & UPDATES =====
  
  // Get license information
  getLicenseInfo: () => api.get('/api/settings/license/'),
  
  // Update license key
  updateLicense: (licenseKey) =>
    api.patch('/api/settings/license/', { key: licenseKey }),
    
  // Check for updates
  checkForUpdates: () => api.get('/api/settings/updates/check/'),
  
  // Get available updates
  getAvailableUpdates: () => api.get('/api/settings/updates/available/'),
  
  // Install updates
  installUpdates: (updates = []) =>
    api.post('/api/settings/updates/install/', { updates }),
    
  // Get update settings
  getUpdateSettings: () => api.get('/api/settings/updates/settings/'),
  
  // Update update settings
  updateUpdateSettings: (settings) =>
    api.patch('/api/settings/updates/settings/', settings),
    
  // Get delivery zones
  getDeliveryZones: () => api.get('/api/settings/delivery-zones/'),
  
  // Update delivery zones
  updateDeliveryZones: (data) => api.patch('/api/settings/delivery-zones/', data)
};

// User Management API

// Order Management API
export const orderApi = {
  // ===== ORDER MANAGEMENT =====
  
  // Create a new order
  createOrder(orderData) {
    return api.post('/api/orders/', orderData);
  },
  
  // Get all orders with optional filtering
  getOrders(params = {}) {
    return api.get('/api/orders/', { params });
  },
  
  // Get a specific order by ID
  getOrder(orderId) {
    return api.get(`/api/orders/${orderId}/`);
  },
  
  // Update an order
  updateOrder(orderId, orderData) {
    return api.patch(`/api/orders/${orderId}/`, orderData);
  },
    
  // Delete an order
  deleteOrder(orderId) {
    return api.delete(`/api/orders/${orderId}/`);
  },
    
  // ===== ORDER ITEMS =====
  
  // Add item to order
  addOrderItem(orderId, itemData) {
    return api.post(`/api/orders/${orderId}/items/`, itemData);
  },
    
  // Update order item
  updateOrderItem(orderId, itemId, itemData) {
    return api.patch(`/api/orders/${orderId}/items/${itemId}/`, itemData);
  },
    
  // Remove item from order
  removeOrderItem(orderId, itemId) {
    return api.delete(`/api/orders/${orderId}/items/${itemId}/`);
  },
    
  // ===== ORDER STATUS =====
  
  // Update order status
  updateOrderStatus(orderId, status, notes = '') {
    return api.post(`/api/orders/${orderId}/status/`, { status, notes });
  },
    
  // Get order status history
  getOrderStatusHistory(orderId) {
    return api.get(`/api/orders/${orderId}/status/history/`);
  },
    
  // ===== ORDER PAYMENTS =====
  
  // Process payment for order
  processPayment(orderId, paymentData) {
    return api.post(`/api/orders/${orderId}/payments/`, paymentData);
  },
    
  // Get order payments
  getOrderPayments(orderId) {
    return api.get(`/api/orders/${orderId}/payments/`);
  },
    
  // Refund payment
  refundPayment(orderId, paymentId, amount = null, reason = '') {
    return api.post(`/api/orders/${orderId}/payments/${paymentId}/refund/`, { 
      amount, 
      reason 
    });
  },
    
  // ===== ORDER DISCOUNTS =====
  
  // Apply discount to order
  applyDiscount(orderId, discountData) {
    return api.post(`/api/orders/${orderId}/discounts/`, discountData);
  },
    
  // Remove discount from order
  removeDiscount(orderId, discountId) {
    return api.delete(`/api/orders/${orderId}/discounts/${discountId}/`);
  },
    
  // ===== ORDER TAXES =====
  
  // Calculate taxes for order
  calculateTaxes(orderId) {
    return api.get(`/api/orders/${orderId}/taxes/calculate/`);
  },
    
  // Override taxes for order
  overrideTaxes(orderId, taxes) {
    return api.post(`/api/orders/${orderId}/taxes/override/`, { taxes });
  },
    
  // ===== ORDER FULFILLMENT =====
  
  // Mark order as ready for pickup/delivery
  markOrderReady(orderId, readyTime = null) {
    return api.post(`/api/orders/${orderId}/fulfillment/ready/`, { ready_time: readyTime });
  },
    
  // Mark order as completed
  completeOrder(orderId) {
    return api.post(`/api/orders/${orderId}/fulfillment/complete/`);
  },
    
  // Cancel order
  cancelOrder(orderId, reason = '') {
    return api.post(`/api/orders/${orderId}/fulfillment/cancel/`, { reason });
  },
    
  // ===== ORDER NOTES =====
  
  // Add note to order
  addOrderNote(orderId, note, isInternal = false) {
    return api.post(`/api/orders/${orderId}/notes/`, { note, is_internal: isInternal });
  },
    
  // Get order notes
  getOrderNotes(orderId, isInternal = null) {
    const params = {};
    if (isInternal !== null) params.is_internal = isInternal;
    return api.get(`/api/orders/${orderId}/notes/`, { params });
  },
  
  // Delete order note
  deleteOrderNote(orderId, noteId) {
    return api.delete(`/api/orders/${orderId}/notes/${noteId}/`);
  },
  
  // ===== ORDER ATTACHMENTS =====
  
  // Upload attachment to order
  uploadOrderAttachment(orderId, file, description = '') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    return api.post(`/api/orders/${orderId}/attachments/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Get order attachments
  getOrderAttachments(orderId) {
    return api.get(`/api/orders/${orderId}/attachments/`);
  },
    
  // Delete order attachment
  deleteOrderAttachment(orderId, attachmentId) {
    return api.delete(`/api/orders/${orderId}/attachments/${attachmentId}/`);
  },
    
  // ===== ORDER TIMELINE =====
  
  // Get order timeline
  getOrderTimeline(orderId) {
    return api.get(`/api/orders/${orderId}/timeline/`);
  },
    
  // Add custom timeline event
  addTimelineEvent(orderId, eventType, data = {}) {
    return api.post(`/api/orders/${orderId}/timeline/`, { event_type: eventType, data });
  },
    
  // ===== ORDER REPORTING =====
  
  // Get order statistics
  getOrderStats(params = {}) {
    return api.get('/api/orders/stats/', { params });
  },
    
  // Get sales report
  getSalesReport(params = {}) {
    return api.get('/api/orders/reports/sales/', { params });
  },
    
  // Export orders to CSV
  exportOrders(params = {}) {
    return api.get('/api/orders/export/', { 
      params, 
      responseType: 'blob' 
    });
  },
    
  // ===== BULK OPERATIONS =====
  
  // Bulk update orders
  bulkUpdateOrders(orderIds, updateData) {
    return api.patch('/api/orders/bulk/', { ids: orderIds, ...updateData });
  },
    
  // Bulk delete orders
  bulkDeleteOrders(orderIds) {
    return api.delete('/api/orders/bulk/', { data: { ids: orderIds } });
  },
    
  // Bulk print orders
  bulkPrintOrders(orderIds, template = 'default') {
    return api.post('/api/orders/bulk/print/', { 
      ids: orderIds, 
      template 
    }, { responseType: 'blob' });
  }
};



// User Management API
export const userApi = {
  // ===== AUTHENTICATION =====
  
  // Login user
  login: (credentials) => api.post('/api/auth/login/', credentials),
  
  // Logout user
  logout: () => api.post('/api/auth/logout/'),
  
  // Refresh access token
  refreshToken: (refreshToken) => 
    api.post('/api/auth/token/refresh/', { refresh: refreshToken }),
  
  // Verify token
  verifyToken: (token) => 
    api.post('/api/auth/token/verify/', { token }),
  
  // Request password reset
  requestPasswordReset: (email) =>
    api.post('/api/auth/password/reset/', { email }),
    
  // Confirm password reset
  confirmPasswordReset: (uid, token, newPassword) =>
    api.post('/api/auth/password/reset/confirm/', {
      uid,
      token,
      new_password: newPassword
    }),
    
  // Change password (authenticated user)
  changePassword: (currentPassword, newPassword) =>
    api.post('/api/auth/password/change/', {
      current_password: currentPassword,
      new_password: newPassword
    }),
    
  // ===== USER PROFILE =====
  
  // Get current user profile
  getCurrentUser: () => api.get('/api/users/me/'),
  
  // Update current user profile
  updateCurrentUser: (userData) =>
    api.patch('/api/users/me/', userData),
    
  // Update current user password
  updateCurrentUserPassword: (currentPassword, newPassword) =>
    api.post('/api/users/me/password/', {
      current_password: currentPassword,
      new_password: newPassword
    }),
    
  // Upload profile picture
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('profile_picture', file);
    return api.patch('/api/users/me/picture/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Delete profile picture
  deleteProfilePicture: () => 
    api.delete('/api/users/me/picture/'),
    
  // ===== USER MANAGEMENT =====
  
  // Get all users
  getUsers: (params = {}) => 
    api.get('/api/users/', { params }),
    
  // Create a new user
  createUser: (userData) => 
    api.post('/api/users/', userData),
    
  // Get a specific user
  getUser: (userId) => 
    api.get(`/api/users/${userId}/`),
    
  // Update a user
  updateUser: (userId, userData) =>
    api.patch(`/api/users/${userId}/`, userData),
    
  // Delete a user
  deleteUser: (userId) =>
    api.delete(`/api/users/${userId}/`),
    
  // Get user activity logs
  getUserActivityLogs: (userId, params = {}) =>
    api.get(`/api/users/${userId}/activity/`, { params }),
    
  // ===== ROLES & PERMISSIONS =====
  
  // Get all roles
  getRoles: (params = {}) =>
    api.get('/api/roles/', { params }),
    
  // Create a role
  createRole: (roleData) =>
    api.post('/api/roles/', roleData),
    
  // Get a specific role
  getRole: (roleId) =>
    api.get(`/api/roles/${roleId}/`),
    
  // Update a role
  updateRole: (roleId, roleData) =>
    api.patch(`/api/roles/${roleId}/`, roleData),
    
  // Delete a role
  deleteRole: (roleId) =>
    api.delete(`/api/roles/${roleId}/`),
    
  // Get all permissions
  getPermissions: (params = {}) =>
    api.get('/api/permissions/', { params }),
    
  // Get available permissions for a role
  getAvailablePermissions: (roleId) =>
    api.get(`/api/roles/${roleId}/available-permissions/`),
    
  // Assign permissions to a role
  assignPermissionsToRole: (roleId, permissionIds) =>
    api.post(`/api/roles/${roleId}/permissions/`, { permissions: permissionIds }),
    
  // Revoke permissions from a role
  revokePermissionsFromRole: (roleId, permissionIds) =>
    api.delete(`/api/roles/${roleId}/permissions/`, { 
      data: { permissions: permissionIds } 
    }),
    
  // ===== USER ROLES =====
  
  // Get user roles
  getUserRoles: (userId) =>
    api.get(`/api/users/${userId}/roles/`),
    
  // Assign roles to user
  assignUserRoles: (userId, roleIds) =>
    api.post(`/api/users/${userId}/roles/`, { roles: roleIds }),
    
  // Revoke roles from user
  revokeUserRoles: (userId, roleIds) =>
    api.delete(`/api/users/${userId}/roles/`, { 
      data: { roles: roleIds } 
    }),
    
  // ===== USER PERMISSIONS =====
  
  // Get user permissions
  getUserPermissions: (userId) =>
    api.get(`/api/users/${userId}/permissions/`),
    
  // Check if user has permission
  hasPermission: (userId, permissionCodename) =>
    api.get(`/api/users/${userId}/has-permission/`, {
      params: { permission: permissionCodename }
    }),
    
  // ===== USER SESSIONS =====
  
  // Get user sessions
  getUserSessions: (userId) =>
    api.get(`/api/users/${userId}/sessions/`),
    
  // Revoke user session
  revokeUserSession: (userId, sessionKey) =>
    api.delete(`/api/users/${userId}/sessions/${sessionKey}/`),
    
  // Revoke all user sessions except current
  revokeOtherUserSessions: (userId) =>
    api.post(`/api/users/${userId}/sessions/revoke-others/`),
    
  // ===== USER PREFERENCES =====
  
  // Get user preferences
  getUserPreferences: (userId) =>
    api.get(`/api/users/${userId}/preferences/`),
    
  // Update user preferences
  updateUserPreferences: (userId, preferences) =>
    api.patch(`/api/users/${userId}/preferences/`, preferences),
    
  // ===== USER ACTIVITY =====
  
  // Get user login history
  getUserLoginHistory: (userId, params = {}) =>
    api.get(`/api/users/${userId}/login-history/`, { params }),
    
  // Get user activity feed
  getUserActivityFeed: (userId, params = {}) =>
    api.get(`/api/users/${userId}/activity-feed/`, { params }),
    
  // ===== USER DEVICES =====
  
  // Get user devices
  getUserDevices: (userId) =>
    api.get(`/api/users/${userId}/devices/`),
    
  // Revoke user device
  revokeUserDevice: (userId, deviceId) =>
    api.delete(`/api/users/${userId}/devices/${deviceId}/`),
    
  // ===== USER NOTIFICATIONS =====
  
  // Get user notifications
  getUserNotifications: (userId, params = {}) =>
    api.get(`/api/users/${userId}/notifications/`, { params }),
    
  // Mark notification as read
  markNotificationAsRead: (userId, notificationId) =>
    api.post(`/api/users/${userId}/notifications/${notificationId}/read/`),
    
  // Mark all notifications as read
  markAllNotificationsAsRead: (userId) =>
    api.post(`/api/users/${userId}/notifications/read-all/`),
    
  // Get unread notification count
  getUnreadNotificationCount: (userId) =>
    api.get(`/api/users/${userId}/notifications/unread-count/`)
};

export default api;
