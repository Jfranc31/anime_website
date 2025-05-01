import React, { useState } from 'react';
import { useUser } from './ContextApi';
import axiosInstance from '../utils/axiosConfig';
import styles from '../styles/components/upload.module.css';
import settingsStyle from '../styles/pages/Settings.module.css';

const AvatarUpload = () => {
  const { userData, refreshUserData } = useUser();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !userData?._id) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setLoading(true);
      setError(null);
      await axiosInstance.post(`/users/${userData._id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      await refreshUserData();
    } catch (err) {
      setError('Failed to upload avatar');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={settingsStyle.container}>
        <div className={settingsStyle.header}>
          {preview ? (
            <div className={settingsStyle.preview}>
              <img
                src={preview}
                alt="Selected Avatar"
                className={settingsStyle.imagePreview}
              />
              {file && (
                <button onClick={() => setFile(null)} className={settingsStyle.deselectButton}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                      <path d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z" stroke="#000000" stroke-width="2"></path>
                      <path d="M19.5 5H4.5" stroke="#000000" stroke-width="2" stroke-linecap="round"></path>
                      <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z" stroke="#000000" stroke-width="2"></path>
                    </g>
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <label htmlFor="file" className={settingsStyle.fileLabel}>
              <svg
                fill="#000000"
                viewBox="0 0 32 32"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M15.331 6H8.5v20h15V14.154h-8.169z" />
                <path d="M18.153 6h-.009v5.342H23.5v-.002z" />
              </svg>
              <p>Browse File to Upload</p>
            </label>
          )}
        </div>
        <input id="file" type="file" name="avatar" onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
        {file && <button onClick={handleUpload} className={settingsStyle.uploadButton}>Upload</button>}
        {preview && !file && (
          <div className={settingsStyle.actions}>
            <label htmlFor="file" className={settingsStyle.changeButton}>
              Change Avatar
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarUpload;
