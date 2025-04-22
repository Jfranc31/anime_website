import React, { useContext, useState } from 'react';
import axiosInstance from '../utils/axiosConfig';
import Cookies from 'js-cookie';
import data from '../Context/ContextApi';
import { useNavigate } from 'react-router-dom';
import loginStyles from '../styles/pages/Login.module.css';

export const Login = () => {
  const [user, setUser] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { setUserData } = useContext(data);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user.email || !user.password) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axiosInstance.post('/users/login', user, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setUserData(res.data.user);

      Cookies.set('userInfo', JSON.stringify(res.data.user), {
        expires: 29,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
      });

      navigate('/');
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={loginStyles.loginWrapper}>
      <div className={loginStyles.container}>
        <h1 className={loginStyles.title}>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className={loginStyles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={user.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={isLoading}
              placeholder="Enter your email"
            />
          </div>

          <div className={loginStyles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={user.password}
              onChange={handleChange}
              autoComplete="current-password"
              disabled={isLoading}
              placeholder="Enter your password"
            />
          </div>

          <div className={loginStyles.btnContainer}>
            <button
              className={loginStyles.btn}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            <button
              className={`${loginStyles.btn} ${loginStyles.secondaryBtn}`}
              onClick={() => navigate('/register')}
              type="button"
              disabled={isLoading}
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
