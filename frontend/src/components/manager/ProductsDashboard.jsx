import React, { useState, useEffect, useCallback } from 'react';
import { menuApi } from '../../services/api';
import { toast } from 'react-toastify';

// Default image URL
const DEFAULT_IMAGE = 'https://placehold.co/400x300/FDBA00/FFFFFF?text=No+Image';

const ProductsDashboard = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    is_available: true,
    image: null
  });
  
  const [editedItem, setEditedItem] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    is_available: true,
    image: null
  });

  // Fetch all data from the backend
  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all categories
      const categoriesResponse = await menuApi.getCategories();
      const categoriesData = Array.isArray(categoriesResponse?.data) 
        ? categoriesResponse.data 
        : [];
      setCategories(categoriesData);
      
      // Fetch all products with pagination
      let allFetchedProducts = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await menuApi.getMenuItems({ page, page_size: 100 });
        const { results = [], next } = response.data;
        allFetchedProducts = [...allFetchedProducts, ...results];
        hasMore = !!next;
        page++;
      }
      
      setAllProducts(allFetchedProducts);
      
      // Set default category if available
      if (categoriesData.length > 0) {
        setNewItem(prev => ({
          ...prev,
          category: categoriesData[0]?.id || ''
        }));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Ensure categories is an array before using it
  const safeCategories = Array.isArray(categories) ? categories : [];
  
  // Filter products based on active category and search query
  const filteredProducts = Array.isArray(allProducts) ? allProducts.filter(product => {
    if (!product) return false;
    const matchesCategory = activeCategory === 'All' || 
      product.category?.name === activeCategory;
    
    const matchesSearch = searchQuery === '' || 
      (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  }) : [];

  // Handle image file selection with validation
  const handleImageChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    if (isEdit) {
      setEditImageFile(file);
      setEditedItem(prev => ({
        ...prev,
        image: file
      }));
    } else {
      setImageFile(file);
      setNewItem(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  // Handle form input changes for new item
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convert price to number if needed
    const processedValue = name === 'price' ? parseFloat(value) || '' : value;
    
    setNewItem(prev => ({
      ...prev,
      [name]: type === 'number' ? processedValue : value
    }));
  };

  // Handle form input changes for edited item
  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Convert price to number if needed
    const processedValue = name === 'price' ? parseFloat(value) || '' : value;
    
    setEditedItem(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? processedValue : value)
    }));
  };
  
  // Remove image from new item
  const removeNewImage = () => {
    setImageFile(null);
    setNewItem(prev => ({
      ...prev,
      image: null
    }));
  };
  
  // Remove image from edited item
  const removeEditImage = () => {
    setEditImageFile(null);
    setEditedItem(prev => ({
      ...prev,
      image: null
    }));
  };

  // Handle add item submission
  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // First create the menu item
      const { image, ...itemData } = newItem;
      const response = await menuApi.createMenuItem(itemData);
      const createdItem = response.data;
      
      // If there's an image, upload it separately
      if (image) {
        try {
          await menuApi.uploadMenuItemImage(createdItem.id, image);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.warning('Menu item was created, but there was an error uploading the image');
        }
      }
      
      // Refresh all data to ensure consistency
      await fetchAllData();
      
      // Reset form
      setNewItem({
        name: '',
        category: categories[0]?.id || '',
        price: '',
        description: '',
        is_available: true,
        image: null
      });
      setImageFile(null);
      setIsAddItemOpen(false);
      toast.success('Menu item added successfully');
    } catch (err) {
      console.error('Error adding menu item:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add menu item';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle edit item
  const handleEditItem = (product) => {
    setSelectedProduct(product);
    setEditedItem({
      name: product.name,
      category: product.category?.id || '',
      price: product.price,
      description: product.description || '',
      is_available: product.is_available,
      image: null
    });
    setEditImageFile(null);
    setIsEditItemOpen(true);
  };

  // Handle edit item submission
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    try {
      setIsLoading(true);
      
      // First update the menu item data
      const { image, ...itemData } = editedItem;
      await menuApi.updateMenuItem(selectedProduct.id, itemData);
      
      // If there's a new image, upload it separately
      if (editImageFile) {
        try {
          await menuApi.uploadMenuItemImage(selectedProduct.id, editImageFile);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.warning('Menu item was updated, but there was an error uploading the new image');
        }
      }
      
      // Refresh all data to ensure consistency
      await fetchAllData();
      
      // Reset form and close modal
      setIsEditItemOpen(false);
      setSelectedProduct(null);
      setEditedItem({ 
        name: '', 
        category: '', 
        price: '', 
        description: '',
        is_available: true,
        image: null 
      });
      setEditImageFile(null);
      
      toast.success('Menu item updated successfully');
    } catch (err) {
      console.error('Error updating menu item:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update menu item';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    
    try {
      setIsLoading(true);
      await menuApi.deleteMenuItem(selectedProduct.id);
      
      // Refresh all data to ensure consistency
      await fetchAllData();
      
      // Close the confirmation dialog
      setIsDeleteConfirmOpen(false);
      setSelectedProduct(null);
      
      toast.success('Menu item deleted successfully');
    } catch (err) {
      console.error('Error deleting menu item:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete menu item';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel delete
  const handleDeleteCancel = () => {
    setIsDeleteConfirmOpen(false);
    setSelectedProduct(null);
  };
  
  // Toggle item availability
  const toggleItemAvailability = async (itemId, currentStatus) => {
    try {
      setIsLoading(true);
      await menuApi.toggleMenuItemAvailability(itemId, !currentStatus);
      
      // Refresh all data to ensure consistency
      await fetchAllData();
      
      toast.success(`Item ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      console.error('Error toggling item availability:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update item status';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="flex bg-gray-100">
      {/* Main Content only */}
      <div className="flex-1 p-1 overflow-y-auto">
        {/* Header and search bar */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-black">Products</h1>
        </div>

        {/* Category filter and add button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex space-x-2 text-sm bg-gray-200 p-2 rounded-full">
              <button
                key="All"
                onClick={() => setActiveCategory('All')}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  activeCategory === 'All'
                    ? 'bg-[#5C4033] text-white'
                    : 'text-[#5C4033] hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {safeCategories.map((category) => (
                <button
                  key={category?.id}
                  onClick={() => setActiveCategory(category?.name)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    activeCategory === category?.name
                      ? 'bg-[#5C4033] text-white'
                      : 'text-[#5C4033] hover:bg-gray-300'
                  }`}
                >
                  {category?.name || 'Uncategorized'}
                </button>
              ))}
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5C4033] w-full md:w-64"
              />
              <svg
                className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M12.9 14.32a8 8 0 111.414-1.414l5.36 5.36-1.414 1.414-5.36-5.36zM8 14A6 6 0 108 2a6 6 0 000 12z"></path>
              </svg>
            </div>
          </div>
          <button
            onClick={() => setIsAddItemOpen(true)}
            disabled={isLoading}
            className="px-6 py-2 rounded-full bg-[#EB5757] text-white font-medium hover:bg-red-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              'Add New Item'
            )}
          </button>
        </div>

        {/* Loading State */}
        {isLoading && !filteredProducts.length ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5C4033]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={product.image || DEFAULT_IMAGE}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_IMAGE;
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => toggleItemAvailability(product.id, product.is_available)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.is_available
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {product.is_available ? 'Available' : 'Unavailable'}
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.category?.name || 'Uncategorized'}</p>
                    </div>
                    <span className="font-bold text-gray-900">${parseFloat(product.price).toFixed(2)}</span>
                  </div>
                  {product.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
                  )}
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditItem(product)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsDeleteConfirmOpen(true);
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery || activeCategory !== 'All' 
                    ? 'Try adjusting your search or filter to find what you\'re looking for.'
                    : 'Get started by creating a new product.'}
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddItemOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#5C4033] hover:bg-[#4a3429] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C4033]"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    New Product
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Item Modal */}
        {isAddItemOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add New Menu Item</h2>
                <button 
                  onClick={() => setIsAddItemOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleAddItem}>
                <div className="flex space-x-4">
                  <div className="w-1/2">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                      <div className="mt-1">
                        <div className="flex items-center">
                          <span className="inline-block h-20 w-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                            {imageFile ? (
                              <img
                                src={URL.createObjectURL(imageFile)}
                                alt="Preview"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                <svg
                                  className="h-12 w-12 text-gray-400"
                                  stroke="currentColor"
                                  fill="none"
                                  viewBox="0 0 48 48"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            )}
                          </span>
                          <div className="ml-4 flex flex-col space-y-2">
                            <div>
                              <label
                                htmlFor="file-upload"
                                className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C4033] cursor-pointer inline-flex items-center"
                              >
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span>{imageFile ? 'Change image' : 'Upload image'}</span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                  onChange={(e) => handleImageChange(e, false)}
                                  accept="image/jpeg, image/png, image/webp"
                                />
                              </label>
                            </div>
                            {imageFile && (
                              <button
                                type="button"
                                onClick={removeNewImage}
                                className="px-3 py-1.5 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 inline-flex items-center"
                              >
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          JPG, PNG or WebP. Max 5MB.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="w-1/2 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={newItem.name || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        id="category"
                        name="category"
                        value={newItem.category}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                        required
                      >
                        {safeCategories.map((category) => (
                          <option key={category?.id} value={category?.id}>
                            {category?.name || 'Select a category'}
                          </option>
                        ))}
                        {(!Array.isArray(categories) || categories.length === 0) && (
                          <option value="" disabled>No categories available</option>
                        )}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          name="price"
                          value={newItem.price || ''}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="focus:ring-[#5C4033] focus:border-[#5C4033] block w-full pl-7 pr-12 sm:text-sm border-2 border-[#5C4033] rounded-lg p-2"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        name="description"
                        value={newItem.description || ''}
                        onChange={handleInputChange}
                        rows="3"
                        className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="is_available"
                        name="is_available"
                        type="checkbox"
                        checked={newItem.is_available || false}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-[#5C4033] focus:ring-[#5C4033] border-gray-300 rounded"
                      />
                      <label htmlFor="is_available" className="ml-2 block text-sm text-gray-700">
                        Available
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddItemOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C4033]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5C4033] hover:bg-[#4a3429] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C4033] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Save Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Edit Item Modal */}
        {isEditItemOpen && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Edit Menu Item</h2>
                <button 
                  onClick={() => setIsEditItemOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSaveEdit}>
                <div className="flex space-x-4">
                  <div className="w-1/2">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                      <div className="mt-1">
                        <div className="flex items-center">
                          <span className="inline-block h-20 w-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                            {editImageFile ? (
                              <img
                                src={URL.createObjectURL(editImageFile)}
                                alt="Preview"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <img
                                src={selectedProduct.image || DEFAULT_IMAGE}
                                alt={selectedProduct.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = DEFAULT_IMAGE;
                                }}
                              />
                            )}
                          </span>
                          <div className="ml-4 flex flex-col space-y-2">
                            <div>
                              <label
                                htmlFor="edit-file-upload"
                                className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C4033] cursor-pointer inline-flex items-center"
                              >
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span>{editImageFile || selectedProduct?.image ? 'Change image' : 'Upload image'}</span>
                                <input
                                  id="edit-file-upload"
                                  name="edit-file-upload"
                                  type="file"
                                  className="sr-only"
                                  onChange={(e) => handleImageChange(e, true)}
                                  accept="image/jpeg, image/png, image/webp"
                                />
                              </label>
                            </div>
                            {(editImageFile || selectedProduct?.image) && (
                              <button
                                type="button"
                                onClick={removeEditImage}
                                className="px-3 py-1.5 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 inline-flex items-center"
                              >
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          JPG, PNG or WebP. Max 5MB.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-1/2 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={editedItem.name || ''}
                        onChange={handleEditInputChange}
                        className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        name="category"
                        value={editedItem.category || ''}
                        onChange={handleEditInputChange}
                        className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                        required
                      >
                        {safeCategories.map((category) => (
                          <option key={category?.id} value={category?.id}>
                            {category?.name || 'Select a category'}
                          </option>
                        ))}
                        {(!Array.isArray(categories) || categories.length === 0) && (
                          <option value="" disabled>No categories available</option>
                        )}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          name="price"
                          value={editedItem.price || ''}
                          onChange={handleEditInputChange}
                          step="0.01"
                          min="0"
                          className="focus:ring-[#5C4033] focus:border-[#5C4033] block w-full pl-7 pr-12 sm:text-sm border-2 border-[#5C4033] rounded-lg p-2"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        name="description"
                        value={editedItem.description || ''}
                        onChange={handleEditInputChange}
                        rows="3"
                        className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="edit_is_available"
                        name="is_available"
                        type="checkbox"
                        checked={editedItem.is_available || false}
                        onChange={handleEditInputChange}
                        className="h-4 w-4 text-[#5C4033] focus:ring-[#5C4033] border-gray-300 rounded"
                      />
                      <label htmlFor="edit_is_available" className="ml-2 block text-sm text-gray-700">
                        Available
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditItemOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C4033]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5C4033] hover:bg-[#4a3429] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C4033] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {isDeleteConfirmOpen && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Menu Item</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete "{selectedProduct.name}"? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C4033] sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {isEditItemOpen && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Edit Menu Item</h2>
                <button 
                  onClick={() => setIsEditItemOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSaveEdit}>
                <div className="flex space-x-4">
                  <div className="w-1/2">
                    <div className="mb-4">
                      <div className="mt-1 flex items-center">
                        <span className="inline-block h-40 w-full rounded-md overflow-hidden bg-gray-100">
                          {editImageFile ? (
                            <img
                              src={URL.createObjectURL(editImageFile)}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <img
                              src={selectedProduct.image || DEFAULT_IMAGE}
                              alt={selectedProduct.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = DEFAULT_IMAGE;
                              }}
                            />
                          )}
                        </span>
                        <div className="ml-4">
                          <label
                            htmlFor="edit-file-upload"
                            className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C4033] cursor-pointer"
                          >
                            <span>Change Image</span>
                            <input
                              id="edit-file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={(e) => handleImageChange(e, true)}
                              accept="image/*"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-1/2 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={editedItem.name || ''}
                        onChange={handleEditInputChange}
                        className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        name="category"
                        value={editedItem.category || ''}
                        onChange={handleEditInputChange}
                        className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                        required
                      >
                        {safeCategories.map((category) => (
                          <option key={category?.id} value={category?.id}>
                            {category?.name || 'Select a category'}
                          </option>
                        ))}
                        {(!Array.isArray(categories) || categories.length === 0) && (
                          <option value="" disabled>No categories available</option>
                        )}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          name="price"
                          value={editedItem.price || ''}
                          onChange={handleEditInputChange}
                          step="0.01"
                          min="0"
                          className="focus:ring-[#5C4033] focus:border-[#5C4033] block w-full pl-7 pr-12 sm:text-sm border-2 border-[#5C4033] rounded-lg p-2"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        name="description"
                        value={editedItem.description || ''}
                        onChange={handleEditInputChange}
                        rows="3"
                        className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="edit_is_available"
                        name="is_available"
                        type="checkbox"
                        checked={editedItem.is_available || false}
                        onChange={handleEditInputChange}
                        className="h-4 w-4 text-[#5C4033] focus:ring-[#5C4033] border-gray-300 rounded"
                      />
                      <label htmlFor="edit_is_available" className="ml-2 block text-sm text-gray-700">
                        Available for ordering
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditItemOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C4033]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5C4033] hover:bg-[#4a3429] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C4033] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteConfirmOpen && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-72 text-center">
              <p className="text-lg mb-4">Do you want to delete this product?</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 bg-gray-200 rounded-lg border-2 border-[#5C4033] text-[#5C4033] hover:bg-gray-300 transition-colors"
                >
                  No
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-[#5C4033] text-white rounded-lg hover:bg-[#4A3226] transition-colors"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsDashboard;