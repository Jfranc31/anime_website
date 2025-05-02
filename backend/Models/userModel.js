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
    fileId: mongoose.Schema.Types.ObjectId,
    filename: String,
    uploadDate: Date
  },
  title: {
    type: String,
    enum: ['romaji', 'english', 'native'],
    default: 'english',
  },
  characterName: {
    type: String,
    enum: ['romaji-western', 'romaji', 'native'],
    default: 'romaji-western',
  },
  anilist: {
    connected: {
      type: Boolean,
      default: false
    },
    userId: {
      type: Number
    },
    accessToken: {
      type: String
    },
    username: {
      type: String
    }
  }
});

// Remove any existing index on mangas.anilistId
userSchema.index({ 'mangas.anilistId': 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { 'mangas.anilistId': { $type: 'number' } }  // Only index non-null values
});

// Creating the 'UserModel' using the schema
const UserModel = new mongoose.model("UserModel", userSchema);

export default UserModel;
