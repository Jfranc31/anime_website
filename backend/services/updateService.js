import { fetchAnimeDataById } from './anilistService.js';
import AnimeModel from '../Models/animeModel.js';

const compareAnimeData = async (anime) => {
  try {
    const anilistData = await fetchAnimeDataById(anime.anilistId);
    if (!anilistData) return null;

    // Compare and return differences
    const differences = {
      releaseData: {
        current: anime.releaseData,
        anilist: {
          releaseStatus: anilistData.status,
          startDate: anilistData.startDate,
          endDate: anilistData.endDate
        },
        isDifferent: anime.releaseData.releaseStatus !== anilistData.status ||
          JSON.stringify(anime.releaseData.startDate) !== JSON.stringify(anilistData.startDate) ||
          JSON.stringify(anime.releaseData.endDate) !== JSON.stringify(anilistData.endDate)
      },
      lengths: {
        current: anime.lengths,
        anilist: {
          Episodes: anilistData.episodes,
          EpisodeDuration: anilistData.duration
        },
        isDifferent: anime.lengths.Episodes !== anilistData.episodes ||
          anime.lengths.EpisodeDuration !== anilistData.duration
      },
      genres: {
        current: anime.genres,
        anilist: anilistData.genres,
        isDifferent: JSON.stringify(anime.genres.sort()) !== JSON.stringify(anilistData.genres.sort())
      }
    };

    return differences;
  } catch (error) {
    console.error('Error comparing anime data:', error);
    return null;
  }
};

const updateAnimeSelectively = async (animeId, fieldsToUpdate) => {
  try {
    const anime = await AnimeModel.findById(animeId);
    if (!anime) return null;

    const anilistData = await fetchAnimeDataById(anime.anilistId);
    if (!anilistData) return null;

    const updateData = {};

    // Only update selected fields
    if (fieldsToUpdate.includes('releaseData')) {
      updateData.releaseData = {
        releaseStatus: anilistData.status,
        startDate: anilistData.startDate,
        endDate: anilistData.endDate
      };
    }

    if (fieldsToUpdate.includes('lengths')) {
      updateData.lengths = {
        Episodes: anilistData.episodes,
        EpisodeDuration: anilistData.duration
      };
    }

    if (fieldsToUpdate.includes('genres')) {
      updateData.genres = anilistData.genres;
    }

    return await AnimeModel.findByIdAndUpdate(
      animeId,
      updateData,
      { new: true }
    );
  } catch (error) {
    console.error('Error updating anime selectively:', error);
    return null;
  }
};

const updateAnimeFromAnilist = async (anime) => {
  try {
    const anilistData = await fetchAnimeDataById(anime.anilistId);
    if (!anilistData) return null;

    const updateData = {
      releaseData: {
        releaseStatus: anilistData.status,
        startDate: anilistData.startDate,
        endDate: anilistData.endDate
      },
      lengths: {
        Episodes: anilistData.episodes,
        EpisodeDuration: anilistData.duration
      },
      genres: anilistData.genres,
      activityTimestamp: Date.now()
    };
    
    return await AnimeModel.findByIdAndUpdate(
      anime._id,
      updateData,
      { new: true }
    );
  } catch (error) {
    console.error('Error updating anime from AniList:', error);
    return null;
  }
};

// Export all functions
export { 
  compareAnimeData, 
  updateAnimeSelectively,
  updateAnimeFromAnilist 
}; 