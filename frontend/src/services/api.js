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

        const response = await axios.post(`${API_URL}/token/refresh/`, {
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

// Helper function to create form data from object
const createFormData = (data, form = null, namespace = '') => {
  const formData = form || new FormData();
  
  // Handle File, Blob, and FileList objects
  const isFile = (obj) => {
    return (
      (typeof File !== 'undefined' && obj instanceof File) ||
      (typeof Blob !== 'undefined' && obj instanceof Blob) ||
      (typeof FileList !== 'undefined' && obj instanceof FileList)
    );
  };
  
  // Handle different data types
  for (let property in data) {
    if (!data.hasOwnProperty(property) || data[property] === undefined || data[property] === null) {
      continue;
    }
    
    const formKey = namespace ? `${namespace}[${property}]` : property;
    const value = data[property];
    
    // Handle different types of values
    if (isFile(value)) {
      // Handle single file
      formData.append(formKey, value);
    } else if (Array.isArray(value)) {
      // Handle arrays (including FileList)
      if (value.length && isFile(value[0])) {
        // Handle multiple files
        Array.from(value).forEach(file => {
          formData.append(`${formKey}[]`, file);
        });
      } else {
        // Handle array of primitives or objects
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null && !isFile(item)) {
            // Handle array of objects
            createFormData(item, formData, `${formKey}[${index}]`);
          } else {
            // Handle array of primitives
            formData.append(`${formKey}[]`, item);
          }
        });
      }
    } else if (value instanceof Date) {
      // Handle dates
      formData.append(formKey, value.toISOString());
    } else if (typeof value === 'object' && value !== null) {
      // Handle nested objects
      createFormData(value, formData, formKey);
    } else if (typeof value === 'boolean') {
      // Handle booleans
      formData.append(formKey, value ? 'true' : 'false');
    } else if (value !== undefined && value !== null) {
      // Handle all other types (string, number, etc.)
      formData.append(formKey, value);
    }
  }
  
  return formData;
};

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
        { staff_id: cleanStaffId },
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
      
      let errorMessage = 'Failed to log in. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data?.error || 
                      error.response.data?.detail || 
                      error.response.statusText ||
                      'Login failed. Please check your credentials.';
                      
        // If it's a 400 Bad Request, provide more specific feedback
        if (error.response.status === 400) {
          errorMessage = 'Invalid staff ID. Please check and try again.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      // Clear any existing tokens on error
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      throw { error: errorMessage };
    }
  },

  // Register new user
  register: (userData) => api.post('/auth/register/', userData),

  // Request password reset
  requestPasswordReset: (email) =>
    api.post('/auth/password/reset/', { email }),

  // Reset password with token
  resetPassword: (uid, token, newPassword) =>
    api.post('/auth/password/reset/confirm/', {
      uid,
      token,
      new_password: newPassword,
    }),

  // Change password
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/password/change/', {
      current_password: currentPassword,
      new_password: newPassword,
    }),

  // Logout
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_type');
    return api.post('/auth/logout/');
  },

  // Get current user
  getCurrentUser: () => api.get('/auth/me/'),
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

