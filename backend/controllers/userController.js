/**
 * /controllers/userController.js
 * Description: Controller for handling user-related operations.
 */

import UserModel from "../Models/userModel.js";
import AnimeModel from "../Models/animeModel.js";
import MangaModel from "../Models/mangaModel.js";
import bcrypt from "bcrypt";
import multer from 'multer';
import path from 'path';
import { syncAniListData } from '../services/anilistAuthService.js';
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;

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
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
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
 * @return {Object} - User document.
 */
const getUserInfo = async (req, res) => {
  try {
    const userID = req.params.userId;
    const user = await UserModel.findById(userID);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user for page: ", error);
    res.status(500).json({ message: "internal Server Error" });
  }
};

/**
 * @function addAnime
 * @description Add an anime to a user's list.
 * @param {Object} req - Express request object with user ID and anime data.
 * @param {Object} res - Express response object.
 * @return {Object} - Success or error message along with updated user information.
 */
const addAnime = async (req, res) => {
  const { userId } = req.params;
  var { animeId, anilistId, status, currentEpisode } = req.body;

  try {
    // Find the user
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentEpisode > 0) {
      status = "Watching";
    }

    if (status === "Completed") {
      const anime = await AnimeModel.findById(animeId);
      currentEpisode = anime.lengths?.Episodes || '';
    }

    user.animes.push({ animeId, anilistId, status, currentEpisode });

    // Save the updated user
    await user.save();

    // Fetch the updated user with populated anime details
    const updatedUser = await UserModel.findById(userId);

    return res.json({
      message: "Anime updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @function addManga
 * @description Add a manga to a user's list.
 * @param {Object} req - Express request object with user ID and manga data.
 * @param {Object} res - Express response object.
 * @return {Object} - Success or error message along with updated user information.
 */
const addManga = async (req, res) => {
  const { userId } = req.params;
  var { mangaId, anilistId, status, currentChapter, currentVolume } = req.body;

  try {
    // find the user
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentChapter > 0 || currentVolume > 0) {
      status = "Reading";
    }

    if (status === "Completed") {
      const manga = await MangaModel.findById(mangaId);
      currentChapter = manga.lengths.chapters;
    }

    user.mangas.push({ mangaId, anilistId, status, currentChapter, currentVolume });

    // Save the updated user
    await user.save();

    // Fetch the updated user with populated manga details
    const updatedUser = await UserModel.findById(userId);

    return res.json({
      message: "Manga updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @function updateUserAnime
 * @description Update the status and progress of an anime in a user's list.
 * @param {Object} req - Express request object with user ID and updated anime data.
 * @param {Object} res - Express response object.
 * @return {Object} - Success or error message along with updated user information.
 */
const updateUserAnime = async (req, res) => {
  const { userId } = req.params;
  const { animeId, status, currentEpisode } = req.body;
  let sendEpisode = currentEpisode;

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingAnimeIndex = user.animes.findIndex(
      (anime) => anime.animeId?.toString() === animeId?.toString()
    );

    if (existingAnimeIndex !== -1) {
      const anime = await AnimeModel.findById(animeId);
      if (!anime) {
        return res.status(404).json({ message: "Anime not found" });
      }

      const isOngoing = anime.releaseData.releaseStatus === "Currently Releasing";
      const maxEpisodes = anime.lengths.Episodes ? parseInt(anime.lengths.Episodes) : null;

      // Determine the status based on progress
      let updatedStatus = status;
      if (currentEpisode > 0) {
        updatedStatus = 'Watching';
      }
      if (status === 'Planning') {
        updatedStatus = 'Planning';
      }
      if (status === 'Completed') {
        updatedStatus = 'Completed';
        sendEpisode = maxEpisodes;
      }

      // Only auto-complete if the series is finished and all episodes are watched
      if (!isOngoing && maxEpisodes && currentEpisode >= maxEpisodes) {
        updatedStatus = 'Completed';
      }

      // Update the anime entry while preserving the animeId
      user.animes[existingAnimeIndex] = {
        animeId: user.animes[existingAnimeIndex].animeId, // Keep the existing animeId
        status: updatedStatus,
        currentEpisode: parseInt(sendEpisode) || 0,
        activityTimestamp: new Date()
      };

      await user.save();
      const updatedUser = await UserModel.findById(userId);

      return res.json({
        message: "Anime updated successfully",
        user: updatedUser,
      });
    } else {
      return res.status(404).json({ 
        message: "Anime not found in user's list",
        details: {
          userId,
          animeId,
          userAnimes: user.animes.map(a => ({
            id: a.animeId?.toString(),
            status: a.status
          }))
        }
      });
    }
  } catch (error) {
    console.error("Error updating anime:", error);
    return res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * @function updateUserManga
 * @description Update the status and progress of a manga in a user's list.
 * @param {Object} req - Express request object with user ID and updated manga data.
 * @param {Object} res - Express response object.
 * @return {Object} - Success or error message along with updated user information.
 */
const updateUserManga = async (req, res) => {
  const { userId } = req.params;
  const { mangaId, status, currentChapter, currentVolume } = req.body;
  let sendChapter = currentChapter;
  let sendVolume = currentVolume;

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingMangaIndex = user.mangas.findIndex(
      (manga) => manga.mangaId?.toString() === mangaId?.toString()
    );

    if (existingMangaIndex !== -1) {
      const manga = await MangaModel.findById(mangaId);
      if (!manga) {
        return res.status(404).json({ message: "Manga not found" });
      }
      
      const isOngoing = manga.releaseData.releaseStatus === "Currently Releasing";
      const maxChapters = manga.lengths.chapters ? parseInt(manga.lengths.chapters) : null;
      const maxVolumes = manga.lengths.volumes ? parseInt(manga.lengths.volumes) : null;

      // Determine the status based on progress
      let updatedStatus = status;
      if (currentChapter > 0 || currentVolume > 0) {
        updatedStatus = 'Reading';
      }
      if (status === 'Planning') {
        updatedStatus = 'Planning';
      }
      if (status === 'Completed') {
        updatedStatus = 'Completed';
        if (sendChapter > 0 && sendVolume === 0) {
          sendChapter = maxChapters;
          sendVolume = maxVolumes;
        } else if (sendChapter === 0 && sendVolume > 0) {
          sendChapter = maxChapters;
          sendVolume = maxVolumes;
        } else {
          sendChapter = maxChapters;
          sendVolume = maxVolumes;
        }
      }

      // Only auto-complete if the series is finished and all chapters/volumes are read
      if (!isOngoing) {
        if (maxChapters && maxVolumes) {
          if (currentChapter >= maxChapters && currentVolume >= maxVolumes) {
            updatedStatus = 'Completed';
          }
        } else if (maxChapters && !maxVolumes) {
          if (currentChapter >= maxChapters) {
            updatedStatus = 'Completed';
          }
        }
      }

      // Update the manga entry while preserving the mangaId
      user.mangas[existingMangaIndex] = {
        mangaId: user.mangas[existingMangaIndex].mangaId, // Keep the existing mangaId
        status: updatedStatus,
        currentChapter: parseInt(sendChapter) || 0,
        currentVolume: parseInt(sendVolume) || 0,
        activityTimestamp: new Date()
      };

      await user.save();
      const updatedUser = await UserModel.findById(userId);

      return res.json({
        message: "Manga updated successfully",
        user: updatedUser,
      });
    } else {
      return res.status(404).json({ 
        message: "Manga not found in user's list",
        details: {
          userId,
          mangaId,
          userMangas: user.mangas.map(m => ({
            id: m.mangaId?.toString(),
            status: m.status
          }))
        }
      });
    }
  } catch (error) {
    console.error("Error updating manga:", error);
    return res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * @function removeAnime
 * @description Remove an anime from a user's list.
 * @param {Object} req - Express request object with user ID and anime ID.
 * @param {Object} res - Express response object.
 * @return {Object} - Success or error message.
 */
const removeAnime = async (req, res) => {
  const userId = req.params.userId;
  const animeId = req.body.animeId;

  try {
    const user = await UserModel.findById(userId);

    const animeIndex = user.animes.findIndex(
      (userAnime) => userAnime.animeId.toString() === animeId,
    );

    if (animeIndex !== -1) {
      user.animes.splice(animeIndex, 1);
      await user.save();

      // Fetch updated user data
      const updatedUser = await UserModel.findById(userId);
      res.json({
        success: true,
        message: "Anime removed successfully",
        user: updatedUser,
      });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Anime not found in user list" });
    }
  } catch (error) {
    console.error("Error removing anime from user list:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * @function removeManga
 * @description Remove a manga from a user's list.
 * @param {Object} req - Express request object with user ID and manga ID.
 * @param {Object} res - Express response object.
 * @returns {Object} - Success or error message.
 */
const removeManga = async (req, res) => {
  const userId = req.params.userId;
  const mangaId = req.body.mangaId;

  try {
    // First find the user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Find the index of the manga to remove
    const mangaIndex = user.mangas.findIndex(
      manga => manga.mangaId.toString() === mangaId
    );

    if (mangaIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "Manga not found in user list",
        mangaId
      });
    }

    // Remove the manga from the array
    user.mangas.splice(mangaIndex, 1);

    // Save the user document
    await user.save();

    return res.json({
      success: true,
      message: "Manga removed successfully",
      user
    });

  } catch (error) {
    console.error("Error removing manga:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message
    });
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

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Endpoint to upload avatar
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the uploaded file
    console.log('Uploaded file:', req.file);

    // Ensure the file exists
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    user.avatar = `/public/${req.file.filename}`; // Save the path to the avatar
    console.log('Avatar path set to:', user.avatar); // Log the avatar path

    // Attempt to save the updated user
    await user.save(); // Save the updated user

    console.log('After save:', user); // Log after saving
    res.status(200).json({ message: 'Avatar updated successfully', avatar: user.avatar });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Internal Server Error' });
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
    
    const addedAnime = [];
    const skippedAnime = [];
    const updatedAnime = [];

    // Process anime list
    for (const animeEntry of anilistData.anime) {
      try {
        const status = animeEntry.status.toLowerCase();
        const progress = animeEntry.progress || 0;
        
        // First check if this anime exists in our database
        let animeInDatabase = await AnimeModel.findOne({ 
          anilistId: animeEntry.mediaId 
        });

        if (!animeInDatabase) {
          skippedAnime.push({
            title: animeEntry.title.userPreferred,
            anilistId: animeEntry.mediaId
          });
          continue;
        }

        // Check if user already has this anime
        const existingUserAnime = user.animes.find(
          anime => anime.anilistId === animeEntry.mediaId
        );

        if (existingUserAnime) {
          // Update existing entry if progress changed
          if (existingUserAnime.currentEpisode !== progress) {
            existingUserAnime.currentEpisode = progress;
            existingUserAnime.status = status === 'completed' ? 'Completed' : 
                                     status === 'current' ? 'Watching' : 'Planning';
            existingUserAnime.activityTimestamp = Date.now();
            
            updatedAnime.push({
              title: animeEntry.title.userPreferred,
              anilistId: animeEntry.mediaId
            });
          }
        } else {
          // Add new entry
          user.animes.push({
            animeId: animeInDatabase._id,
            anilistId: animeEntry.mediaId,
            status: status === 'completed' ? 'Completed' : 
                    status === 'current' ? 'Watching' : 'Planning',
            currentEpisode: progress,
            activityTimestamp: Date.now()
          });

          addedAnime.push({
            title: animeEntry.title.userPreferred,
            anilistId: animeEntry.mediaId
          });
        }
      } catch (error) {
        console.error('Error processing anime:', animeEntry, error);
        skippedAnime.push({
          title: animeEntry.title?.userPreferred || 'Unknown',
          anilistId: animeEntry.mediaId,
          error: error.message
        });
      }
    }

    // Process manga list
    const addedManga = [];
    const skippedManga = [];
    const updatedManga = [];

    for (const mangaEntry of anilistData.manga) {
      try {
        const status = mangaEntry.status.toLowerCase();
        const progress = mangaEntry.progress || 0;
        const volumeProgress = mangaEntry.progressVolumes || 0;

        // First check if this manga exists in our database
        let mangaInDatabase = await MangaModel.findOne({ 
          anilistId: mangaEntry.mediaId 
        });

        if (!mangaInDatabase) {
          skippedManga.push({
            title: mangaEntry.title.userPreferred,
            anilistId: mangaEntry.mediaId
          });
          continue;
        }

        // Check if user already has this manga
        const existingUserManga = user.mangas.find(
          manga => manga.anilistId === mangaEntry.mediaId
        );

        if (existingUserManga) {
          // Update existing entry if progress changed
          if (existingUserManga.currentChapter !== progress || 
              existingUserManga.currentVolume !== volumeProgress) {
            existingUserManga.currentChapter = progress;
            existingUserManga.currentVolume = volumeProgress;
            existingUserManga.status = status === 'completed' ? 'Completed' : 
                                     status === 'current' ? 'Reading' : 'Planning';
            existingUserManga.activityTimestamp = Date.now();
            
            updatedManga.push({
              title: mangaEntry.title.userPreferred,
              anilistId: mangaEntry.mediaId
            });
          }
        } else {
          // Add new entry
          user.mangas.push({
            mangaId: mangaInDatabase._id,
            anilistId: mangaEntry.mediaId,
            status: status === 'completed' ? 'Completed' : 
                    status === 'current' ? 'Reading' : 'Planning',
            currentChapter: progress,
            currentVolume: volumeProgress,
            activityTimestamp: Date.now()
          });

          addedManga.push({
            title: mangaEntry.title.userPreferred,
            anilistId: mangaEntry.mediaId
          });
        }
      } catch (error) {
        console.error('Error processing manga:', mangaEntry, error);
        skippedManga.push({
          title: mangaEntry.title?.userPreferred || 'Unknown',
          anilistId: mangaEntry.mediaId,
          error: error.message
        });
      }
    }

    // Save all changes
    await user.save();

    // Update last sync timestamp
    user.anilist.lastSync = Date.now();
    await user.save();

    res.json({
      success: true,
      message: 'Successfully synced with AniList',
      data: {
        anime: {
          added: addedAnime,
          updated: updatedAnime,
          skipped: skippedAnime
        },
        manga: {
          added: addedManga,
          updated: updatedManga,
          skipped: skippedManga
        }
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

    // Update user document to clear both lists
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          animes: [],
          mangas: []
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'All lists deleted successfully' ,
      user: updatedUser
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
  updateUserAnime,
  updateUserManga,
  addAnime,
  getUserInfo,
  addManga,
  removeAnime,
  removeManga,
  makeAdmin,
  updateTheme,
  getAllUsers,
  uploadAvatar,
  updateTitle,
  updateCharacterName,
  syncUserList,
  deleteAllLists
};
