/**
 * /routes/userRoutes.js
 * Description: Defines the routes related to user in the Express application.
 */

import express from "express";
import {
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
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from '../utils/gridfsStorage.js';
import { getAuthorizationUrl, getAccessToken, getAniListUserInfo, validateAniListConnection, syncAniListData, getAniListUserLists } from '../services/anilistAuthService.js';
import UserModel from '../Models/userModel.js';
import UserList from '../Models/userListModel.js';

const router = express.Router();

// User authentication routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// User profile routes
router.get("/:userId", authMiddleware, getUserInfo);
router.get("/:userId/current", authMiddleware, getUserInfo);
router.get("/:userId/avatar", getAvatar);
router.post("/:userId/avatar", authMiddleware, upload.single("avatar"), uploadAvatar);
router.patch("/:userId/theme", authMiddleware, updateTheme);
router.patch("/:userId/title", authMiddleware, updateTitle);
router.patch("/:userId/characterName", authMiddleware, updateCharacterName);

// User list routes
router.get("/:userId/anime-statuses", authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ animeStatuses: user.animes || [] });
  } catch (error) {
    console.error("Error fetching anime statuses:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/:userId/currently-watching", authMiddleware, async (req, res) => {
  try {
    const userList = await UserList.findOne({ userId: req.params.userId });
    if (!userList) {
      return res.status(404).json({ message: "User list not found" });
    }
    res.json({ currentlyWatching: userList.watchingAnime || [] });
  } catch (error) {
    console.error("Error fetching currently watching:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/:userId/currently-reading", authMiddleware, async (req, res) => {
  try {
    const userList = await UserList.findOne({ userId: req.params.userId });
    if (!userList) {
      return res.status(404).json({ message: "User list not found" });
    }
    res.json({ currentlyReading: userList.readingManga || [] });
  } catch (error) {
    console.error("Error fetching currently reading:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Admin routes
router.get("/", authMiddleware, getAllUsers);
router.patch("/:userId/admin", authMiddleware, makeAdmin);

// AniList sync routes
router.post("/:userId/sync", authMiddleware, syncUserList);
router.delete("/:userId/lists", authMiddleware, deleteAllLists);

// Get AniList authorization URL
router.get('/anilist/auth', (req, res) => {
  const authUrl = getAuthorizationUrl();
  res.json({ url: authUrl });
});

// Handle AniList OAuth callback
router.post('/anilist/callback', async (req, res) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    // Exchange code for access token
    const accessToken = await getAccessToken(code);

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Failed to obtain access token'
      });
    }

    // Get AniList user info
    const anilistUser = await getAniListUserInfo(accessToken);

    if (!anilistUser) {
      return res.status(400).json({
        success: false,
        error: 'Failed to get AniList user info'
      });
    }

    // Update user with AniList information
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        anilist: {
          connected: true,
          userId: anilistUser.id,
          accessToken: accessToken,
          username: anilistUser.name
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error connecting AniList account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect AniList account'
    });
  }
});

// Disconnect AniList account
router.post('/:userId/anilist/disconnect', authMiddleware, async (req, res) => {
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.userId,
      {
        anilist: {
          connected: false,
          userId: null,
          accessToken: null,
          username: null
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error disconnecting AniList account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect AniList account'
    });
  }
});

// Validate AniList connection
router.get('/:userId/anilist/validate', authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId);
    if (!user?.anilist?.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'No AniList connection found' 
      });
    }

    const anilistUser = await validateAniListConnection(user.anilist.accessToken);
    
    res.json({
      success: true,
      anilistUser
    });
  } catch (error) {
    console.error('Error validating AniList connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate AniList connection'
    });
  }
});

// Get AniList user lists
router.get('/:userId/anilist/lists', authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId);
    if (!user?.anilist?.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'No AniList connection found' 
      });
    }

    const anilistData = await getAniListUserLists(user.anilist.accessToken);
    
    res.json({
      success: true,
      data: {
        username: anilistData.user,
        statistics: anilistData.statistics,
        animeLists: anilistData.animeLists,
        mangaLists: anilistData.mangaLists
      }
    });
  } catch (error) {
    console.error('Error fetching AniList lists:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch AniList lists'
    });
  }
});

// Update anime status in UserList
router.post('/:userId/anime-status', authMiddleware, async (req, res) => {
  try {
    const { animeId, status, progress } = req.body;
    const userId = req.params.userId;
    let userList = await UserList.findOne({ userId });
    if (!userList) {
      userList = new UserList({ userId });
    }
    // Remove anime from all lists
    userList.watchingAnime = userList.watchingAnime.filter(a => !a.animeId.equals(animeId));
    userList.completedAnime = userList.completedAnime.filter(a => !a.animeId.equals(animeId));
    userList.planningAnime = userList.planningAnime.filter(a => !a.animeId.equals(animeId));
    // Add to correct list
    let listField = 'planningAnime';
    if (status === 'Watching') listField = 'watchingAnime';
    else if (status === 'Completed') listField = 'completedAnime';
    userList[listField].push({ animeId, progress, lastUpdated: new Date() });
    await userList.save();
    res.json({ success: true, userList });
  } catch (error) {
    console.error('Error updating anime status:', error);
    res.status(500).json({ success: false, message: 'Error updating anime status', error: error.message });
  }
});

// Update manga status in UserList
router.post('/:userId/manga-status', authMiddleware, async (req, res) => {
  try {
    const { mangaId, status, progress } = req.body;
    const userId = req.params.userId;
    let userList = await UserList.findOne({ userId });
    if (!userList) {
      userList = new UserList({ userId });
    }
    // Remove manga from all lists
    userList.readingManga = userList.readingManga.filter(m => !m.mangaId.equals(mangaId));
    userList.completedManga = userList.completedManga.filter(m => !m.mangaId.equals(mangaId));
    userList.planningManga = userList.planningManga.filter(m => !m.mangaId.equals(mangaId));
    // Add to correct list
    let listField = 'planningManga';
    if (status === 'Reading') listField = 'readingManga';
    else if (status === 'Completed') listField = 'completedManga';
    userList[listField].push({ mangaId, progress, lastUpdated: new Date() });
    await userList.save();
    res.json({ success: true, userList });
  } catch (error) {
    console.error('Error updating manga status:', error);
    res.status(500).json({ success: false, message: 'Error updating manga status', error: error.message });
  }
});

export default router;
