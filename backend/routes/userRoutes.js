// /routes/userRoutes.js
import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();

router.post("/register", userController.registerUser);

router.post("/login", userController.loginUser);

router.post("/:userId/updateAnime", userController.updateUserAnime);

router.post("/:userId/updateManga", userController.updateUserManga);

router.post("/:userId/addAnime", userController.addAnime);

router.post("/:userId/addManga", userController.addManga);

router.get("/:userId/current", userController.getUserInfo);

router.post("/:userId/removeAnime", userController.removeAnime);

router.post("/:userId/removeManga", userController.removeManga);

export default router;