/**
 * /routes/userRoutes.js
 * Description: Defines the routes related to user in the Express application.
 */

import express from "express";
import userController from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get('/', authMiddleware, userController.getAllUsers);

router.post("/register", userController.registerUser);

router.post("/login", userController.loginUser);

router.post("/:userId/updateAnime", userController.updateUserAnime);

router.post("/:userId/updateManga", userController.updateUserManga);

router.post("/:userId/addAnime", userController.addAnime);

router.post("/:userId/addManga", userController.addManga);

router.get("/:userId/current", userController.getUserInfo);

router.post("/:userId/removeAnime", userController.removeAnime);

router.post("/:userId/removeManga", userController.removeManga);

router.put("/:userId/make-admin", authMiddleware, userController.makeAdmin);

router.put("/:userId/theme", authMiddleware, userController.updateTheme);

export default router;
