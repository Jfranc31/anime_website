import './App.css';
import Profile from './Components/Profile';
import { Login } from './Components/Login';
import Register from './Components/Register';
import Home from './Components/Home';
import AddAnime from './Components/AddAnime';
import "./Components/style.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import data from './ContextApi';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Browse from './Components/Browse';
import AnimeDetails from './Components/AnimeDetails';


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
            <Route path="/browse" element={<Browse />} />
            <Route path="/addanime" element={<AddAnime />} />
            <Route path='/anime/:id' element={<AnimeDetails />}/>
          </Routes>
        </Router>
      </data.Provider>

    </div>
  );
}

export default App;
