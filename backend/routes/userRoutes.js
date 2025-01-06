/**
 * /routes/userRoutes.js
 * Description: Defines the routes related to user in the Express application.
 */

import express from "express";
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
  getAllUsers
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

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

export default router;
