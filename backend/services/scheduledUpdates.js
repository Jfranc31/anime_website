import cron from 'node-cron';
import AnimeModel from '../Models/animeModel.js';
import { updateAnimeFromAnilist } from './updateService.js';

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
      console.error('Scheduled update error:', error);
    }
  });
};

export { runScheduledUpdates }; 