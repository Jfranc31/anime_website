import React, { useState, useContext } from 'react';
import axios from 'axios';
import data from './ContextApi'; // Import your context
import Cookies from 'js-cookie';

const AvatarUpload = ({ userId }) => {
  const [file, setFile] = useState(null);
  const { setUserData } = useContext(data); // Get the context setter

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.post(`http://localhost:8080/users/${userId}/upload-avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response from server:', response.data); // Log the response

      if (response.data && response.data.avatar) {
        alert(response.data.message);

        // Construct the full avatar URL if necessary
        const avatarUrl = response.data.avatar;

        // Update the user data in context with the new avatar
        setUserData((prevData) => ({
          ...prevData,
          avatar: avatarUrl, // Update the avatar in user data
        }));

        // Update the cookie with the new avatar
        const userInfo = Cookies.get('userInfo');
        if (userInfo) {
          const parsedUserInfo = JSON.parse(userInfo);
          parsedUserInfo.avatar = avatarUrl; // Update the avatar in cookie
          Cookies.set('userInfo', JSON.stringify(parsedUserInfo));
        }

      } else {
        throw new Error('Avatar URL not found in response');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar');
    }
  };

  return (
    <div>
      <h2>Upload Avatar</h2>
      <input type="file" name="avatar" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
};

export default AvatarUpload;
