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
  updateTitle,
  updateCharacterName
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../frontend/public')); // Save to public directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Use a unique filename
  },
});

const upload = multer({ storage });

const router = express.Router();

router.get('/', authMiddleware, getAllUsers);

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/:userId/current", getUserInfo);

// Manga routes
router.post("/:userId/addManga", addManga);
router.post("/:userId/updateManga", updateUserManga);
router.post("/:userId/removeManga", removeManga);

// Anime routes
router.post("/:userId/addAnime", addAnime);
router.post("/:userId/updateAnime", updateUserAnime);
router.post("/:userId/removeAnime", removeAnime);

// Admin routes
router.put("/:userId/make-admin", authMiddleware, makeAdmin);
router.put("/:userId/theme", authMiddleware, updateTheme);
router.put("/:userId/title", authMiddleware, updateTitle);
router.put("/:userId/characterName", authMiddleware, updateCharacterName);

// Avatar routes
router.post('/:userId/upload-avatar', upload.single('avatar'), uploadAvatar);

export default router;
