import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axiosConfig';
import Cookies from 'js-cookie';

const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserData = useCallback(async () => {
    const userInfo = Cookies.get('userInfo');
    if (!userInfo) {
      setIsLoading(false);
      return;
    }

    try {
      const { _id } = JSON.parse(userInfo);
      const response = await axiosInstance.get(`/users/${_id}/current`);
      setUserData(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching user data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    setIsLoading(true);
    await fetchUserData();
  }, [fetchUserData]);

  const value = {
    userData,
    setUserData,
    isLoading,
    error,
    refreshUserData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
