import { fetchAnimeDataById, fetchMangaDataById } from './anilistService.js';
import AnimeModel from '../Models/animeModel.js';
import MangaModel from '../Models/mangaModel.js';

// Map AniList status to our status
const STATUS_MAP = {
  'RELEASING': 'Currently Releasing',
  'FINISHED': 'Finished Releasing',
  'NOT_YET_RELEASED': 'Not Yet Released',
  'CANCELLED': 'Cancelled',
  'HIATUS': 'Hiatus'
};

// Map AniList format to our format
const FORMAT_MAP = {
  'MANGA': 'Manga',
  'LIGHT NOVEL': 'Light Novel',
  'ONE_SHOT': 'One Shot'
};

// Map AniList source to our source
const SOURCE_MAP = {
  'MANGA': 'Manga',
  'ORIGINAL': 'Original',
  'LIGHT_NOVEL': 'Light Novel',
  'VISUAL_NOVEL': 'Visual Novel',
  'VIDEO_GAME': 'Video Game',
  'OTHER': 'Other',
  'NOVEL': 'Novel',
  'DOUJINSHI': 'Doujinshi',
  'ANIME': 'Anime',
  'ONE_SHOT': 'One Shot'
};

// Map country codes to full names
const COUNTRY_MAP = {
  'JP': 'Japan',
  'KR': 'South Korea',
  'CN': 'China',
  'TW': 'Taiwan'
};

const compareAnimeData = async (anime) => {
  try {
    const anilistData = await fetchAnimeDataById(anime.anilistId);
    if (!anilistData) return null;

    // Compare and return differences
    const differences = {
      titles: {
        current: {
          romaji: anime.titles.romaji,
          english: anime.titles.english,
          native: anime.titles.native
        },
        anilist: {
          romaji: anilistData.title.romaji,
          english: anilistData.title.english,
          native: anilistData.title.native
        },
        isDifferent: JSON.stringify({
          romaji: anime.titles.romaji,
          english: anime.titles.english,
          native: anime.titles.native
        }) !==
          JSON.stringify({
            romaji: anilistData.title.romaji,
            english: anilistData.title.english,
            native: anilistData.title.native
          })
      },
      typings: {
        current: {
          Format: anime.typings.Format || '',
          Source: anime.typings.Source || '',
          CountryOfOrigin: anime.typings.CountryOfOrigin || ''
        },
        anilist: {
          Format: anilistData.format || '',
          Source: SOURCE_MAP[anilistData.source] || '',
          CountryOfOrigin: COUNTRY_MAP[anilistData.countryOfOrigin] || ''
        },
        isDifferent:
          (anime.typings.Format || '') !== (anilistData.format || '') ||
          (anime.typings.Source || '') !== (SOURCE_MAP[anilistData.source] || '') ||
          (anime.typings.CountryOfOrigin || '') !== (COUNTRY_MAP[anilistData.countryOfOrigin] || '')
      },
      description: {
        current: anime.description,
        anilist: anilistData.description,
        isDifferent: anime.description !== anilistData.description
      },
      releaseData: {
        current: {
          releaseStatus: anime.releaseData.releaseStatus,
          startDate: anime.releaseData.startDate,
          endDate: anime.releaseData.endDate
        },
        anilist: {
          releaseStatus: STATUS_MAP[anilistData.status] || 'Currently Releasing',
          startDate: {
            year: anilistData.startDate?.year?.toString() || '',
            month: anilistData.startDate?.month?.toString() || '',
            day: anilistData.startDate?.day?.toString() || ''
          },
          endDate: {
            year: anilistData.endDate?.year?.toString() || '',
            month: anilistData.endDate?.month?.toString() || '',
            day: anilistData.endDate?.day?.toString() || ''
          }
        },
        isDifferent: anime.releaseData.releaseStatus !== STATUS_MAP[anilistData.status] ||
          JSON.stringify(anime.releaseData.startDate) !== JSON.stringify({
            year: anilistData.startDate?.year?.toString() || '',
            month: anilistData.startDate?.month?.toString() || '',
            day: anilistData.startDate?.day?.toString() || ''
          }) ||
          JSON.stringify(anime.releaseData.endDate) !== JSON.stringify({
            year: anilistData.endDate?.year?.toString() || '',
            month: anilistData.endDate?.month?.toString() || '',
            day: anilistData.endDate?.day?.toString() || ''
          })
      },
      lengths: {
        current: anime.lengths,
        anilist: {
          Episodes: anilistData.episodes?.toString() || '',
          EpisodeDuration: anilistData.duration?.toString() || ''
        },
        isDifferent: anime.lengths.Episodes !== anilistData.episodes?.toString() ||
          anime.lengths.EpisodeDuration !== anilistData.duration?.toString()
      },
      genres: {
        current: anime.genres,
        anilist: anilistData.genres,
        isDifferent: JSON.stringify(anime.genres.sort()) !== JSON.stringify(anilistData.genres.sort())
      },
      images: {
        current: anime.images.image,
        anilist: anilistData.coverImage.large,
        isDifferent: anime.images.image !== anilistData.coverImage.large
      },
    };

    console.log('CompareAnimeData - Detailed Differences:', {
      titles: {
        current: differences.titles.current,
        anilist: differences.titles.anilist,
        isDifferent: differences.titles.isDifferent
      },
      typings: {
        current: differences.typings.current,
        anilist: differences.typings.anilist,
        isDifferent: differences.typings.isDifferent
      },
      description: {
        current: differences.description.current,
        anilist: differences.description.anilist,
        isDifferent: differences.description.isDifferent
      },
      releaseData: {
        current: differences.releaseData.current,
        anilist: differences.releaseData.anilist,
        isDifferent: differences.releaseData.isDifferent
      },
      lengths: {
        current: differences.lengths.current,
        anilist: differences.lengths.anilist,
        isDifferent: differences.lengths.isDifferent
      },
      genres: {
        current: differences.genres.current,
        anilist: differences.genres.anilist,
        isDifferent: differences.genres.isDifferent
      },
      images: {
        current: differences.images.current,
        anilist: differences.images.anilist,
        isDifferent: differences.images.isDifferent
      },
      nextAiringEpisode: {
        current: differences.nextAiringEpisode.current,
        anilist: differences.nextAiringEpisode.anilist,
        isDifferent: differences.nextAiringEpisode.isDifferent
      }
    });

    return differences;
  } catch (error) {
    console.error('Error comparing anime data:', error);
    return null;
  }
};

