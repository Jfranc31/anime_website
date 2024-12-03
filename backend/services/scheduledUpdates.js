import cron from 'node-cron';
import AnimeModel from '../Models/animeModel.js';
import MangaModel from '../Models/mangaModel.js';
import { updateAnimeFromAnilist, updateMangaFromAnilist } from './updateService.js';

const runScheduledUpdates = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled updates for anime and manga...');
    try {
      const animes = await AnimeModel.find({
        'releaseData.releaseStatus': 'Currently Releasing'
      });

      for (const anime of animes) {
        await updateAnimeFromAnilist(anime);
        await checkAndUpdateAnimeStatus(anime);
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

// Function to check and update anime status
const checkAndUpdateAnimeStatus = async (anime) => {
  const currentDate = Date.now();
  const endDate = new Date(anime.releaseData.endDate.year, anime.releaseData.endDate.month - 1, anime.releaseData.endDate.day).getTime();

  // Check if the current date is past the end date
  if (currentDate > endDate && anime.releaseData.releaseStatus === "Currently Releasing") {
    anime.releaseData.releaseStatus = "Finished Releasing";
    await anime.save();
    console.log(`Updated ${anime.titles.english} status to Finished Releasing.`);
  }
};

export { runScheduledUpdates }; 