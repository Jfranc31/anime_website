import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AniListCallback = () => {
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('AniList authentication error:', error);
      if (window.opener) {
        window.opener.postMessage({ error }, 'http://localhost:3000');
      }
      window.close();
      return;
    }

    if (code && window.opener) {
      // Send the code only once
      window.opener.postMessage({ code }, 'http://localhost:3000');
      // Clear the URL parameters to prevent reuse
      window.history.replaceState({}, document.title, '/auth/anilist/callback');
      // Close the window after a short delay
      setTimeout(() => window.close(), 100);
    }
  }, [location]);

  return (
    <div>
      <p>Processing AniList authentication...</p>
    </div>
  );
};

export default AniListCallback; 