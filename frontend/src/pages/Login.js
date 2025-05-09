import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../Context/ContextApi';
import axiosInstance from '../utils/axiosConfig';
import styles from '../styles/pages/Login.module.css';
import Cookies from 'js-cookie';

const LoginPage = () => {
  const navigate = useNavigate();
  const { refreshUserData } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post('/auth/login', formData);
      
      // Store user info in both cookie and localStorage for redundancy
      const userInfo = response.data.user;
      Cookies.set('userInfo', JSON.stringify(userInfo), { 
        expires: 29, // 29 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None'
      });
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      // Wait for user data to be refreshed
      await refreshUserData();
      
      // Navigate to home page
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.container}>
        <h1 className={styles.title}>Login</h1>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              disabled={loading}
              placeholder="Enter your password"
            />
          </div>
          <div className={styles.btnContainer}>
            <button
              className={styles.btn}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button
              className={`${styles.btn} ${styles.secondaryBtn}`}
              onClick={() => navigate('/register')}
              type="button"
              disabled={loading}
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
