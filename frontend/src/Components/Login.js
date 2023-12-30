import React, { useContext, useState } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import data from '../ContextApi'
import { useNavigate } from 'react-router-dom'

export const Login = () => {
    const [user, setUser] = useState({
        email: "",
        password: ""
    })
    const {setUserData} = useContext(data)
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser((preve) => {
            return {
                ...preve,
                [name]: value
            }
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post("http://localhost:8080/login", user, { withCredentials: true })
            .then((res) => {
                alert(res.data.message);

                // Set a cookie named 'userInfo' with user data
                Cookies.set('userInfo', JSON.stringify(res.data.user), { expires: 29 });

                setUserData(res.data.user);
                navigate("/");
            })
            .catch((error) => {
                console.error("Login error:", error);
                // Handle login error if needed
            });
    };

    // console.log(user)

    return (
        <div className='container'>
            <form onSubmit={handleSubmit}>
                <label htmlFor='email'>Email Id</label>
                <input type="email" id="email" name='email' value={user.email} onChange={handleChange} autoComplete="email" />

                <label htmlFor="password">Password</label>
                <input type="password" id="password" name='password' value={user.password} onChange={handleChange} autoComplete="current-password" />

                <div className='btn-container'>
                    <button className="btn" type='submit'>Login</button>
                    <button className="btn" onClick={()=>navigate("/register")}>Register</button>
                </div>
            </form>
        </div>
    )
}