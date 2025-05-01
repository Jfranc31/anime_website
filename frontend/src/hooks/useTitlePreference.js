import { useState, useEffect } from 'react';

export const useTitlePreference = () => {
  const [titlePreference, setTitlePreference] = useState(() => {
    // First try to get from localStorage
    const prefsString = localStorage.getItem('userPreferences');
    if (prefsString) {
      const prefs = JSON.parse(prefsString);
      if (prefs.titleLanguage) {
        return prefs.titleLanguage;
      }
    }
    return 'english'; // Default to english if no preference found
  });

  useEffect(() => {
    // Update localStorage whenever preference changes
    const prefsString = localStorage.getItem('userPreferences');
    const prefs = prefsString ? JSON.parse(prefsString) : {};
    prefs.titleLanguage = titlePreference;
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
  }, [titlePreference]);

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