import axiosInstance from './axiosConfig';

export const fetchWithErrorHandling = async (url, options = {}) => {
  try {
    const response = await axiosInstance({
      url,
        ...options,
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
};