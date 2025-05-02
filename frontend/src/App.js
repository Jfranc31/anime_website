import './App.css';
import './index.css';
import React, { useEffect } from 'react';
import Profile from './pages/Profile';
import LoginPage from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Animes from './pages/Animes';
import Mangas from './pages/Mangas';
import Characters from './pages/Characters';
import AddSection from './pages/Add';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { UserProvider, useUser } from './Context/ContextApi';
import AnimeDetails from './Components/Details/AnimeDetails';
import MangaDetails from './Components/Details/MangaDetails';
import CharacterDetails from './Components/Details/CharacterDetails';
import { UpdateAnime } from './Components/Updates/UpdateAnime.js';
import { UpdateManga } from './Components/Updates/UpdateManga';
import { UpdateCharacter } from './Components/Updates/UpdateCharacter';
import Navbar from './Components/Navbars/Navbar';
import Footer from './Components/Navbars/Footer';
import { AnimeProvider } from './Context/AnimeContext';
import { MangaProvider } from './Context/MangaContext';
import { CharacterProvider } from './Context/CharacterContext';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './Context/ThemeContext';
import './themes.module.css';
import UserManagement from './Components/Admin/UserManagement';
import Settings from './pages/Settings';
import Loader from './constants/Loader.js';
import AniListCallback from './Components/AniListCallback';
import { SeriesProvider } from './Context/SeriesContext';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const { userData, isLoading } = useUser();

  if (isLoading) {
    return <div><Loader/></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/animes" element={<Animes />} />
      <Route path="/mangas" element={<Mangas />} />
      <Route path="/characters" element={<Characters />} />
      <Route path="/anime/:id" element={<AnimeDetails />} />
      <Route path="/manga/:id" element={<MangaDetails />} />
      <Route path="/characters/:id" element={<CharacterDetails />} />
      <Route path="/auth/anilist/callback" element={<AniListCallback />} />
      <Route
        path="/"
        element={userData && userData._id ? <Home /> : <Navigate to="/login" />}
      />
      <Route
        path="/profile/*"
        element={userData && userData._id ? <Profile /> : <Navigate to="/login" />}
      />
      <Route
        path="/add/*"
        element={userData && userData._id ? <AddSection /> : <Navigate to="/login" />}
      />
      <Route
        path="/anime/:id/update"
        element={
          userData && userData._id && userData.role === 'admin' ? (
            <UpdateAnime />
          ) : (
            <Navigate to="/animes" />
          )
        }
      />
      <Route
        path="/manga/:id/update"
        element={
          userData && userData._id && userData.role === 'admin' ? (
            <UpdateManga />
          ) : (
            <Navigate to="/mangas" />
          )
        }
      />
      <Route
        path="/characters/:id/update"
        element={
          userData && userData._id && userData.role === 'admin' ? (
            <UpdateCharacter />
          ) : (
            <Navigate to="/characters" />
          )
        }
      />
      <Route
        path="/admin/users"
        element={
          userData && userData.role === 'admin' ? (
            <UserManagement />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route path="/settings" element={userData?._id ? <Settings /> : <Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <UserProvider>
      <SeriesProvider>
        <Router>
          <ThemeProvider>
            <div className="App">
              <ScrollToTop />
              <Navbar />
              <AnimeProvider>
                <MangaProvider>
                  <CharacterProvider>
                    <AppRoutes />
                  </CharacterProvider>
                </MangaProvider>
              </AnimeProvider>
              <Footer />
            </div>
          </ThemeProvider>
        </Router>
      </SeriesProvider>
    </UserProvider>
  );
}

export default App;