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
  compareAnimeWithAnilist
} from "../controllers/animeController.js";
import { fetchAnimeData } from '../services/anilistService.js';
import AnimeModel from '../Models/animeModel.js';
import { updateAnimeFromAnilist } from '../services/updateService.js';

const router = express.Router();

router.get("/animes", getAllAnimes);

router.get("/anime/:id", getAnimeInfo);

router.post("/addanime", createAnime);

router.put("/anime/:id", updateAnime);

router.get('/search/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const animeData = await fetchAnimeData(title);
    
    if (!animeData) {
      return res.status(404).json({ message: 'Anime not found' });
    }
    
    res.json(animeData);
  } catch (error) {
    console.error('Error searching anime:', error);
    res.status(500).json({ message: 'Error searching anime' });
  }
});

router.post('/update-from-anilist/:id', async (req, res) => {
  try {
    const anime = await AnimeModel.findById(req.params.id);
    if (!anime) {
      return res.status(404).json({ message: 'Anime not found' });
    }

    const updatedAnime = await updateAnimeFromAnilist(anime);
    if (!updatedAnime) {
      return res.status(400).json({ message: 'Failed to update from AniList' });
    }

    res.json(updatedAnime);
  } catch (error) {
    console.error('Error updating from AniList:', error);
    res.status(500).json({ message: 'Error updating from AniList' });
  }
});

router.post('/create-from-anilist', createAnimeFromAnilist);

router.get('/compare/:id', compareAnimeWithAnilist);

export default router;
