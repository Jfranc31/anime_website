/**
 * /models/userModel.js
 * Description: Mongoose model for the 'UserModel' collection in MongoDB.
 */

import mongoose from 'mongoose';

// Defining the schema for the 'UserModel' collection
const userSchema = new mongoose.Schema({
    firstName : String,
    lastName : String,
    email : {
        type: String,
        required :true,
        unique : true,
    },
    password : String,
    animes: [
        {
            animeId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AnimeModel'
            },
            status: {
                type: String,
                enum: ["Watching", "Completed", "Planning"]
            },
            currentEpisode: Number,
            activityTimestamp: {
                type: Date,
                default: Date.now,
            },
        }
    ],
    mangas: [{
        mangaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MangaModel'
        },
        status: {
            type: String,
            enum: ["Reading", "Completed", "Planning"]
        },
        currentChapter: Number,
        currentVolume: Number,
        activityTimestamp: {
            type: Date,
            default: Date.now,
        },
    }],
})

// Creating the 'UserModel' using the schema
const UserModel = new mongoose.model("UserModel",userSchema)

export default UserModel;