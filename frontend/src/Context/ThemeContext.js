import React, { createContext, useContext, useEffect, useState } from 'react';
import data from './ContextApi';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const { userData } = useContext(data) || { userData: null };

  useEffect(() => {
    if (userData?.theme) {
      setTheme(userData.theme);
    }
  }, [userData]);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
