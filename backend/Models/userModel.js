// /models/userModel.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firstName : String,
    lastName : String,
    email : {
        type: String,
        required :true,
        unique : true,
    },
    password : String
})

const UserModel = new mongoose.model("UserModel",userSchema)

export default UserModel;