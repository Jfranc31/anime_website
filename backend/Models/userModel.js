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

const UserModel = new mongoose.model("UserModel",userSchema)

export default UserModel;