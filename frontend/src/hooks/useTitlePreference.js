import { useState, useEffect } from 'react';
import { useUser } from '../Context/ContextApi';

export const useTitlePreference = () => {
  const { userData } = useUser();
  const [titlePreference, setTitlePreference] = useState(() => {
    // First try to get from localStorage
    const prefsString = localStorage.getItem('userPreferences');
    if (prefsString) {
      const prefs = JSON.parse(prefsString);
      if (prefs.titleLanguage) {
        return prefs.titleLanguage;
      }
    }
    // If not in localStorage, try to get from user data
    if (userData?.title) {
      return userData.title;
    }
    return 'english'; // Default to english if no preference found
  });

  // Update localStorage whenever preference changes
  useEffect(() => {
    const prefsString = localStorage.getItem('userPreferences');
    const prefs = prefsString ? JSON.parse(prefsString) : {};
    prefs.titleLanguage = titlePreference;
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
  }, [titlePreference]);

  // Update preference when user data changes
  useEffect(() => {
    if (userData?.title && userData.title !== titlePreference) {
      setTitlePreference(userData.title);
    }
  }, [userData?.title]);

  const getTitle = (titles) => {
    if (!titles) return 'Unknown Title';
    switch (titlePreference) {
      case 'english':
        return titles.english || titles.romaji || titles.native || 'Unknown Title';
      case 'romaji':
        return titles.romaji || titles.english || titles.native || 'Unknown Title';
      case 'native':
        return titles.native || titles.romaji || titles.english || 'Unknown Title';
      default:
        return titles.english || titles.romaji || titles.native || 'Unknown Title';
    }
  };

  return {
    titlePreference,
    setTitlePreference,
    getTitle
  };
}; 