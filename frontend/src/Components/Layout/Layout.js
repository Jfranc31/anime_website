import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../Components/Navbars/Navbar';
import Footer from '../../Components/Footers/Footer';
import layoutStyles from '../../styles/layoutStyles';

const Layout = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time to prevent layout flashing
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className={layoutStyles.loadingContainer}>
        <div className={layoutStyles.loadingSpinner} />
      </div>
    );
  }

  return (
    <div className={layoutStyles.layout}>
      <Navbar />
      <main className={layoutStyles.mainContent}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout; 