/**
 * /routes/mangaRoutes.js
 * Description: Defines the routes related to manga in the Express application.
 */

import express from 'express';
import mangaController from '../controllers/mangaController.js';

const router = express.Router();

router.get('/mangas', mangaController.getAllManga);

router.get('/manga/:id', mangaController.getMangaInfo);

router.post('/addmanga', mangaController.createManga);

router.put('/manga/:id', mangaController.updateManga);

export default router;