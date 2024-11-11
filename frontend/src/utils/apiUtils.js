import axios from 'axios';

export const fetchWithErrorHandling = async (url, options = {}) => {
  try {
    const response = await axios({
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