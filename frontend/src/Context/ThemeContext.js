import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './ContextApi';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { userData } = useUser();
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    if (userData?.theme) {
      setTheme(userData.theme);
    }
  }, [userData?.theme]);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const value = {
    theme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