const updateAnimeFromAnilist = async (anime) => {
  try {
    const anilistData = await fetchAnimeDataById(anime.anilistId);
    if (!anilistData) {
      console.warn(`No data found for anime ID: ${anime.anilistId}`);
      return null;
    }

    const updateData = {
      releaseData: {
        releaseStatus: STATUS_MAP[anilistData.status],
        startDate: {
          year: anilistData.startDate?.year?.toString() || '',
          month: anilistData.startDate?.month?.toString() || '',
          day: anilistData.startDate?.day?.toString() || ''
        },
        endDate: {
          year: anilistData.endDate?.year?.toString() || '',
          month: anilistData.endDate?.month?.toString() || '',
          day: anilistData.endDate?.day?.toString() || ''
        },
      },
      lengths: {
        Episodes: anilistData.episodes?.toString() || '',
        EpisodeDuration: anilistData.duration?.toString() || ''
      },
      genres: anilistData.genres,
      description: anilistData.description,
      activityTimestamp: Date.now(),
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

const compareMangaData = async (manga) => {
  try {
    const anilistData = await fetchMangaDataById(manga.anilistId);
    if (!anilistData) return null;

    // Compare and return differences
    const differences = {
      titles: {
        current: {
          romaji: manga.titles.romaji,
          english: manga.titles.english,
          native: manga.titles.native
        },
        anilist: {
          romaji: anilistData.title.romaji,
          english: anilistData.title.english,
          native: anilistData.title.native
        },
        isDifferent: JSON.stringify({
          romaji: manga.titles.romaji,
          english: manga.titles.english,
          native: manga.titles.native
        }) !==
          JSON.stringify({
            romaji: anilistData.title.romaji,
            english: anilistData.title.english,
            native: anilistData.title.native
          })
      },
      typings: {
        current: {
          Format: manga.typings.Format || '',
          Source: manga.typings.Source || '',
          CountryOfOrigin: manga.typings.CountryOfOrigin || ''
        },
        anilist: {
          Format: FORMAT_MAP[anilistData.format] || '',
          Source: SOURCE_MAP[anilistData.source] || '',
          CountryOfOrigin: COUNTRY_MAP[anilistData.countryOfOrigin] || ''
        },
        isDifferent:
          (manga.typings.Format || '') !== (FORMAT_MAP[anilistData.format] || '') ||
          (manga.typings.Source || '') !== (SOURCE_MAP[anilistData.source] || '') ||
          (manga.typings.CountryOfOrigin || '') !== (COUNTRY_MAP[anilistData.countryOfOrigin] || '')
      },
      description: {
        current: manga.description,
        anilist: anilistData.description,
        isDifferent: manga.description !== anilistData.description
      },
      releaseData: {
        current: {
          releaseStatus: manga.releaseData.releaseStatus,
          startDate: manga.releaseData.startDate,
          endDate: manga.releaseData.endDate
        },
        anilist: {
          releaseStatus: STATUS_MAP[anilistData.status] || 'Currently Releasing',
          startDate: {
            year: anilistData.startDate?.year?.toString() || '',
            month: anilistData.startDate?.month?.toString() || '',
            day: anilistData.startDate?.day?.toString() || ''
          },
          endDate: {
            year: anilistData.endDate?.year?.toString() || '',
            month: anilistData.endDate?.month?.toString() || '',
            day: anilistData.endDate?.day?.toString() || ''
          }
        },
        isDifferent: manga.releaseData.releaseStatus !== STATUS_MAP[anilistData.status] ||
          JSON.stringify(manga.releaseData.startDate) !== JSON.stringify({
            year: anilistData.startDate?.year?.toString() || '',
            month: anilistData.startDate?.month?.toString() || '',
            day: anilistData.startDate?.day?.toString() || ''
          }) ||
          JSON.stringify(manga.releaseData.endDate) !== JSON.stringify({
            year: anilistData.endDate?.year?.toString() || '',
            month: anilistData.endDate?.month?.toString() || '',
            day: anilistData.endDate?.day?.toString() || ''
          })
      },
      lengths: {
        current: manga.lengths,
        anilist: {
          Chapters: anilistData.chapters?.toString() || '',
          Volumes: anilistData.volumes?.toString() || ''
        },
        isDifferent: manga.lengths.Chapters !== anilistData.chapters?.toString() ||
          manga.lengths.Volumes !== anilistData.volumes?.toString()
      },
      genres: {
        current: manga.genres,
        anilist: anilistData.genres,
        isDifferent: JSON.stringify(manga.genres.sort()) !== JSON.stringify(anilistData.genres.sort())
      },
      images: {
        current: manga.images.image,
        anilist: anilistData.coverImage.large,
        isDifferent: manga.images.image !== anilistData.coverImage.large
      }
    };

    return differences;
  } catch (error) {
    console.error('Error comparing manga data:', error);
    return null;
  }
};

const updateMangaFromAnilist = async (manga) => {
  try {
    const anilistData = await fetchMangaDataById(manga.anilistId);
    if (!anilistData) return null;

    const updateData = {
      releaseData: {
        releaseStatus: anilistData.status,
        startDate: anilistData.startDate,
        endDate: anilistData.endDate
      },
      lengths: {
        Chapters: anilistData.chapters,
        Volumes: anilistData.volumes
      },
      genres: anilistData.genres,
      activityTimestamp: Date.now()
    };

    return await MangaModel.findByIdAndUpdate(
      manga._id,
      updateData,
      { new: true }
    );
  } catch (error) {
    console.error('Error updating manga from AniList:', error);
    return null;
  }
};

// Export all functions
export {
  compareAnimeData,
  updateAnimeFromAnilist,
  compareMangaData,
  updateMangaFromAnilist
};
