const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get currently watching anime
router.get('/:userId/currently-watching', userController.getCurrentlyWatching);

// Get currently reading manga
router.get('/:userId/currently-reading', userController.getCurrentlyReading);

// Update anime status
router.post('/:userId/anime-status', userController.updateAnimeStatus);

// Update manga status
router.post('/:userId/manga-status', userController.updateMangaStatus);

// Get user's anime list
router.get('/:userId/anime-list', userController.getUserAnimeList);

// Get user's manga list
router.get('/:userId/manga-list', userController.getUserMangaList);

module.exports = router; 