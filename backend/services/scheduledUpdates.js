import cron from 'node-cron';
import AnimeModel from '../Models/animeModel.js';
import MangaModel from '../Models/mangaModel.js';
import { updateAnimeFromAnilist, updateMangaFromAnilist } from './updateService.js';

const runScheduledAnimeUpdates = (time) => {
  cron.schedule(time, async () => {
    console.log('Running scheduled updates for anime...');
    try {
      const animes = await AnimeModel.find({
        'releaseData.releaseStatus': 'Currently Releasing'
      });

      for (const anime of animes) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const updatedAnime = await updateAnimeFromAnilist(anime);
        if (updatedAnime) {
          console.log("Updated: ", updatedAnime.titles.english);
        }
      }
    } catch (error) {
      console.error('Scheduled anime update error:', error);
    }
  });
};

const runScheduledMangaUpdates = (time) => {
  cron.schedule(time, async () => {
    console.log('Running scheduled updates for manga...');
    try {
      const mangas = await MangaModel.find({
        'releaseData.releaseStatus': 'Currently Releasing'
      });

      for (const manga of mangas) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const updatedManga = await updateMangaFromAnilist(manga);
        if (updatedManga) {
          console.log("Updated: ", updatedManga.titles?.english || updatedManga.titles.romaji);
        }
      }
    } catch (error) {
      console.error('Scheduled manga update error:', error);
    }
  });
};

export { runScheduledAnimeUpdates, runScheduledMangaUpdates };
