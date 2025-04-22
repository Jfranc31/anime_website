import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import registerStyles from '../styles/pages/register.module.css';

const Register = () => {
  const [user, setUser] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!user.username) newErrors.username = 'Username is required';
    if (!user.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(user.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!user.password) {
      newErrors.password = 'Password is required';
    } else if (user.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (user.password !== user.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/users/register', {
        username: user.username,
        email: user.email,
        password: user.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (response.data) {
        navigate('/login');
      }
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Registration failed. Please try again.'
      });
      console.error('Registration error:', error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={registerStyles.container}>
      <div className={registerStyles.formWrapper}>
        <h1>Create Account</h1>
        <form onSubmit={handleSubmit} className={registerStyles.form}>
          <div className={registerStyles.inputGroup}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={user.username}
              onChange={handleChange}
              className={errors.username ? registerStyles.errorInput : ''}
            />
            {errors.username && <span className={registerStyles.error}>{errors.username}</span>}
          </div>

          <div className={registerStyles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={user.email}
              onChange={handleChange}
              className={errors.email ? registerStyles.errorInput : ''}
            />
            {errors.email && <span className={registerStyles.error}>{errors.email}</span>}
          </div>

          <div className={registerStyles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={user.password}
              onChange={handleChange}
              className={errors.password ? registerStyles.errorInput : ''}
            />
            {errors.password && <span className={registerStyles.error}>{errors.password}</span>}
          </div>

          <div className={registerStyles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={user.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? registerStyles.errorInput : ''}
            />
            {errors.confirmPassword && (
              <span className={registerStyles.error}>{errors.confirmPassword}</span>
            )}
          </div>

          {errors.submit && (
            <div className={registerStyles.submitError}>{errors.submit}</div>
          )}

          <button 
            type="submit" 
            className={registerStyles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>

          <p className={registerStyles.loginLink}>
            Already have an account? <a href="/login">Login here</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
