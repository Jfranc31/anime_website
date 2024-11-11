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
        role: user.role
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

    console.log(status, currentEpisode);

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
    // Find the user
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the anime is already in the user's list
    const existingAnimeIndex = user.animes.findIndex(
      (anime) => anime.animeId.toString() === animeId.toString(),
    );

    if (existingAnimeIndex !== -1) {
      const anime =
        await AnimeModel.findById(animeId).select("lengths.Episodes");

      // Check if max episodes is 0 (indicating no limit)
      const maxEpisodes =
        anime.lengths.Episodes === null ? null : anime.lengths.Episodes;

      // Update the existing show
      if (status === "Completed") {
        user.animes[existingAnimeIndex].status = status;
        user.animes[existingAnimeIndex].currentEpisode = maxEpisodes;
      } else if (status === "Planning") {
        if (
          currentEpisode > 0 &&
          (currentEpisode < maxEpisodes || maxEpisodes === null)
        ) {
          user.animes[existingAnimeIndex].status = "Watching";
          user.animes[existingAnimeIndex].currentEpisode = currentEpisode;
        } else if (currentEpisode >= maxEpisodes) {
          if (maxEpisodes !== null) {
            user.animes[existingAnimeIndex].status = "Completed";
            user.animes[existingAnimeIndex].currentEpisode = maxEpisodes;
          } else {
            user.animes[existingAnimeIndex].status = status;
            user.animes[existingAnimeIndex].currentEpisode = currentEpisode;
          }
        } else {
          user.animes[existingAnimeIndex].status = status;
          user.animes[existingAnimeIndex].currentEpisode = currentEpisode;
        }
      } else {
        user.animes[existingAnimeIndex].status = status;
        if (currentEpisode >= maxEpisodes) {
          if (maxEpisodes !== null) {
            user.animes[existingAnimeIndex].status = "Completed";
            user.animes[existingAnimeIndex].currentEpisode = maxEpisodes;
          } else {
            user.animes[existingAnimeIndex].currentEpisode = currentEpisode;
          }
        } else {
          user.animes[existingAnimeIndex].currentEpisode = currentEpisode;
        }
      }

      const activity = new Date();

      user.animes[existingAnimeIndex].activityTimestamp =
        activity.toLocaleString("en-US");
      console.log(activity, user.animes[existingAnimeIndex].activityTimestamp);

      // Save the updated user
      await user.save();

      // Fetch the updated user with populated anime details
      const updatedUser = await UserModel.findById(userId);

      return res.json({
        message: "Anime updated successfully",
        user: updatedUser,
      });
    } else {
      return res
        .status(404)
        .json({ message: "Anime not found in user's list" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
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
      (manga) => manga.mangaId.toString() === mangaId.toString(),
    );

    if (existingMangaIndex !== -1) {
      const mangaChapters =
        await MangaModel.findById(mangaId).select("lengths.chapters");
      const mangaVolumes =
        await MangaModel.findById(mangaId).select("lengths.volumes");

      const maxChapters =
        mangaChapters.lengths.chapters === null
          ? currentChapter
          : mangaChapters.lengths.chapters;
      const maxVolumes =
        mangaVolumes.lengths.volumes === null
          ? currentVolume
          : mangaVolumes.lengths.volumes;

      console.log("Current Chapter:", currentChapter);
      console.log("Current Volume:", currentVolume);
      console.log("Max Chapters:", maxChapters);
      console.log("Max Volumes:", maxVolumes);

      if (status === "Completed") {
        user.mangas[existingMangaIndex].status = status;
        user.mangas[existingMangaIndex].currentChapter = maxChapters;
        user.mangas[existingMangaIndex].currentVolume = maxVolumes;
      } else if (status === "Planning") {
        if (
          (currentChapter > 0 || currentVolume > 0) &&
          (currentChapter <= maxChapters || maxChapters === null) &&
          (currentVolume <= maxVolumes || maxVolumes === null)
        ) {
          user.mangas[existingMangaIndex].status = "Reading";
          user.mangas[existingMangaIndex].currentChapter = currentChapter;
          user.mangas[existingMangaIndex].currentVolume = currentVolume;
        } else {
          user.mangas[existingMangaIndex].status = status;
          user.mangas[existingMangaIndex].currentChapter = 0;
          user.mangas[existingMangaIndex].currentVolume = 0;
        }
      } else {
        user.mangas[existingMangaIndex].status = status;
        if (currentChapter <= maxChapters || maxChapters === null) {
          user.mangas[existingMangaIndex].currentChapter = currentChapter;
        } else {
          user.mangas[existingMangaIndex].status = "Completed";
          user.mangas[existingMangaIndex].currentChapter = maxChapters;
        }
        if (currentVolume <= maxVolumes || maxVolumes === null) {
          user.mangas[existingMangaIndex].currentVolume = currentVolume;
        } else {
          user.mangas[existingMangaIndex].status = "Completed";
          user.mangas[existingMangaIndex].currentVolume = maxVolumes;
        }
      }

      const activity = new Date();
      user.mangas[existingMangaIndex].activityTimestamp =
        activity.toLocaleString("en-US");

      await user.save();

      const updatedUser = await UserModel.findById(userId);

      return res.json({
        message: "Manga updated successfully",
        user: updatedUser,
      });
    } else {
      return res
        .status(404)
        .json({ message: "Manga not found in user's list" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
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
    console.log(animeIndex);

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

    const mangaIndex = user.mangas.findIndex(
      (userManga) => userManga.mangaId.toString() === mangaId,
    );
    console.log(mangaIndex);

    if (mangaIndex !== -1) {
      user.mangas.splice(mangaIndex, 1);
      await user.save();

      // Fetch updated user data
      const updatedUser = await UserModel.findById(userId);
      res.json({
        success: true,
        message: "Manga removed successfully",
        user: updatedUser,
      });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Manga not found in user list" });
    }
  } catch (error) {
    console.error("Error removing manga from user list:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

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

const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({}, 'username email role');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export default {
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
