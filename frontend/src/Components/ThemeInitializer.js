import React, { useContext, useEffect } from 'react';
import { useTheme } from '../Context/ThemeContext';
import data from '../Context/ContextApi';

const ThemeInitializer = () => {
  const { userData } = useContext(data);
  const { setTheme } = useTheme();

  useEffect(() => {
    if (userData?.theme) {
      setTheme(userData.theme);
    }
  }, [userData, setTheme]);

  return null;
};

export default ThemeInitializer; 