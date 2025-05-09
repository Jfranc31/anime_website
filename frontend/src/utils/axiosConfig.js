import axios from 'axios';
import Cookies from 'js-cookie';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const userInfo = Cookies.get('userInfo') || localStorage.getItem('userInfo');
    if (userInfo) {
      const { _id } = JSON.parse(userInfo);
      config.headers.Authorization = `Bearer ${_id}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error: Please check if the backend server is running');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 