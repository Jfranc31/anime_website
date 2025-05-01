/**
 * /routes/userRoutes.js
 * Description: Defines the routes related to user in the Express application.
 */

import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  registerUser,
  loginUser,
  updateUserAnime,
  updateUserManga,
  addAnime,
  addManga,
  getUserInfo,
  removeAnime,
  removeManga,
  makeAdmin,
  updateTheme,
  getAllUsers,
  uploadAvatar,
  getAvatar,
  updateTitle,
  updateCharacterName,
  syncUserList,
  deleteAllLists,
  getUserAnimeStatuses,
  getUserMangaStatuses
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { getAuthorizationUrl, getAccessToken, getAniListUserInfo, validateAniListConnection, syncAniListData, getAniListUserLists } from '../services/anilistAuthService.js';
import UserModel from '../Models/userModel.js';
import upload from '../utils/gridfsStorage.js';

const router = express.Router();

router.get('/', authMiddleware, getAllUsers);

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/:userId/current", getUserInfo);

// Manga routes
router.post("/:userId/addManga", addManga);
router.post("/:userId/updateManga", updateUserManga);
router.post("/:userId/removeManga", removeManga);
router.get("/:userId/manga-statuses", getUserMangaStatuses);

// Anime routes
router.post("/:userId/addAnime", addAnime);
router.post("/:userId/updateAnime", updateUserAnime);
router.post("/:userId/removeAnime", removeAnime);
router.get("/:userId/anime-statuses", getUserAnimeStatuses);

// Admin routes
router.put("/:userId/make-admin", authMiddleware, makeAdmin);
router.put("/:userId/theme", authMiddleware, updateTheme);
router.put("/:userId/title", authMiddleware, updateTitle);
router.put("/:userId/characterName", authMiddleware, updateCharacterName);

// Avatar routes
router.post('/:userId/upload-avatar', authMiddleware, upload.single('avatar'), uploadAvatar);
router.get('/:userId/avatar', getAvatar);

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

// Sync AniList data
router.post('/:userId/anilist/sync', authMiddleware, syncUserList);

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

// Delete all lists
router.delete('/:userId/lists', authMiddleware, deleteAllLists);

export default router;
