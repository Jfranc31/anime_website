import React, { useState, useCallback, useEffect } from 'react';
import settingsStyles from '../styles/pages/Settings.module.css';
import { useUser } from '../Context/ContextApi';
import { useAnimeContext } from '../Context/AnimeContext';
import { useMangaContext } from '../Context/MangaContext';
import { fetchWithErrorHandling } from '../utils/apiUtils';
import { useTheme } from '../Context/ThemeContext';
import AvatarUpload from '../Context/AvatarUpload';
import axiosInstance from '../utils/axiosConfig';

const Settings = () => {
  const { userData, refreshUserData } = useUser();
  const { animeList } = useAnimeContext();
  const { mangaList } = useMangaContext();
  const [userAnimeList, setUserAnimeList] = useState([]);
  const [userMangaList, setUserMangaList] = useState([]);
  const [activeTab, setActiveTab] = useState('Profile');
  const { theme, setTheme } = useTheme();
  const [anilistData, setAnilistData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    isLoading: false,
    progress: {
      anime: { added: 0, updated: 0, skipped: 0 },
      manga: { added: 0, updated: 0, skipped: 0 }
    },
    error: null
  });

  // Function to update user preferences in localStorage
  const updateUserPreferences = (key, value) => {
    try {
      // Get current preferences from localStorage
      const prefsString = localStorage.getItem('userPreferences');
      const preferences = prefsString ? JSON.parse(prefsString) : {};
      
      // Update with new value
      preferences[key] = value;
      
      // Save back to localStorage
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      
      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  };

  const fetchUserList = useCallback(async () => {
    if (!userData?._id) return;

    try {
      setIsLoading(true);
      const response = await fetchWithErrorHandling(`/users/${userData._id}/current`);
      setUserAnimeList(response.animes);
      setUserMangaList(response.mangas);
    } catch (err) {
      console.error('Error fetching user list:', err);
      setUserAnimeList([]);
      setUserMangaList([]);
    } finally {
      setIsLoading(false);
    }
  }, [userData?._id]);

  useEffect(() => {
    if (userData?._id && animeList?.length && mangaList?.length) {
      fetchUserList();
    }
  }, [userData?._id, animeList, mangaList, fetchUserList]);

  const handleThemeChange = async (newTheme) => {
    try {
      // Update theme in backend
      await axiosInstance.put(`/users/${userData._id}/theme`,
        { theme: newTheme },
        {
          headers: {
            'Authorization': `Bearer ${userData._id}`
          }
        }
      );

      // Update theme in context
      setTheme(newTheme);

      // Update theme in localStorage
      updateUserPreferences('theme', newTheme);

      // Refresh user data
      refreshUserData();

    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleLanguageChange = async (type, value) => {
    try {
      // Update the user settings in the backend
      await axiosInstance.put(`/users/${userData._id}/${type}`, {
        [type]: value,
      }, {
        headers: {
          'Authorization': `Bearer ${userData._id}`
        }
      });

      // Refresh user data
      refreshUserData();

    } catch (error) {
      console.error(`Error updating ${type} setting:`, error);
    }
  };

  const handleAniListConnect = async () => {
    try {
      const response = await axiosInstance.get('/users/anilist/auth');
      const { url } = response.data;

      if (!url) {
        console.error('No authorization URL received');
        return;
      }

      const width = 600;
      const height = 800;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        url,
        'AniList Authentication',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      const messageHandler = async (event) => {
        if ((event.origin === window.location.origin || event.origin === 'http://localhost:3000') && event.data.code) {
          // Remove the event listener immediately to prevent duplicate handling
          window.removeEventListener('message', messageHandler);
          
          try {
            const response = await axiosInstance.post('/users/anilist/callback', {
              code: event.data.code,
              userId: userData._id
            }, {
              headers: {
                'Authorization': `Bearer ${userData._id}`
              }
            });

            if (response.data.success) {
              refreshUserData({...userData, anilist: response.data.user.anilist});
              popup.close();
            }
          } catch (error) {
            console.error('Error connecting to AniList:', error.response?.data || error);
            alert('Failed to connect to AniList. Please try again.');
            popup.close();
          }
        }
      };

      window.addEventListener('message', messageHandler);
    } catch (error) {
      console.error('Error initiating AniList connection:', error.response?.data || error);
      alert('Failed to initiate AniList connection. Please try again.');
    }
  };

  const handleAniListDisconnect = async () => {
    try {
      const response = await axiosInstance.post(`/users/${userData._id}/anilist/disconnect`, {}, {
        headers: {
          'Authorization': `Bearer ${userData._id}`
        }
      });
      
      if (response.data.success) {
        refreshUserData({...userData, anilist: response.data.user.anilist});
      }
    } catch (error) {
      console.error('Error disconnecting from AniList:', error);
    }
  };

  const handleAniListSync = async () => {
    try {
      setSyncStatus({
        isLoading: true,
        progress: {
          anime: { added: 0, updated: 0, skipped: 0 },
          manga: { added: 0, updated: 0, skipped: 0 }
        },
        error: null
      });

      const response = await axiosInstance.post(`/users/${userData._id}/anilist/sync`, {}, {
        headers: {
          'Authorization': `Bearer ${userData._id}`
        }
      });
      
      if (response.data.success) {
        setSyncStatus(prev => ({
          ...prev,
          isLoading: false,
          progress: response.data.data
        }));
        
        // Refresh user data after sync
        fetchUserList();
      }
    } catch (error) {
      console.error('Error syncing with AniList:', error);
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to sync with AniList'
      }));
    }
  };

  // const fetchAniListData = async () => {
  //   try {
  //     setIsLoading(true);
  //     const response = await axiosInstance.get(
  //       `/users/${userData._id}/anilist/lists`,
  //       {
  //         headers: {
  //           'Authorization': `Bearer ${userData._id}`
  //         }
  //       }
  //     );

  //     if (response.data.success) {
  //       setAnilistData(response.data.data);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching AniList data:', error);
  //     alert('Failed to fetch AniList data. Please try again.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const renderProfileSection = () => (
    <div className={settingsStyles.content}>
      <section className={settingsStyles.section}>
        <h2>Site Theme</h2>
        <div className={settingsStyles.themeButtons}>
          <button
            className={`${settingsStyles.themeButton} ${theme === 'light' ? settingsStyles.active : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            Default Theme
          </button>
          <button
            className={`${settingsStyles.themeButton} ${theme === 'dark' ? settingsStyles.active : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            Dark Theme
          </button>
        </div>
      </section>
      <section className={settingsStyles.section}>
        <h2>Avatar Upload</h2>
        <AvatarUpload userId={userData._id} />
      </section>
    </div>
  );

  const handleDeleteAllLists = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.delete(
        `/users/${userData._id}/lists`,
        {
          headers: {
            'Authorization': `Bearer ${userData._id}`
          }
        }
      );

      if (response.data.success) {
        alert('Successfully deleted all entries from your lists');
        refreshUserData({
          ...userData,
          animeList: [],
          mangaList: []
        });
        // Refresh lists
        setUserAnimeList([]);
        setUserMangaList([]);
      }
    } catch (error) {
      console.error('Error deleting lists:', error);
      alert('Failed to delete entries. Please try again.');
    } finally {
      setIsLoading(false);
      setShowConfirmModal(false);
    }
  };

  const renderAnimeMangaSection = () => (
    <div className={settingsStyles.content}>
      <section className={settingsStyles.section}>
        <h2>List Management</h2>
        <div className={settingsStyles.listManagement}>
          <div className={settingsStyles.listStats}>
            <p>Total Anime in your list: {userAnimeList?.length || 0}</p>
            <p>Total Manga in your list: {userMangaList?.length || 0}</p>
          </div>
          <button
            className={settingsStyles.deleteAllButton}
            onClick={handleDeleteAllLists}
            disabled={isLoading || (!userAnimeList?.length && !userMangaList?.length)}
          >
            {isLoading ? 'Deleting...' : 'Delete All Entries'}
          </button>
        </div>
      </section>

      <section className={settingsStyles.section}>
        <h2>AniList Integration</h2>
        <div className={settingsStyles.anilistSection}>
          {userData?.anilist?.connected ? (
            <div className={settingsStyles.anilistConnected}>
              <p>Connected as: {userData.anilist.username}</p>
              <div className={settingsStyles.anilistButtons}>
                <button
                  className={settingsStyles.fetchButton}
                  onClick={handleAniListSync}
                  disabled={syncStatus.isLoading}
                >
                  {syncStatus.isLoading ? 'Syncing...' : 'Fetch AniList Data'}
                </button>
                <button
                  className={settingsStyles.disconnectButton}
                  onClick={handleAniListDisconnect}
                  disabled={syncStatus.isLoading}
                >
                  Disconnect from AniList
                </button>
              </div>

              {/* Add sync status display */}
              {syncStatus.isLoading && (
                <div className={settingsStyles.syncStatus}>
                  <p>Syncing your lists...</p>
                </div>
              )}

              {/* Add sync results display */}
              {!syncStatus.isLoading && (
                <div className={settingsStyles.syncResults}>
                  <h4>Sync Results:</h4>
                  <div className={settingsStyles.syncStats}>
                    <div>
                      <h5>Anime:</h5>
                      <p>Added: {Array.isArray(syncStatus.progress.anime.added) ? 
                        syncStatus.progress.anime.added.length : 
                        syncStatus.progress.anime.added}</p>
                      <p>Updated: {Array.isArray(syncStatus.progress.anime.updated) ? 
                        syncStatus.progress.anime.updated.length : 
                        syncStatus.progress.anime.updated}</p>
                      <p>Skipped: {Array.isArray(syncStatus.progress.anime.skipped) ? 
                        syncStatus.progress.anime.skipped.length : 
                        syncStatus.progress.anime.skipped}</p>
                    </div>
                    <div>
                      <h5>Manga:</h5>
                      <p>Added: {Array.isArray(syncStatus.progress.manga.added) ? 
                        syncStatus.progress.manga.added.length : 
                        syncStatus.progress.manga.added}</p>
                      <p>Updated: {Array.isArray(syncStatus.progress.manga.updated) ? 
                        syncStatus.progress.manga.updated.length : 
                        syncStatus.progress.manga.updated}</p>
                      <p>Skipped: {Array.isArray(syncStatus.progress.manga.skipped) ? 
                        syncStatus.progress.manga.skipped.length : 
                        syncStatus.progress.manga.skipped}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Add sync error display */}
              {syncStatus.error && (
                <div className={settingsStyles.syncError}>
                  <p>{syncStatus.error}</p>
                </div>
              )}

              {anilistData && (
                <div className={settingsStyles.anilistData}>
                  <div className={settingsStyles.userInfo}>
                    {anilistData.username.avatar && (
                      <img 
                        src={anilistData.username.avatar.large} 
                        alt={anilistData.username.name}
                        className={settingsStyles.avatar}
                      />
                    )}
                    <h3>{anilistData.username.name}'s Lists</h3>
                    <p>Score Format: {anilistData.username.mediaListOptions.scoreFormat}</p>
                  </div>

                  <h3>Anime Lists</h3>
                  {anilistData.animeLists.map(list => (
                    <div key={list.name} className={settingsStyles.list}>
                      <h4>{list.name} ({list.entries.length})</h4>
                      <ul>
                        {list.entries.slice(0, 5).map(entry => (
                          <li key={entry.id} className={settingsStyles.listItem}>
                            <div className={settingsStyles.mediaTitle}>
                              {entry.media.title.userPreferred}
                            </div>
                            <div className={settingsStyles.mediaInfo}>
                              {entry.progress > 0 && 
                                <span>Progress: {entry.progress}/{entry.media.episodes || '?'}</span>
                              }
                              {entry.score > 0 && 
                                <span>Score: {entry.score}</span>
                              }
                              {entry.updatedAt && 
                                <span>Updated: {new Date(entry.updatedAt * 1000).toLocaleDateString()}</span>
                              }
                            </div>
                          </li>
                        ))}
                        {list.entries.length > 5 && (
                          <li className={settingsStyles.moreItems}>
                            ... and {list.entries.length - 5} more
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}

                  <h3>Manga Lists</h3>
                  {anilistData.mangaLists.map(list => (
                    <div key={list.name} className={settingsStyles.list}>
                      <h4>{list.name} ({list.entries.length})</h4>
                      <ul>
                        {list.entries.slice(0, 5).map(entry => (
                          <li key={entry.id} className={settingsStyles.listItem}>
                            <div className={settingsStyles.mediaTitle}>
                              {entry.media.title.userPreferred}
                            </div>
                            <div className={settingsStyles.mediaInfo}>
                              {entry.progress > 0 && 
                                <span>Ch: {entry.progress}/{entry.media.chapters || '?'}</span>
                              }
                              {entry.progressVolumes > 0 && 
                                <span>Vol: {entry.progressVolumes}/{entry.media.volumes || '?'}</span>
                              }
                              {entry.score > 0 && 
                                <span>Score: {entry.score}</span>
                              }
                              {entry.updatedAt && 
                                <span>Updated: {new Date(entry.updatedAt * 1000).toLocaleDateString()}</span>
                              }
                            </div>
                          </li>
                        ))}
                        {list.entries.length > 5 && (
                          <li className={settingsStyles.moreItems}>
                            ... and {list.entries.length - 5} more
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={settingsStyles.anilistDisconnected}>
              <p>Not connected to AniList</p>
              <button
                className={settingsStyles.connectButton}
                onClick={handleAniListConnect}
              >
                Connect to AniList
              </button>
            </div>
          )}
        </div>
      </section>

      <section className={settingsStyles.section}>
        <h2>Titles</h2>
        <select
          value={userData.title || 'romaji'}
          onChange={(e) => handleLanguageChange('title', e.target.value)}
        >
          <option value="romaji">Romaji (Shingeki no Kyojin)</option>
          <option value="english">English (Attack on Titan)</option>
          <option value="native">Native (進撃の巨人)</option>
        </select>
      </section>

      <section className={settingsStyles.section}>
        <h2>Character Names</h2>
        <select
          value={userData.characterName || 'romaji-western'}
          onChange={(e) => handleLanguageChange('characterName', e.target.value)}
        >
          <option value="romaji-western">Romaji, Western Order (Killua Zoldyck)</option>
          <option value="romaji">Romaji (Zoldyck Killua)</option>
          <option value="native">Native (キルア＝ゾルディック)</option>
        </select>
      </section>
    </div>
  );

  return (
    <div className={settingsStyles.settingsPage}>
      <div className={settingsStyles.sidebar}>
        <h3>Settings</h3>
        <nav>
          <ul>
            <li className={activeTab === 'Profile' ? settingsStyles.active : ''} onClick={() => handleTabChange('Profile')}>Profile</li>
            <li className={activeTab === 'Account' ? settingsStyles.active : ''} onClick={() => handleTabChange('Account')}>Account</li>
            <li className={activeTab === 'Anime&Manga' ? settingsStyles.active : ''} onClick={() => handleTabChange('Anime&Manga')}>Anime & Manga</li>
          </ul>
        </nav>
      </div>

      {activeTab === 'Profile' && renderProfileSection()}
      {activeTab === 'Anime&Manga' && renderAnimeMangaSection()}

      {showConfirmModal && (
        <div className={settingsStyles.modalOverlay}>
          <div className={settingsStyles.modal}>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete ALL your anime and manga entries from your profile? This action cannot be undone!</p>
            <div className={settingsStyles.modalButtons}>
              <button 
                className={settingsStyles.cancelButton}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className={settingsStyles.confirmButton}
                onClick={handleConfirmDelete}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;