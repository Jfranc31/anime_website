/**
 * /routes/mangaRoutes.js
 * Description: Defines the routes related to manga in the Express application.
 */

import express from "express";
import { getAllManga, 
  getMangaInfo, 
  createManga, 
  updateManga,
  createMangaFromAnilist
} from "../controllers/mangaController.js";
import { fetchMangaData } from '../services/anilistService.js';
import MangaModel from '../Models/mangaModel.js';
import { updateMangaFromAnilist } from '../services/updateService.js';

const router = express.Router();

router.get("/mangas", getAllManga);

router.get("/manga/:id", getMangaInfo);

router.post("/addmanga", createManga);

router.put("/manga/:id", updateManga);

router.get('/search/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const mangaData = await fetchMangaData(title);

    if (!mangaData) {
      return res.status(404).json({ message: 'Manga not found' });
    }

    res.json(mangaData);
  } catch (error) {
    console.error('Error searching manga:', error);
    res.status(500).json({ message: 'Error searching manga' });
  }
});

router.post('/update-from-anilist/:id', async (req, res) => {
  try {
    const manga = await MangaModel.findById(req.params.id);
    if (!manga) {
      return res.status(404).json({ message: 'Manga not found' });
    }

    const updatedManga = await updateMangaFromAnilist(manga);
    if (!updatedManga) {
      return res.status(400).json({ message: 'Failed to update from AniList' });
    }

    res.json(updatedManga);
  } catch (error) {
    console.error('Error updating manga from AniList:', error);
    res.status(500).json({ message: 'Error updating manga from AniList' }); 
  }
});

router.post('/create-from-anilist', createMangaFromAnilist);

export default router;
