import './App.css';
import Profile from './pages/Profile';
import { Login } from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AddAnime from './pages/AddAnime';
import AddManga from './pages/AddManga';
import Animes from './pages/Animes';
import Mangas from './pages/Mangas';
import Characters from './pages/Characters';
import "./Components/style.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import data from './Context/ContextApi';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import AnimeDetails from './Components/Details/AnimeDetails';
import MangaDetails from './Components/Details/MangaDetails';
import CharacterDetails from './Components/Details/CharacterDetails';
import { UpdateAnime } from './Components/Updates/UpdateAnime';
import { UpdateManga } from './Components/Updates/UpdateManga';
import { UpdateCharacter } from './Components/Updates/UpdateCharacter';

function App() {
  const [userData, setUserData] = useState({});

    useEffect(() => {
        axios.defaults.baseURL = 'http://localhost:8080';

        // Check if the user is authenticated using the cookie
        const storedUserData = Cookies.get('userInfo');
        if (storedUserData) {
            setUserData(JSON.parse(storedUserData));
        }
    }, []);
  
  return (
    <div className="App">
      <data.Provider value={{userData,setUserData}}>
        <Router>
          <Routes>
            <Route path="/"
              element={userData && userData._id ? <Home /> : <Login/>}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path='/profile' element={userData && userData._id ? <Profile /> : <Login/>}/>
            <Route path="/animes" element={<Animes />} />
            <Route path="/mangas" element={<Mangas />} />
            <Route path='/characters' element={<Characters />} />
            <Route path="/addanime" element={<AddAnime />} />
            <Route path='/anime/:id' element={<AnimeDetails />}/>
            <Route path='/anime/:id/update' element={<UpdateAnime />}/>
            <Route path='/addmanga' element={<AddManga />}/>
            <Route path='/manga/:id' element={<MangaDetails />}/>
            <Route path='/manga/:id/update' element={<UpdateManga />}/>
            <Route path='/characters/:id' element={<CharacterDetails />}/>
            <Route path='/characters/:id/update' element={<UpdateCharacter />}/>
          </Routes>
        </Router>
      </data.Provider>

    </div>
  );
}

export default App;
