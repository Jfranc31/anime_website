/**
 * /routes/mangaRoutes.js
 * Description: Defines the routes related to manga in the Express application.
 */

import express from "express";
import {
  getAllManga,
  getMangaInfo,
  createManga,
  updateManga,
  createMangaFromAnilist,
  compareMangaWithAnilist,
  updateMangaAnilist
} from "../controllers/mangaController.js";
import { fetchMangaDataById, fetchCharactersBySeriesId } from '../services/anilistService.js';

const router = express.Router();

router.get("/mangas", getAllManga);

router.get("/manga/:id", getMangaInfo);

router.post("/addmanga", createManga);

router.put("/manga/:id", updateManga);

router.get('/search/:id', async (req, res) => {
  try {
    const { title } = req.params;
    const mangaData = await fetchMangaDataById(title);

    if (!mangaData) {
      return res.status(404).json({ message: 'Manga not found' });
    }

    res.json(mangaData);
  } catch (error) {
    console.error('Error searching manga:', error);
    res.status(500).json({ message: 'Error searching manga' });
  }
});

router.get('/searchCharacters/:id/:type', async (req, res) => {
  try {
    const { id, type } = req.params;
    console.log(`Searching for manga with ID: ${id}`);
    const charactersData = await fetchCharactersBySeriesId(id, type);

    if (!charactersData) {
      return res.status(404).json({ message: 'Manga not found' });
    }

    res.json(charactersData);
  } catch (error) {
    console.error('Error searching manga:', error);
    res.status(500).json({ message: 'Error searching manga' });
  }
});

router.post('/update-from-anilist/:id', updateMangaAnilist);

router.post('/create-from-anilist', createMangaFromAnilist);

router.get('/compare/:id', compareMangaWithAnilist);

export default router;
