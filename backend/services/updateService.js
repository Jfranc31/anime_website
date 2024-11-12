import { fetchAnimeData } from './anilistService.js';
import AnimeModel from '../Models/animeModel.js';

const updateAnimeFromAnilist = async (anime) => {
  try {
    const anilistData = await fetchAnimeData(anime.titles.english);
    
    if (!anilistData) return null;

    const updateData = {
      anilistId: anilistData.id,
      titles: {
        romaji: anilistData.title.romaji,
        english: anilistData.title.english,
        Native: anilistData.title.native
      },
      releaseData: {
        releaseStatus: anilistData.status,
        startDate: anilistData.startDate,
        endDate: anilistData.endDate
      },
      typings: {
        Format: anilistData.format,
        Source: anilistData.source,
        CountryOfOrigin: anilistData.countryOfOrigin
      },
      lengths: {
        Episodes: anilistData.episodes,
        EpisodeDuration: anilistData.duration
      },
      genres: anilistData.genres,
      description: anilistData.description,
      images: {
        image: anilistData.coverImage.large,
        border: anime.images.border // Keep existing border
      },
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

export { updateAnimeFromAnilist }; 