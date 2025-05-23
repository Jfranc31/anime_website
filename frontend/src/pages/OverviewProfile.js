import React, { useState, useEffect, useContext } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useUser } from '../Context/ContextApi';
import { useAnimeContext } from '../Context/AnimeContext';
import { useMangaContext } from '../Context/MangaContext';
import { useCharacterContext } from '../Context/CharacterContext';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/pages/OverviewProfile.module.css';
import { FaUser } from 'react-icons/fa';
import { FaStar } from 'react-icons/fa';
import { FaBook } from 'react-icons/fa';
import { FaTv } from 'react-icons/fa';
import { FaUsers } from 'react-icons/fa';
import { FaHistory } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const OverviewProfile = () => {
  const { userData } = useUser();
  const { animeList } = useAnimeContext();
  const { mangaList } = useMangaContext();
  const { characterList } = useCharacterContext();
  const navigate = useNavigate();

  const [overview, setOverview] = useState({
    recentActivity: [],
    topAnime: [],
    topManga: [],
    stats: {
      totalAnime: 0,
      totalManga: 0,
      totalCharacters: 0,
      averageAnimeScore: 0,
      averageMangaScore: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userData?._id) {
      setError('User data not available');
      setLoading(false);
      return;
    }

    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user data
        const userResponse = await axiosInstance.get(`/users/${userData._id}/current`);
        const user = userResponse.data;
        const lists = user.lists || {};
        // Combine anime and manga lists
        const animeList = [
          ...(lists.watchingAnime || []).map(item => ({...item, status: 'watching'})),
          ...(lists.completedAnime || []).map(item => ({...item, status: 'completed'})),
          ...(lists.planningAnime || []).map(item => ({...item, status: 'planning'})),
        ];
        const mangaList = [
          ...(lists.readingManga || []).map(item => ({...item, status: 'reading'})),
          ...(lists.completedManga || []).map(item => ({...item, status: 'completed'})),
          ...(lists.planningManga || []).map(item => ({...item, status: 'planning'})),
        ];

        // Calculate overview data
        const recentAnimeActivity = animeList
          ?.filter(anime => anime.status === 'completed' || anime.status === 'watching')
          .map(anime => ({
            type: 'anime',
            title: anime.animeId?.titles?.english || anime.animeId?.titles?.romaji || anime.animeId?.titles?.native || '',
            status: anime.status,
            score: anime.score,
            updatedAt: anime.updatedAt || anime.lastUpdated
          })) || [];

        const recentMangaActivity = mangaList
          ?.filter(manga => manga.status === 'completed' || manga.status === 'reading')
          .map(manga => ({
            type: 'manga',
            title: manga.mangaId?.titles?.english || manga.mangaId?.titles?.romaji || manga.mangaId?.titles?.native || '',
            status: manga.status,
            score: manga.score,
            updatedAt: manga.updatedAt || manga.lastUpdated
          })) || [];

        const recentActivity = [...recentAnimeActivity, ...recentMangaActivity]
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 10);

        const topAnime = animeList
          ?.filter(anime => anime.status === 'completed' && anime.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map(anime => ({
            title: anime.animeId?.titles?.english || anime.animeId?.titles?.romaji || anime.animeId?.titles?.native || '',
            score: anime.score
          })) || [];

        const topManga = mangaList
          ?.filter(manga => manga.status === 'completed' && manga.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map(manga => ({
            title: manga.mangaId?.titles?.english || manga.mangaId?.titles?.romaji || manga.mangaId?.titles?.native || '',
            score: manga.score
          })) || [];

        const stats = {
          totalAnime: animeList?.length || 0,
          totalManga: mangaList?.length || 0,
          totalCharacters: characterList?.length || 0,
          averageAnimeScore: animeList?.length 
            ? animeList.reduce((acc, anime) => acc + (anime.score || 0), 0) / animeList.length
            : 0,
          averageMangaScore: mangaList?.length
            ? mangaList.reduce((acc, manga) => acc + (manga.score || 0), 0) / mangaList.length
            : 0
        };

        setOverview({
          recentActivity,
          topAnime,
          topManga,
          stats
        });
      } catch (err) {
        console.error('Error fetching overview:', err);
        setError('Failed to fetch overview data');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [userData?._id, characterList]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.overviewContainer}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.statsSection}
      >
        <h2 className={styles.sectionTitle}>Statistics</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <FaTv className={styles.statIcon} />
            <h3>Total Anime</h3>
            <p>{overview.stats.totalAnime}</p>
          </div>
          <div className={styles.statCard}>
            <FaBook className={styles.statIcon} />
            <h3>Total Manga</h3>
            <p>{overview.stats.totalManga}</p>
          </div>
          <div className={styles.statCard}>
            <FaUsers className={styles.statIcon} />
            <h3>Total Characters</h3>
            <p>{overview.stats.totalCharacters}</p>
          </div>
          <div className={styles.statCard}>
            <FaStar className={styles.statIcon} />
            <h3>Average Anime Score</h3>
            <p>{overview.stats.averageAnimeScore.toFixed(2)}</p>
          </div>
          <div className={styles.statCard}>
            <FaStar className={styles.statIcon} />
            <h3>Average Manga Score</h3>
            <p>{overview.stats.averageMangaScore.toFixed(2)}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={styles.activitySection}
      >
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        <div className={styles.activityList}>
          {overview.recentActivity.map((activity, index) => (
            <div key={index} className={styles.activityItem}>
              <div className={styles.activityIcon}>
                {activity.type === 'anime' ? <FaTv /> : <FaBook />}
              </div>
              <div className={styles.activityContent}>
                <h3>{activity.title}</h3>
                <p>Status: {activity.status}</p>
                <p>Score: {activity.score || 'N/A'}</p>
                <p>Updated: {format(new Date(activity.updatedAt), 'MMM d, yyyy')}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className={styles.topSection}
      >
        <h2 className={styles.sectionTitle}>Top Anime</h2>
        <div className={styles.topList}>
          {overview.topAnime.map((anime, index) => (
            <div key={index} className={styles.topItem}>
              <h3>{anime.title}</h3>
              <p>Score: {anime.score}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className={styles.topSection}
      >
        <h2 className={styles.sectionTitle}>Top Manga</h2>
        <div className={styles.topList}>
          {overview.topManga.map((manga, index) => (
            <div key={index} className={styles.topItem}>
              <h3>{manga.title}</h3>
              <p>Score: {manga.score}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default OverviewProfile;