import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import data from '../../Context/ContextApi';
import Cookies from 'js-cookie';
import styles from '../../styles/components/user_management.module.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { userData } = useContext(data);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const userInfo = Cookies.get('userInfo');
      if (!userInfo) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get('/users', {
        headers: {
          'Authorization': `Bearer ${JSON.parse(userInfo)._id}`
        }
      });
      setUsers(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error fetching users');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = async (userId) => {
    try {
      const userInfo = Cookies.get('userInfo');
      await axios.put(`/users/${userId}/make-admin`, {}, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(userInfo)._id}`
        }
      });
      setSuccess('User successfully made admin');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error making user admin');
      console.error('Error:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!userData || userData.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>User Management</h2>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}
      
      {loading ? (
        <div className={styles.loading}>Loading users...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.roleTag} ${styles[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => makeAdmin(user._id)}
                        className={styles.adminButton}
                      >
                        Make Admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 