// Menu API
export const menuApi = {
  // Menu Items
  getMenuItems: (params = {}) => api.get('/menu-items/', { params }),
  getMenuItem: (id) => api.get(`/menu-items/${id}/`),
  createMenuItem: (data) => {
    const formData = createFormData(data);
    return api.post('/menu-items/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateMenuItem: (id, data) => {
    const formData = createFormData(data);
    return api.patch(`/menu-items/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteMenuItem: (id) => api.delete(`/menu-items/${id}/`),
  toggleMenuItemAvailability: (id, isAvailable) => 
    api.patch(`/menu-items/${id}/`, { is_available: isAvailable }),
  
  // Menu Item Images with Cloudinary
  uploadMenuItemImage: async (id, imageFile) => {
    try {
      // First upload to Cloudinary
      const uploadResponse = await cloudinaryApi.uploadImage(imageFile, 'menu-items');
      
      // Then save the Cloudinary URL to our database
      return api.patch(`/menu/items/${id}/`, {
        image: uploadResponse.data.secure_url,
        image_public_id: uploadResponse.data.public_id
      });
    } catch (error) {
      console.error('Error uploading menu item image:', error);
      throw error;
    }
  },

  // Categories
  getCategories: () => api.get('/categories/'),
  getCategory: (id) => api.get(`/categories/${id}/`),
  createCategory: (data) => {
    const formData = createFormData(data);
    return api.post('/categories/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateCategory: (id, data) => {
    const formData = createFormData(data);
    return api.patch(`/categories/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteCategory: (id) => api.delete(`/categories/${id}/`),
  
  // Category Images with Cloudinary
  uploadCategoryImage: async (id, imageFile) => {
    try {
      // First upload to Cloudinary
      const uploadResponse = await cloudinaryApi.uploadImage(imageFile, 'categories');
      
      // Then save the Cloudinary URL to our database
      return api.patch(`/menu/categories/${id}/`, {
        image: uploadResponse.data.secure_url,
        image_public_id: uploadResponse.data.public_id
      });
    } catch (error) {
      console.error('Error uploading category image:', error);
      throw error;
    }
  },
};

// Staff API
export const staffApi = {
  // Staff members
  getStaffMembers: (params = {}) => api.get('/staff/', { params }),
  getStaffMember: (id) => api.get(`/staff/${id}/`),
  createStaffMember: (data) => {
    const formData = createFormData(data);
    return api.post('/staff/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateStaffMember: (id, data) => {
    const formData = createFormData(data);
    return api.patch(`/staff/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteStaffMember: (id) => api.delete(`/staff/${id}/`),
  updateStaffStatus: (id, isActive) =>
    api.patch(`/staff/${id}/status/`, { is_active: isActive }),

  // Staff shifts
  getShifts: (params = {}) => api.get('/staff/shifts/', { params }),
  createShift: (data) => api.post('/staff/shifts/', data),
  updateShift: (id, data) => api.patch(`/staff/shifts/${id}/`, data),
  deleteShift: (id) => api.delete(`/staff/shifts/${id}/`),
};

// Orders API
export const orderApi = {
  // Orders
  getOrders: (params = {}) => api.get('/orders/', { params }),
  getOrder: (id) => api.get(`/orders/${id}/`),
  createOrder: (data) => api.post('/orders/', data),
  updateOrder: (id, data) => api.patch(`/orders/${id}/`, data),
  deleteOrder: (id) => api.delete(`/orders/${id}/`),
  cancelOrder: (id, reason) =>
    api.post(`/orders/${id}/cancel/`, { cancellation_reason: reason }),
  updateOrderStatus: (id, status) =>
    api.patch(`/orders/${id}/status/`, { status }),

  // Order items
  getOrderItems: (orderId) => api.get(`/orders/${orderId}/items/`),
  addOrderItem: (orderId, data) =>
    api.post(`/orders/${orderId}/items/`, data),
  updateOrderItem: (orderId, itemId, data) =>
    api.patch(`/orders/${orderId}/items/${itemId}/`, data),
  removeOrderItem: (orderId, itemId) =>
    api.delete(`/orders/${orderId}/items/${itemId}/`),
};

// Tables API
export const tableApi = {
  getTables: (params = {}) => api.get('/tables/', { params }),
  getTable: (id) => api.get(`/tables/${id}/`),
  createTable: (data) => api.post('/tables/', data),
  updateTable: (id, data) => api.patch(`/tables/${id}/`, data),
  deleteTable: (id) => api.delete(`/tables/${id}/`),
  updateTableStatus: (id, status) =>
    api.patch(`/tables/${id}/status/`, { status }),
};

// Reservations API
export const reservationApi = {
  getReservations: (params = {}) => api.get('/reservations/', { params }),
  getReservation: (id) => api.get(`/reservations/${id}/`),
  createReservation: (data) => api.post('/reservations/', data),
  updateReservation: (id, data) => api.patch(`/reservations/${id}/`, data),
  deleteReservation: (id) => api.delete(`/reservations/${id}/`),
  updateReservationStatus: (id, status) =>
    api.patch(`/reservations/${id}/status/`, { status }),
  checkAvailability: (data) =>
    api.post('/reservations/check-availability/', data),
};

// Inventory API
export const inventoryApi = {
  // Inventory items
  getInventoryItems: (params = {}) => api.get('/inventory/', { params }),
  getInventoryItem: (id) => api.get(`/inventory/${id}/`),
  createInventoryItem: (data) => {
    const formData = createFormData(data);
    return api.post('/inventory/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateInventoryItem: (id, data) => {
    const formData = createFormData(data);
    return api.patch(`/inventory/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteInventoryItem: (id) => api.delete(`/inventory/${id}/`),
  
  // Inventory search and filters
  searchInventory: (query, params = {}) => 
    api.get('/inventory/search/', { 
      params: { ...params, q: query } 
    }),
  
  // Inventory transactions
  getTransactions: (params = {}) => 
    api.get('/inventory-transactions/', { params }),
  getTransaction: (id) => api.get(`/inventory-transactions/${id}/`),
  createTransaction: (data) => {
    const formData = createFormData(data);
    return api.post('/inventory-transactions/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateTransaction: (id, data) => {
    const formData = createFormData(data);
    return api.patch(`/inventory-transactions/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteTransaction: (id) => api.delete(`/inventory-transactions/${id}/`),

  // Low stock and alerts
  getLowStockItems: (params = {}) => 
    api.get('/inventory/low-stock/', { params }),
  getLowStockAlert: (id) => api.get(`/inventory/low-stock/${id}/`),
  
  // Inventory reports
  getInventoryReport: (params = {}) => 
    api.get('/inventory/report/', { params }),
  exportInventoryReport: (format = 'pdf', params = {}) =>
    api.get(`/inventory/export-report/?format=${format}`, { 
      responseType: 'blob',
      params 
    }),
  
  // Inventory adjustments
  adjustInventory: (itemId, adjustmentData) =>
    api.post(`/inventory/${itemId}/adjust/`, adjustmentData),
};

// Recipes API
export const recipeApi = {
  getRecipes: (params = {}) => api.get('/recipes/', { params }),
  getRecipe: (id) => api.get(`/recipes/${id}/`),
  createRecipe: (data) => api.post('/recipes/', data),
  updateRecipe: (id, data) => api.patch(`/recipes/${id}/`, data),
  deleteRecipe: (id) => api.delete(`/recipes/${id}/`),

  // Recipe ingredients
  getRecipeIngredients: (recipeId) =>
    api.get(`/recipes/${recipeId}/ingredients/`),
  addRecipeIngredient: (recipeId, data) =>
    api.post(`/recipes/${recipeId}/ingredients/`, data),
  updateRecipeIngredient: (recipeId, ingredientId, data) =>
    api.patch(`/recipes/${recipeId}/ingredients/${ingredientId}/`, data),
  removeRecipeIngredient: (recipeId, ingredientId) =>
    api.delete(`/recipes/${recipeId}/ingredients/${ingredientId}/`),
};

// Payments API
export const paymentApi = {
  getPayments: (params = {}) => api.get('/payments/', { params }),
  getPayment: (id) => api.get(`/payments/${id}/`),
  createPayment: (data) => api.post('/payments/', data),
  updatePayment: (id, data) => api.patch(`/payments/${id}/`, data),
  deletePayment: (id) => api.delete(`/payments/${id}/`),
  processPayment: (orderId, data) =>
    api.post(`/orders/${orderId}/pay/`, data),
  getPaymentMethods: () => api.get('/payments/methods/'),
};

// Notifications API
export const notificationApi = {
  getNotifications: (params = {}) => api.get('/notifications/', { params }),
  getUnreadCount: () => api.get('/notifications/unread/count/'),
  markAsRead: (id) => api.patch(`/notifications/${id}/mark-as-read/`),
  markAllAsRead: () => api.post('/notifications/mark-all-as-read/'),
  deleteNotification: (id) => api.delete(`/notifications/${id}/`),
};

// Reports API
export const reportApi = {
  // Sales reports
  getSalesReport: (params = {}) =>
    api.get('/reports/sales/', { params, responseType: 'blob' }),
  getSalesSummary: (params = {}) => api.get('/reports/sales/summary/', { params }),
  
  // Inventory reports
  getInventoryReport: (params = {}) =>
    api.get('/reports/inventory/', { params, responseType: 'blob' }),
  getLowStockReport: (params = {}) =>
    api.get('/reports/inventory/low-stock/', { params }),
  
  // Staff performance
  getStaffPerformance: (params = {}) =>
    api.get('/reports/staff-performance/', { params }),
  
  // Popular items
  getPopularItems: (params = {}) =>
    api.get('/reports/popular-items/', { params }),
  
  // Financial reports
  getFinancialReport: (params = {}) =>
    api.get('/reports/financial/', { params, responseType: 'blob' }),
  
  // Export report
  exportReport: (reportType, format = 'pdf', params = {}) =>
    api.get(`/reports/export/${reportType}/`, {
      params: { ...params, format },
      responseType: 'blob',
    }),
};

// Settings API
export const settingsApi = {
  getSettings: () => api.get('/settings/'),
  updateSettings: (data) => api.patch('/settings/', data),
  getBusinessHours: () => api.get('/settings/business-hours/'),
  updateBusinessHours: (data) => api.patch('/settings/business-hours/', data),
  getTaxRates: () => api.get('/settings/tax-rates/'),
  updateTaxRates: (data) => api.patch('/settings/tax-rates/', data),
  getDeliveryZones: () => api.get('/settings/delivery-zones/'),
  updateDeliveryZones: (data) => api.patch('/settings/delivery-zones/', data),
};

export default api;
