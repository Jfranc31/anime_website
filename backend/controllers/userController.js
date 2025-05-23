/**
 * /controllers/userController.js
 * Description: Controller for handling user-related operations.
 */

import UserModel from "../Models/userModel.js";
import AnimeModel from "../Models/animeModel.js";
import MangaModel from "../Models/mangaModel.js";
import bcrypt from "bcrypt";
import { syncAniListData } from '../services/anilistAuthService.js';
import mongoose from 'mongoose';
import path from 'path';
import UserList from "../Models/UserList.js";
const { ObjectId } = mongoose.Types;

// Initialize GridFS stream
let gfs;
mongoose.connection.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'avatars'
  });
});

/**
 * @function registerUser
 * @description Register a new user by hashing the password before saving to the database.
 * @param {Object} req - Express request object with user data.
 * @param {Object} res - Express response object.
 * @return {Object} - Success or error message.
 */
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const lowercaseEmail = email.toLowerCase();
    const user = await UserModel.findOne({ email: { $regex: new RegExp(`^${lowercaseEmail}$`, 'i') } });

    if (user) {
      return res.status(400).send({ message: "This email is already registered" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new UserModel({
      username,
      email: lowercaseEmail,
      password: hashedPassword,
      role: 'user'
    });

    await newUser.save();
    res.status(201).send({ message: "Successfully registered" });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).send({ message: "Internal Server Error", error: error.message });
  }
};

/**
 * @function loginUser
 * @description Log in a user by comparing the provided password with the hashed password in the database.
 * @param {Object} req - Express request object with login credentials.
 * @param {Object} res - Express response object.
 * @return {Object} - Success or error message along with user information.
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const lowercaseEmail = email.toLowerCase();
    const user = await UserModel.findOne({ email: { $regex: new RegExp(`^${lowercaseEmail}$`, 'i') } });

    if (!user) {
      return res.status(404).json({ message: "This email is not registered" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      const userForCookie = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        theme: user.theme,
        avatar: user.avatar,
        title: user.title,
        CharacterName: user.CharacterName,
      };

      res.cookie("userInfo", JSON.stringify(userForCookie), {
        maxAge: 29 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'None',
        path: "/",
        partitioned: true,
      });

      return res.status(200).json({ message: "Login Successful", user });
    } else {
      return res.status(401).json({ message: "Password didn't match" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @function getUserInfo
 * @description Get information about a specific user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @return {Object} - User document with only necessary fields.
 */
