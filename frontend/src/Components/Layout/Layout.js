import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../Components/Navbars/Navbar';

const Layout = () => {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default Layout; 