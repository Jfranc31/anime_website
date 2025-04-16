import React from 'react';
import { useAnime } from '../Context/AnimeContext';
import { useManga } from '../Context/MangaContext';

const OverviewProfile = () => {
  const { animeList, loading: animeLoading } = useAnime();
  const { mangaList, loading: mangaLoading } = useManga();

  // Calculate statistics
  const totalAnime = animeList?.length || 0;
  const totalManga = mangaList?.length || 0;
  const completedAnime = animeList?.filter(anime => anime.status === 'completed')?.length || 0;
  const completedManga = mangaList?.filter(manga => manga.status === 'completed')?.length || 0;
  const watchingAnime = animeList?.filter(anime => anime.status === 'watching')?.length || 0;
  const readingManga = mangaList?.filter(manga => manga.status === 'reading')?.length || 0;

  if (animeLoading || mangaLoading) {
    return <div>Loading profile data...</div>;
  }

  return (
    <div className="overview-profile">
      <h2>Profile Overview</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Anime</h3>
          <p>Total: {totalAnime}</p>
          <p>Completed: {completedAnime}</p>
          <p>Watching: {watchingAnime}</p>
        </div>
        <div className="stat-card">
          <h3>Manga</h3>
          <p>Total: {totalManga}</p>
          <p>Completed: {completedManga}</p>
          <p>Reading: {readingManga}</p>
        </div>
      </div>
    </div>
  );
};

export default OverviewProfile; 