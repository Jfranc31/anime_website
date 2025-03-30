import './App.css';
import './index.css';
import Profile from './pages/Profile';
import { Login } from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Animes from './pages/Animes';
import Mangas from './pages/Mangas';
import Characters from './pages/Characters';
import AddSection from './pages/Add';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import data from './Context/ContextApi';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
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

function App() {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configure axios defaults
    axios.defaults.baseURL = 'http://localhost:8080';
    axios.defaults.withCredentials = true;
    axios.defaults.headers.common['Content-Type'] = 'application/json';

    // Check for existing cookie
    const storedUserData = Cookies.get('userInfo');
    if (storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData);
        setUserData(parsedUserData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        Cookies.remove('userInfo');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div><Loader/></div>;
  }

  return (
    <Router>
      <data.Provider value={{ userData, setUserData }}>
        <ThemeProvider>
          <div className="App">
            <ScrollToTop />
            <Navbar />
            <AnimeProvider>
              <MangaProvider>
                <CharacterProvider>
                  <Routes>
                    <Route path="/login" element={<Login />} />
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
                      element={userData && userData._id ? <Home /> : <Login />}
                    />
                    <Route
                      path="/profile/*"
                      element={userData && userData._id ? <Profile /> : <Login />}
                    />
                    <Route
                      path="/add/*"
                      element={userData && userData._id ? <AddSection /> : <Login />}
                    />
                    <Route
                      path="/anime/:id"
                      element={userData && userData._id ? <AnimeDetails /> : <Animes />}
                    />
                    <Route
                      path="/manga/:id"
                      element={userData && userData._id ? <MangaDetails /> : <Mangas />}
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
                </CharacterProvider>
              </MangaProvider>
            </AnimeProvider>
            <Footer />
          </div>
        </ThemeProvider>
      </data.Provider>
    </Router>
  );
}

export default App;
