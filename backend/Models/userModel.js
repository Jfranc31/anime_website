/**
 * /models/userModel.js
 * Description: Mongoose model for the 'UserModel' collection in MongoDB.
 */

import mongoose from "mongoose";

// Defining the schema for the 'UserModel' collection
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: String,
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  animes: [
    {
      animeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AnimeModel",
      },
      status: {
        type: String,
        enum: ["Watching", "Completed", "Planning"],
      },
      currentEpisode: Number,
      activityTimestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  mangas: [
    {
      mangaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MangaModel",
        required: true
      },
      status: {
        type: String,
        enum: ["Reading", "Completed", "Planning"],
        default: "Planning"
      },
      currentChapter: {
        type: Number,
        default: 0
      },
      currentVolume: {
        type: Number,
        default: 0
      },
      activityTimestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  username: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: '/public/default-avatar.png',
  },
});

// Creating the 'UserModel' using the schema
const UserModel = new mongoose.model("UserModel", userSchema);

export default UserModel;
