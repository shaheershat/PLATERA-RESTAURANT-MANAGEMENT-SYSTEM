import axios from 'axios';

const CLOUD_NAME = 'your_cloud_name'; // Replace with your Cloudinary cloud name
const UPLOAD_PRESET = 'your_upload_preset'; // Create an unsigned upload preset in Cloudinary

// Get the Cloudinary upload URL based on the cloud name
const getCloudinaryUrl = () => `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Uploads an image file to Cloudinary
 * @param {File} file - The image file to upload
 * @param {string} folder - Optional folder in Cloudinary to store the image
 * @returns {Promise<Object>} - The Cloudinary response with image details
 */
const uploadImage = async (file, folder = 'platera') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);
    
    const response = await axios.post(getCloudinaryUrl(), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to upload image',
    };
  }
};

/**
 * Deletes an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<Object>} - The result of the delete operation
 */
const deleteImage = async (publicId) => {
  try {
    // Note: You'll need to implement a server-side endpoint to handle secure deletion
    // as Cloudinary requires your API secret which should not be exposed in the frontend
    const response = await api.delete('/cloudinary/delete', { data: { publicId } });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete image',
    };
  }
};

export const cloudinaryService = {
  uploadImage,
  deleteImage,
};
