import React ,{useState}from 'react'
import axios from "axios"
import { useNavigate } from 'react-router-dom'


const Register = () => {
    const [user,setUser] = useState({
        firstName : "",
        lastName : "",
        email : "",
        password : "",
        repassword: ""
    })
    const navigate = useNavigate()

const handleChange = (e)=>{
    const { name , value} = e.target;
    setUser((preve)=>{
        return{
            ...preve,
            [name] : value
        }
    })
}

const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, password, repassword } = user;
    if (firstName && lastName && email && password) {
        if (password === repassword) {
            try {
                const response = await axios.post('http://localhost:3000/register', user);
                alert(response.data.message);
                navigate('/login');
            } catch (error) {
                console.error('Registration error:', error);
                alert('Error during registration. Please try again.');
            }
        } else {
            alert('Check Your Password');
        }
    } else {
        alert('Enter the Required Fields');
    }
};
  return (
    <div className='container'>
        <form onSubmit={handleSubmit}>
            <label htmlFor='firstname'>First Name</label>
            <input type="text" id="firstname" onChange={handleChange} name="firstName" value={user.firstName}/>

            <label htmlFor='lastname'>Last Name</label>
            <input type="text" id="lastname" onChange={handleChange} name="lastName" value={user.lastName}/>

            <label htmlFor='email'>Email Id</label>
            <input type="email" id="email"  name='email' value={user.email} onChange={handleChange}/>

            <label htmlFor="password">Password</label>
            <input type="password" id="password" name='password' value={user.password} onChange={handleChange}/>
            
            <label htmlFor="re-password">Re-Password</label>
            <input type="password" id="re-password" name='repassword' value={user.repassword} onChange={handleChange}/>

            <button className="btn" type='submit'>Register</button>

            <button className="btn" onClick={()=>navigate("/login")}>login</button>
        </form>
    </div>
  )
}

export default Register