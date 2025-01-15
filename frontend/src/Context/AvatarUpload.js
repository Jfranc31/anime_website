import React, { useState, useContext } from 'react';
import axios from 'axios';
import data from './ContextApi'; // Import your context

const AvatarUpload = ({ userId }) => {
  const [file, setFile] = useState(null);
  const { setUserData } = useContext(data); // Get the context setter

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.post(`http://localhost:8080/users/${userId}/upload-avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert(response.data.message);

      // Update the user data in context with the new avatar
      setUserData((prevData) => ({
        ...prevData,
        avatar: response.data.user.avatar, // Update the avatar in user data
      }));
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
