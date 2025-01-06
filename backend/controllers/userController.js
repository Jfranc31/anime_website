/**
 * /controllers/userController.js
 * Description: Controller for handling user-related operations.
 */

import UserModel from "../Models/userModel.js";
import AnimeModel from "../Models/animeModel.js";
import MangaModel from "../Models/mangaModel.js";
import bcrypt from "bcrypt";

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
        theme: user.theme
      };

      res.cookie("userInfo", JSON.stringify(userForCookie), {
        maxAge: 29 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        domain: "localhost",
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
  var { animeId, status, currentEpisode } = req.body;

  try {
    // Find the user
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentEpisode > 0) {
      status = "Watching";
    }

    user.animes.push({ animeId, status, currentEpisode });

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
  var { mangaId, status, currentChapter, currentVolume } = req.body;

  try {
    // find the user
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentChapter > 0 || currentVolume > 0) {
      status = "Reading";
    }

    user.mangas.push({ mangaId, status, currentChapter, currentVolume });

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
      }

      // Only auto-complete if the series is finished and all episodes are watched
      if (!isOngoing && maxEpisodes && currentEpisode >= maxEpisodes) {
        updatedStatus = 'Completed';
      }

      // Update the anime entry while preserving the animeId
      user.animes[existingAnimeIndex] = {
        animeId: user.animes[existingAnimeIndex].animeId, // Keep the existing animeId
        status: updatedStatus,
        currentEpisode: parseInt(currentEpisode) || 0,
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
        currentChapter: parseInt(currentChapter) || 0,
        currentVolume: parseInt(currentVolume) || 0,
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
    const user = await UserModel.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure both IDs are strings for comparison
    const mangaIndex = user.mangas.findIndex(
      (userManga) => {
        if (!userManga || !userManga.mangaId) {
          console.log('Invalid manga entry:', userManga);
          return false;
        }
        return userManga.mangaId.toString() === mangaId;
      }
    );

    if (mangaIndex !== -1) {
      user.mangas.splice(mangaIndex, 1);
      await user.save();

      const updatedUser = await UserModel.findById(userId);
      return res.json({
        success: true,
        message: "Manga removed successfully",
        user: updatedUser,
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        message: "Manga not found in user list",
        mangaId,
        userMangas: user.mangas.map(m => ({
          id: m.mangaId?.toString(),
          status: m.status
        }))
      });
    }
  } catch (error) {
    console.error("Error removing manga:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message,
      stack: error.stack
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
  getAllUsers
};
