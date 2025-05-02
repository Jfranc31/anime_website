import React from 'react';
import profileStyles from '../styles/pages/Profile.module.css';
import { useUser } from '../Context/ContextApi';
import { useSeries } from '../Context/SeriesContext';
import ProfileNavigation from '../Components/Navbars/ProfileNavbar';
import '../styles/components/add_navbar.module.css';
import AnimeProfile from './AnimeProfile';
import MangaProfile from './MangaProfile';
import Stats from './StatsProfile';
import Overview from './OverviewProfile';
import { Routes, Route, Navigate } from 'react-router-dom'
import AnimeCard from '../Components/AnimeCard';
import MangaCard from '../Components/MangaCard';

const Profile = () => {
  const { userData } = useUser();
  const { animes, mangas, loading } = useSeries();

  // Filter animes and mangas based on user status
  const watchingAnimes = animes.filter(anime => 
    userData?.animeStatuses?.[anime._id] === 'Watching'
  );
  const completedAnimes = animes.filter(anime => 
    userData?.animeStatuses?.[anime._id] === 'Completed'
  );
  const readingMangas = mangas.filter(manga => 
    userData?.mangaStatuses?.[manga._id] === 'Reading'
  );
  const completedMangas = mangas.filter(manga => 
    userData?.mangaStatuses?.[manga._id] === 'Completed'
  );

  if (loading.animes || loading.mangas) {
    return <div>Loading...</div>;
  }

  return (
    <div className="add-page">
      <ProfileNavigation />
      <div className="add-content">
        <Routes>
          <Route path="/" element={<Navigate to="overview" />} />
          <Route path="overview" element={<Overview />} />
          <Route path="animeProfile" element={<AnimeProfile />} />
          <Route path="mangaProfile" element={<MangaProfile />} />
          <Route path="stats" element={<Stats />} />
        </Routes>
        <div className={profileStyles.section}>
          <h2>Currently Watching</h2>
          <div className={profileStyles.grid}>
            {watchingAnimes.map(anime => (
              <AnimeCard
                key={anime._id}
                anime={anime}
                title={getTitle(anime.titles)}
                userStatus={userData?.animeStatuses?.[anime._id]}
              />
            ))}
          </div>
        </div>
        <div className={profileStyles.section}>
          <h2>Completed Animes</h2>
          <div className={profileStyles.grid}>
            {completedAnimes.map(anime => (
              <AnimeCard
                key={anime._id}
                anime={anime}
                title={getTitle(anime.titles)}
                userStatus={userData?.animeStatuses?.[anime._id]}
              />
            ))}
          </div>
        </div>
        <div className={profileStyles.section}>
          <h2>Currently Reading</h2>
          <div className={profileStyles.grid}>
            {readingMangas.map(manga => (
              <MangaCard
                key={manga._id}
                manga={manga}
                title={getTitle(manga.titles)}
                userStatus={userData?.mangaStatuses?.[manga._id]}
              />
            ))}
          </div>
        </div>
        <div className={profileStyles.section}>
          <h2>Completed Mangas</h2>
          <div className={profileStyles.grid}>
            {completedMangas.map(manga => (
              <MangaCard
                key={manga._id}
                manga={manga}
                title={getTitle(manga.titles)}
                userStatus={userData?.mangaStatuses?.[manga._id]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;