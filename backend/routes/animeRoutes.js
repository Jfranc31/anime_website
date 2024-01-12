// /routes/animeRoutes.js
import express from 'express';
import animeController from '../controllers/animeController.js';

const router = express.Router();

router.get('/animes', animeController.getAllAnimes);

router.get('/anime/:id', animeController.getAnimeInfo);

router.post("/addanime", animeController.createAnime);

router.put('/anime/:id', animeController.updateAnime);

export default router;