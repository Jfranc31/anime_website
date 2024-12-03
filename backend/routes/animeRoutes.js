/**
 * /routes/animeRoutes.js
 * Description: Defines the routes related to anime in the Express application.
 */

import express from "express";
import {
  getAllAnimes,
  getAnimeInfo,
  createAnime,
  updateAnime,
  createAnimeFromAnilist,
  compareAnimeWithAnilist,
  updateAnimeAnilist
} from "../controllers/animeController.js";
import { fetchAnimeDataById } from '../services/anilistService.js';

const router = express.Router();

router.get("/animes", getAllAnimes);

router.get("/anime/:id", getAnimeInfo);

router.post("/addanime", createAnime);

router.put("/anime/:id", updateAnime);

router.get('/search/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const animeData = await fetchAnimeDataById(id);

    if (!animeData) {
      return res.status(404).json({ message: 'Anime not found' });
    }

    res.json(animeData);
  } catch (error) {
    console.error('Error searching anime:', error);
    res.status(500).json({ message: 'Error searching anime' });
  }
});

router.post('/update-from-anilist/:id', updateAnimeAnilist);

router.post('/create-from-anilist', createAnimeFromAnilist);

router.get('/compare/:id', compareAnimeWithAnilist);

export default router;
