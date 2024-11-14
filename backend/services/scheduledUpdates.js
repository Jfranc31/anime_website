import cron from 'node-cron';
import AnimeModel from '../Models/animeModel.js';
import MangaModel from '../Models/mangaModel.js';
import { updateAnimeFromAnilist, updateMangaFromAnilist } from './updateService.js';

const runScheduledUpdates = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const animes = await AnimeModel.find({
        'releaseData.releaseStatus': 'Currently Releasing'
      });

      for (const anime of animes) {
        await updateAnimeFromAnilist(anime);
      }
    } catch (error) {
      console.error('Scheduled anime update error:', error);
    }

    try {
      const mangas = await MangaModel.find({
        'releaseData.releaseStatus': 'Currently Releasing'
      });

      for (const manga of mangas) {
        await updateMangaFromAnilist(manga);
      }
    } catch (error) {
      console.error('Scheduled manga update error:', error);
    }
  });
};

export { runScheduledUpdates }; 