const getUserInfo = async (req, res) => {
  try {
    const userID = req.params.userId;
    const user = await UserModel.findById(userID).select('username email role theme avatar title CharacterName anilist');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's lists and populate anime/manga details
    const userList = await UserList.findOne({ userId: userID })
      .populate('watchingAnime.animeId')
      .populate('completedAnime.animeId')
      .populate('planningAnime.animeId')
      .populate('readingManga.mangaId')
      .populate('completedManga.mangaId')
      .populate('planningManga.mangaId');
    
    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    res.json({ 
      ...user.toObject(), 
      lists: userList || {
        watchingAnime: [],
        completedAnime: [],
        planningAnime: [],
        readingManga: [],
        completedManga: [],
        planningManga: []
      }
    });
  } catch (error) {
    console.error("Error fetching user for page: ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @function makeAdmin
 * @description Make another user an admin.
 * @param {Object} req - Express request object with user ID.
 * @param {Object} res - Express response object.
 * @returns {Object} - Success or error message.
 */
const makeAdmin = async (req, res) => {
  const { userId } = req.params;

  try {
    // Only existing admins can make other users admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized: Only admins can perform this action" });
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User successfully made admin",
      user
    });
  } catch (error) {
    console.error('Error making user admin:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @function updateTheme
 * @description Change the theme the user wants to use.
 * @param {Object} req - Express request object with user ID and and new theme.
 * @param {Object} res - Express response object.
 * @returns {Object} - Success or error message.
 */
const updateTheme = async (req, res) => {
  const { userId } = req.params;
  const { theme } = req.body;

  try {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { theme },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @function getAllUsers
 * @description Get all the users to put on list.
 * @param {Object} req - Express request object with user ID.
 * @param {Object} res - Express response object.
 * @returns {Object} - User list or error message.
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({}, 'username email role');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * @function updateTitle
 * @description Change the title name the user wants to use.
 * @param {Object} req - Express request object with user ID and and new title name.
 * @param {Object} res - Express response object.
 * @returns {Object} - Success or error message.
*/
const updateTitle = async (req, res) => {
  const { userId } = req.params;
  const { title } = req.body;

  try {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { title },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error updating title name:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @function updateCharacterName
 * @description Change the character name the user wants to use.
 * @param {Object} req - Express request object with user ID and and new character name.
 * @param {Object} res - Express response object.
 * @returns {Object} - Success or error message.
*/
const updateCharacterName = async (req, res) => {
  const { userId } = req.params;
  const { characterName } = req.body;

  try {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { characterName },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error updating character name:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileSize = file.size;
    const fileType = file.mimetype;

    if (fileSize > 1024 * 1024 * 5) { // 5MB limit
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(fileType)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // If user already has an avatar, delete the old one
    if (user.avatar && user.avatar.fileId) {
      try {
        await gfs.delete(mongoose.Types.ObjectId(user.avatar.fileId));
      } catch (err) {
        console.log('Error deleting old avatar, may not exist:', err);
        // Continue even if delete fails
      }
    }

    // Set the new avatar info
    user.avatar = {
      fileId: file.id,
      filename: file.filename,
      uploadDate: file.uploadDate
    };
    
    await user.save();
    
    // Construct the URL for the frontend to use
    const avatarUrl = `/users/${userId}/avatar`;
    
    res.status(200).json({ 
      message: 'Avatar updated successfully',
      avatar: avatarUrl
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getAvatar = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId);
    
    if (!user || !user.avatar || !user.avatar.fileId) {
      // Serve default avatar when no avatar exists
      const defaultAvatarPath = path.join(__dirname, '../../public/default-avatar.png');
      res.set('Content-Type', 'image/png');
      return res.sendFile(defaultAvatarPath);
    }
    
    // Find the file by ID
    const file = await gfs.find({ _id: mongoose.Types.ObjectId(user.avatar.fileId) }).toArray();
    
    if (!file || file.length === 0) {
      // Serve default avatar when file not found
      const defaultAvatarPath = path.join(__dirname, '../../public/default-avatar.png');
      res.set('Content-Type', 'image/png');
      return res.sendFile(defaultAvatarPath);
    }
    
    // Set the appropriate content type
    res.set('Content-Type', 'image/jpeg');
    
    // Create a download stream
    const downloadStream = gfs.openDownloadStream(mongoose.Types.ObjectId(user.avatar.fileId));
    
    // Pipe the file to the response
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error retrieving avatar:', error);
    // Serve default avatar on error
    const defaultAvatarPath = path.join(__dirname, '../../public/default-avatar.png');
    res.set('Content-Type', 'image/png');
    return res.sendFile(defaultAvatarPath);
  }
};

const syncUserList = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId);
    if (!user?.anilist?.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'No AniList connection found' 
      });
    }

    const anilistData = await syncAniListData(user.anilist.accessToken);

    // Upsert UserList document
    let userList = await UserList.findOne({ userId: user._id });
    if (!userList) {
      userList = new UserList({ userId: user._id });
    }

    // Helper to map AniList status to UserList field
    const animeStatusMap = {
      'current': 'watchingAnime',
      'completed': 'completedAnime',
      'planning': 'planningAnime',
      'dropped': 'planningAnime', // Optionally handle dropped/paused
      'paused': 'planningAnime',
    };
    const mangaStatusMap = {
      'current': 'readingManga',
      'completed': 'completedManga',
      'planning': 'planningManga',
      'dropped': 'planningManga',
      'paused': 'planningManga',
    };

    // Clear all lists before syncing
    userList.watchingAnime = [];
    userList.completedAnime = [];
    userList.planningAnime = [];
    userList.readingManga = [];
    userList.completedManga = [];
    userList.planningManga = [];

    // Track progress for frontend
    const animeProgress = { added: 0, updated: 0, skipped: 0 };
    const mangaProgress = { added: 0, updated: 0, skipped: 0 };

    // Process anime list
    for (const animeEntry of anilistData.anime) {
      try {
        const status = animeEntry.status.toLowerCase();
        const progress = animeEntry.progress || 0;
        const listField = animeStatusMap[status] || 'planningAnime';
        let animeInDatabase = await AnimeModel.findOne({ anilistId: animeEntry.mediaId });
        if (!animeInDatabase) {
          animeProgress.skipped++;
          continue;
        }
        userList[listField].push({
          animeId: animeInDatabase._id,
          progress,
          lastUpdated: new Date()
        });
        animeProgress.added++;
      } catch (error) {
        animeProgress.skipped++;
      }
    }

    // Process manga list
    for (const mangaEntry of anilistData.manga) {
      try {
        const status = mangaEntry.status.toLowerCase();
        const progress = mangaEntry.progress || 0;
        const listField = mangaStatusMap[status] || 'planningManga';
        let mangaInDatabase = await MangaModel.findOne({ anilistId: mangaEntry.mediaId });
        if (!mangaInDatabase) {
          mangaProgress.skipped++;
          continue;
        }
        userList[listField].push({
          mangaId: mangaInDatabase._id,
          progress,
          lastUpdated: new Date()
        });
        mangaProgress.added++;
      } catch (error) {
        mangaProgress.skipped++;
      }
    }

    await userList.save();
    user.anilist.lastSync = Date.now();
    await user.save();

    res.json({
      success: true,
      message: 'Successfully synced with AniList',
      data: {
        anime: animeProgress,
        manga: mangaProgress
      }
    });
  } catch (error) {
    console.error('Error syncing AniList data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync AniList data',
      details: error.message
    });
  }
};

const deleteAllLists = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify user authorization
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to modify this user\'s lists' 
      });
    }

    // Find and clear the UserList document
    let userList = await UserList.findOne({ userId });
    if (!userList) {
      return res.status(404).json({ 
        success: false, 
        message: 'User list not found' 
      });
    }

    userList.watchingAnime = [];
    userList.completedAnime = [];
    userList.planningAnime = [];
    userList.readingManga = [];
    userList.completedManga = [];
    userList.planningManga = [];
    await userList.save();

    res.json({ 
      success: true, 
      message: 'All lists deleted successfully',
      userList
    });

  } catch (error) {
    console.error('Error deleting user lists:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting lists', 
      error: error.message 
    });
  }
};

export {
  registerUser,
  loginUser,
  getUserInfo,
  makeAdmin,
  updateTheme,
  getAllUsers,
  uploadAvatar,
  getAvatar,
  updateTitle,
  updateCharacterName,
  syncUserList,
  deleteAllLists
};
