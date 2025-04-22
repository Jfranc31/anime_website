import React from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig.js';
import '../styles/pages/Profile.jsx';

const AniListAuth = ({ userId }) => {
  const navigate = useNavigate();

  // Function to initiate AniList connection
  const connectToAniList = async () => {
    try {
      // Get the authorization URL from your backend
      const response = await axiosInstance.get('/users/anilist/auth');
      const { url } = response.data;

      // Open AniList auth in a popup window
      const width = 600;
      const height = 800;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        url,
        'AniList Authentication',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for the callback
      window.addEventListener('message', async (event) => {
        if (event.origin === 'http://localhost:3000' || 'https://anime-website-ngy1mx2nu-davidfranco923-gmailcoms-projects.vercel.app') { // Your frontend URL
          const { code } = event.data;
          
          if (code) {
            try {
              // Send the code to your backend
              const response = await axiosInstance.post('/users/anilist/callback', {
                code,
                userId
              });

              if (response.data.success) {
                // Handle successful connection
                console.log('Successfully connected to AniList!');
                // Optionally refresh user data or redirect
                navigate('/profile'); // or wherever you want to redirect
              }
            } catch (error) {
              console.error('Error connecting to AniList:', error);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error initiating AniList connection:', error);
    }
  };

  // Function to disconnect from AniList
  const disconnectFromAniList = async () => {
    try {
      const response = await axiosInstance.post(`/users/${userId}/anilist/disconnect`);
      
      if (response.data.success) {
        console.log('Successfully disconnected from AniList!');
        // Optionally refresh user data or redirect
      }
    } catch (error) {
      console.error('Error disconnecting from AniList:', error);
    }
  };

  // Function to sync AniList data
  const syncAniListData = async () => {
    try {
      const response = await axiosInstance.post(`/users/${userId}/anilist/sync`);
      
      if (response.data.success) {
        console.log('Successfully synced AniList data!');
        // Handle the synced data
        console.log('Synced data:', response.data.data);
      }
    } catch (error) {
      console.error('Error syncing AniList data:', error);
    }
  };

  return (
    <div className="anilist-auth">
      <h2>AniList Connection</h2>
      <div className="anilist-buttons">
        <button onClick={connectToAniList}>
          Connect to AniList
        </button>
        <button onClick={disconnectFromAniList}>
          Disconnect from AniList
        </button>
        <button onClick={syncAniListData}>
          Sync AniList Data
        </button>
      </div>
    </div>
  );
};

export default AniListAuth; 