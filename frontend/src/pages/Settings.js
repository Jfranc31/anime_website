import React, { useContext, useState, useCallback, useEffect } from 'react';
import settingsStyles from '../styles/pages/Settings.module.css';
import data from '../Context/ContextApi';
import { useAnimeContext } from '../Context/AnimeContext';
import { useMangaContext } from '../Context/MangaContext';
import { fetchWithErrorHandling } from '../utils/apiUtils';
import { useTheme } from '../Context/ThemeContext';
import AvatarUpload from '../Context/AvatarUpload';
import axios from 'axios';
import Cookies from 'js-cookie';

const Settings = () => {
  const { userData, setUserData } = useContext(data);
  const { animeList } = useAnimeContext();
  const { mangaList } = useMangaContext();
  const [userAnimeList, setUserAnimeList] = useState([]);
  const [userMangaList, setUserMangaList] = useState([]);
  const [activeTab, setActiveTab] =useState('Profile');
  const { theme, setTheme } = useTheme();
  const [anilistData, setAnilistData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState({
    isLoading: false,
    progress: {
      anime: { added: 0, updated: 0, skipped: 0 },
      manga: { added: 0, updated: 0, skipped: 0 }
    },
    error: null
  });

  const fetchUserList = useCallback(async () => {
      if (!userData?._id) return;
  
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchWithErrorHandling(`/users/${userData._id}/current`);
        setUserAnimeList(response.animes);
        setUserMangaList(response.mangas);
      } catch (err) {
        setError('Failed to load user list. Please try again later.');
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
  }, [userData?._id, animeList, fetchUserList]);

  const handleThemeChange = async (newTheme) => {
    try {
      const userInfo = Cookies.get('userInfo');
      if (!userInfo) {
        throw new Error('No authentication token found');
      }

      await axios.put(`/users/${userData._id}/theme`,
        { theme: newTheme },
        {
          headers: {
            'Authorization': `Bearer ${JSON.parse(userInfo)._id}`
          }
        }
      );

      // Update theme in context
      setTheme(newTheme);

      // Update theme in cookie
      const parsedUserInfo = JSON.parse(userInfo);
      parsedUserInfo.theme = newTheme;
      Cookies.set('userInfo', JSON.stringify(parsedUserInfo));

      // Update theme in userData context
      setUserData({...userData, theme: newTheme});

    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleLanguageChange = async (type, value) => {
    try {
      const userInfo = Cookies.get('userInfo');
      if (!userInfo) {
        throw new Error('No authentication token found');
      }

      // Update the user settings in the backend
      await axios.put(`/users/${userData._id}/${type}`, {
        [type]: value,
      }, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(userInfo)._id}`
        }
      });

      // Update userData context
      const updatedUserData = { ...userData, [type]: value };
      setUserData(updatedUserData);

      // Update the userInfo cookie
      const parsedUserInfo = JSON.parse(userInfo);
      parsedUserInfo[type] = value; // Update the specific language setting
      Cookies.set('userInfo', JSON.stringify(parsedUserInfo));

    } catch (error) {
      console.error('Error updating language settings:', error);
    }
  };

  const handleAniListConnect = async () => {
    try {
      const response = await axios.get('/users/anilist/auth');
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
        if (event.origin === 'http://localhost:3000' && event.data.code) {
          // Remove the event listener immediately to prevent duplicate handling
          window.removeEventListener('message', messageHandler);
          
          try {
            const response = await axios.post('/users/anilist/callback', {
              code: event.data.code,
              userId: userData._id
            }, {
              headers: {
                'Authorization': `Bearer ${JSON.parse(Cookies.get('userInfo'))._id}`
              }
            });

            if (response.data.success) {
              setUserData(response.data.user);
              const userInfo = JSON.parse(Cookies.get('userInfo'));
              userInfo.anilist = response.data.user.anilist;
              Cookies.set('userInfo', JSON.stringify(userInfo));
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
      const response = await axios.post(`/users/${userData._id}/anilist/disconnect`, {}, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(Cookies.get('userInfo'))._id}`
        }
      });
      
      if (response.data.success) {
        setUserData(response.data.user);
        // Update userInfo cookie
        const userInfo = JSON.parse(Cookies.get('userInfo'));
        userInfo.anilist = response.data.user.anilist;
        Cookies.set('userInfo', JSON.stringify(userInfo));
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

      const response = await axios.post(`/users/${userData._id}/anilist/sync`, {}, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(Cookies.get('userInfo'))._id}`
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

  const fetchAniListData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `/users/${userData._id}/anilist/lists`,
        {
          headers: {
            'Authorization': `Bearer ${JSON.parse(Cookies.get('userInfo'))._id}`
          }
        }
      );

      if (response.data.success) {
        setAnilistData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching AniList data:', error);
      alert('Failed to fetch AniList data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
    console.log('Delete button clicked');
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsLoading(true);
      const response = await axios.delete(
        `/users/${userData._id}/lists`,
        {
          headers: {
            'Authorization': `Bearer ${JSON.parse(Cookies.get('userInfo'))._id}`
          }
        }
      );

      if (response.data.success) {
        alert('Successfully deleted all entries from your lists');
        setUserData({
          ...userData,
          animeList: [],
          mangaList: []
        });
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
              {!syncStatus.isLoading && syncStatus.progress.anime.added + 
                syncStatus.progress.anime.updated + 
                syncStatus.progress.manga.added + 
                syncStatus.progress.manga.updated > 0 && (
                <div className={settingsStyles.syncResults}>
                  <h4>Sync Results:</h4>
                  <div className={settingsStyles.syncStats}>
                    <div>
                      <h5>Anime:</h5>
                      <p>Added: {syncStatus.progress.anime.added.length}</p>
                      <p>Updated: {syncStatus.progress.anime.updated.length}</p>
                      <p>Skipped: {syncStatus.progress.anime.skipped.length}</p>
                    </div>
                    <div>
                      <h5>Manga:</h5>
                      <p>Added: {syncStatus.progress.manga.added.length}</p>
                      <p>Updated: {syncStatus.progress.manga.updated.length}</p>
                      <p>Skipped: {syncStatus.progress.manga.skipped.length}</p>
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
          value={userData.title}
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
          value={userData.characterName}
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
