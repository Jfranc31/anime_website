import { schedule } from 'node-cron';
import AnimeModel from '../Models/animeModel.js';
import MangaModel from '../Models/mangaModel.js';
import { updateAnimeFromAnilist, updateMangaFromAnilist } from './updateService.js';

const WEEK_IN_SECONDS = 7 * 24 * 60 * 60;

// Configure rate limiting - 1 request per 5 seconds
const RATE_LIMIT_DELAY = 5000;

// Utility function for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility function for detailed logging
const log = {
  info: (message, data = {}) => {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`, data);
  },
  error: (message, error) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, {
      error: error.message,
      stack: error.stack
    });
  }
};

// Helper to calculate time until next episode
function calculateTimeUntilAiring(airingAt) {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  return airingAt - now;
}

// Function to get current airing information
function getCurrentAiringInfo(anime) {
  if (!anime.nextAiringEpisode) {
    return null;
  }

  const timeUntilAiring = calculateTimeUntilAiring(anime.nextAiringEpisode.airingAt);

  // If the episode has aired (timeUntilAiring is negative)
  if (timeUntilAiring <= 0) {
    // Calculate how many episodes have aired since last update
    const weeksSinceAiring = Math.floor(Math.abs(timeUntilAiring) / WEEK_IN_SECONDS) + 1;
    const newEpisode = anime.nextAiringEpisode.episode + weeksSinceAiring;
    const newAiringAt = anime.nextAiringEpisode.airingAt + (weeksSinceAiring * WEEK_IN_SECONDS);

    return {
      airingAt: newAiringAt,
      episode: newEpisode,
      timeUntilAiring: calculateTimeUntilAiring(newAiringAt)
    };
  }

  // If the episode hasn't aired yet, return current info with updated timeUntilAiring
  return {
    airingAt: anime.nextAiringEpisode.airingAt,
    episode: anime.nextAiringEpisode.episode,
    timeUntilAiring
  };
}

// Function to update a single anime's airing information
async function updateAnimeAiringInfo(anime) {
  const currentAiring = getCurrentAiringInfo(anime);

  if (!currentAiring) {
    return null;
  }

  try {
    // Only update if the airing information has changed
    if (currentAiring.airingAt !== anime.nextAiringEpisode.airingAt ||
        currentAiring.episode !== anime.nextAiringEpisode.episode ||
        currentAiring.timeUntilAiring !== anime.nextAiringEpisode.timeUntilAiring) {

      await AnimeModel.findByIdAndUpdate(anime._id, {
        nextAiringEpisode: currentAiring
      });

      return {
        animeId: anime._id,
        title: anime.titles.english || anime.titles.romaji,
        previousEpisode: anime.nextAiringEpisode.episode,
        newEpisode: currentAiring.episode,
        nextAiringAt: new Date(currentAiring.airingAt * 1000).toISOString()
      };
    }
  } catch (error) {
    console.error('Error updating anime airing info:', {
      animeId: anime._id,
      title: anime.titles.english || anime.titles.romaji,
      error: error.message
    });
  }

  return null;
}

// Helper function to process media updates
async function processMediaUpdates(items, updateFunction, mediaType) {
  const results = {
    successful: 0,
    failed: 0,
    skipped: 0
  };

  for (const item of items) {
    try {
      await delay(RATE_LIMIT_DELAY);
      const updated = await updateFunction(item);

      if (updated) {
        results.successful++;
        // If it's an anime, update its airing info after the Anilist update
        if (mediaType === 'anime') {
          await updateAnimeAiringInfo(updated);
        }
        log.info(`Updated ${mediaType}:`, {
          title: updated.titles?.english || updated.titles?.romaji,
          id: updated._id
        });
      } else {
        results.skipped++;
      }
    } catch (error) {
      results.failed++;
      log.error(`Failed to update ${mediaType}:`, {
        title: item.titles?.english || item.titles?.romaji,
        error
      });
    }
  }

  return results;
}

// Main update functions
const runScheduledAnimeUpdates = (cronPattern) => {
  if (!cronPattern) throw new Error('Cron pattern is required');

  schedule(cronPattern, async () => {
    log.info('Starting scheduled anime updates');

    try {
      const animes = await AnimeModel.find({
        'releaseData.releaseStatus': 'Currently Releasing'
      }).lean();

      log.info(`Found ${animes.length} anime to update`);

      const results = await processMediaUpdates(
        animes,
        updateAnimeFromAnilist,
        'anime'
      );

      log.info('Completed anime updates', results);
    } catch (error) {
      log.error('Failed to run scheduled anime updates', error);
    }
  });
};

const runScheduledMangaUpdates = (cronPattern) => {
  if (!cronPattern) throw new Error('Cron pattern is required');

  schedule(cronPattern, async () => {
    log.info('Starting scheduled manga updates');

    try {
      const mangas = await MangaModel.find({
        'releaseData.releaseStatus': 'Currently Releasing'
      }).lean();

      log.info(`Found ${mangas.length} manga to update`);

      const results = await processMediaUpdates(
        mangas,
        updateMangaFromAnilist,
        'manga'
      );

      log.info('Completed manga updates', results);
    } catch (error) {
      log.error('Failed to run scheduled manga updates', error);
    }
  });
};

// Function to run airing info updates
const runScheduledAiringUpdates = (cronPattern) => {
  schedule(cronPattern, async () => {
    log.info('Starting airing information update check');

    try {
      const airingAnime = await AnimeModel.find({
        'releaseData.releaseStatus': 'Currently Releasing',
        nextAiringEpisode: { $exists: true }
      }).lean();

      const updates = [];

      for (const anime of airingAnime) {
        const update = await updateAnimeAiringInfo(anime);
        if (update) {
          updates.push(update);
        }
      }

      if (updates.length > 0) {
        log.info('Updated airing information for animes', { updates });
      }
    } catch (error) {
      log.error('Failed to run airing info updates', error);
    }
  });
};

export { runScheduledAnimeUpdates, runScheduledMangaUpdates, runScheduledAiringUpdates };
