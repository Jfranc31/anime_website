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
  'TV': 'TV',
  'TV_SHORT': 'TV Short',
  'MOVIE': 'Movie',
  'SPECIAL': 'Special',
  'OVA': 'OVA',
  'ONA': 'ONA',
  'MUSIC': 'Music',
  'MANGA': 'Manga',
  'NOVEL': 'Light Novel',
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
          romaji: anime.titles.romaji || '',
          english: anime.titles.english || '',
          native: anime.titles.native || ''
        },
        anilist: {
          romaji: anilistData.titles.romaji || '',
          english: anilistData.titles.english || '',
          native: anilistData.titles.native || ''
        },
        isDifferent: JSON.stringify({
          romaji: anime.titles.romaji,
          english: anime.titles.english,
          native: anime.titles.native
        }) !==
          JSON.stringify({
            romaji: anilistData.titles.romaji,
            english: anilistData.titles.english,
            native: anilistData.titles.native
          })
      },
      typings: {
        current: {
          Format: anime.typings.Format || '',
          Source: anime.typings.Source || '',
          CountryOfOrigin: anime.typings.CountryOfOrigin || ''
        },
        anilist: {
          Format: FORMAT_MAP[anilistData.typings.Format] || '',
          Source: SOURCE_MAP[anilistData.typings.Source] || '',
          CountryOfOrigin: COUNTRY_MAP[anilistData.typings.CountryOfOrigin] || ''
        },
        isDifferent:
          (anime.typings.Format || '') !== (anilistData.typings.Format || '') ||
          (anime.typings.Source || '') !== (SOURCE_MAP[anilistData.typings.Source] || '') ||
          (anime.typings.CountryOfOrigin || '') !== (COUNTRY_MAP[anilistData.typings.CountryOfOrigin] || '')
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
          releaseStatus: STATUS_MAP[anilistData.releaseData.releaseStatus] || 'Currently Releasing',
          startDate: {
            year: anilistData.releaseData.startDate?.year?.toString() || '',
            month: anilistData.releaseData.startDate?.month?.toString() || '',
            day: anilistData.releaseData.startDate?.day?.toString() || ''
          },
          endDate: {
            year: anilistData.releaseData.endDate?.year?.toString() || '',
            month: anilistData.releaseData.endDate?.month?.toString() || '',
            day: anilistData.releaseData.endDate?.day?.toString() || ''
          }
        },
        isDifferent: anime.releaseData.releaseStatus !== STATUS_MAP[anilistData.releaseData.releaseStatus] ||
          JSON.stringify(anime.releaseData.startDate) !== JSON.stringify({
            year: anilistData.releaseData.startDate?.year?.toString() || '',
            month: anilistData.releaseData.startDate?.month?.toString() || '',
            day: anilistData.releaseData.startDate?.day?.toString() || ''
          }) ||
          JSON.stringify(anime.releaseData.endDate) !== JSON.stringify({
            year: anilistData.releaseData.endDate?.year?.toString() || '',
            month: anilistData.releaseData.endDate?.month?.toString() || '',
            day: anilistData.releaseData.endDate?.day?.toString() || ''
          })
      },
      lengths: {
        current: anime.lengths,
        anilist: {
          Episodes: anilistData.lengths.Episodes?.toString() || '',
          EpisodeDuration: anilistData.lengths.EpisodeDuration?.toString() || ''
        },
        isDifferent: anime.lengths.Episodes !== anilistData.lengths.Episodes?.toString() ||
          anime.lengths.EpisodeDuration !== anilistData.lengths.EpisodeDuration?.toString()
      },
      genres: {
        current: anime.genres,
        anilist: anilistData.genres,
        isDifferent: JSON.stringify(anime.genres.sort()) !== JSON.stringify(anilistData.genres.sort())
      },
      images: {
        current: anime.images.image,
        anilist: anilistData.images.image,
        isDifferent: anime.images.image !== anilistData.images.image
      },
    };

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
      typings: {
        Format: FORMAT_MAP[anilistData.typings.Format] || anime.typings.Format,
        Source: SOURCE_MAP[anilistData.typings.Source] || anime.typings.Source,
        CountryOfOrigin: COUNTRY_MAP[anilistData.typings.CountryOfOrigin] || anime.typings.CountryOfOrigin
      },
      releaseData: {
        releaseStatus: STATUS_MAP[anilistData.releaseData.releaseStatus],
        startDate: {
          year: anilistData.releaseData.startDate?.year?.toString() || '',
          month: anilistData.releaseData.startDate?.month?.toString() || '',
          day: anilistData.releaseData.startDate?.day?.toString() || ''
        },
        endDate: {
          year: anilistData.releaseData.endDate?.year?.toString() || '',
          month: anilistData.releaseData.endDate?.month?.toString() || '',
          day: anilistData.releaseData.endDate?.day?.toString() || ''
        },
      },
      lengths: {
        Episodes: anilistData.lengths.Episodes?.toString() || '',
        EpisodeDuration: anilistData.lengths.EpisodeDuration?.toString() || ''
      },
      genres: anilistData.genres,
      description: anilistData.description,
      activityTimestamp: Date.now(),
      nextAiringEpisode: anilistData.nextAiringEpisode ? {
        airingAt: anilistData.nextAiringEpisode.airingAt?.toString() || null,
        episode: anilistData.nextAiringEpisode.episode?.toString() || null,
        timeUntilAiring: anilistData.nextAiringEpisode.timeUntilAiring?.toString() || null
      } : null
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
          romaji: anilistData.titles.romaji,
          english: anilistData.titles.english,
          native: anilistData.titles.native
        },
        isDifferent: JSON.stringify({
          romaji: manga.titles.romaji,
          english: manga.titles.english,
          native: manga.titles.native
        }) !==
          JSON.stringify({
            romaji: anilistData.titles.romaji,
            english: anilistData.titles.english,
            native: anilistData.titles.native
          })
      },
      typings: {
        current: {
          Format: manga.typings.Format || '',
          Source: manga.typings.Source || '',
          CountryOfOrigin: manga.typings.CountryOfOrigin || ''
        },
        anilist: {
          Format: FORMAT_MAP[anilistData.typings.Format] || '',
          Source: SOURCE_MAP[anilistData.typings.Source] || '',
          CountryOfOrigin: COUNTRY_MAP[anilistData.typings.CountryOfOrigin] || ''
        },
        isDifferent:
          (manga.typings.Format || '') !== (FORMAT_MAP[anilistData.typings.Format] || '') ||
          (manga.typings.Source || '') !== (SOURCE_MAP[anilistData.typings.Source] || '') ||
          (manga.typings.CountryOfOrigin || '') !== (COUNTRY_MAP[anilistData.typings.CountryOfOrigin] || '')
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
          releaseStatus: STATUS_MAP[anilistData.releaseData.releaseStatus] || 'Currently Releasing',
          startDate: {
            year: anilistData.releaseData.startDate?.year?.toString() || '',
            month: anilistData.releaseData.startDate?.month?.toString() || '',
            day: anilistData.releaseData.startDate?.day?.toString() || ''
          },
          endDate: {
            year: anilistData.releaseData.endDate?.year?.toString() || '',
            month: anilistData.releaseData.endDate?.month?.toString() || '',
            day: anilistData.releaseData.endDate?.day?.toString() || ''
          }
        },
        isDifferent: manga.releaseData.releaseStatus !== STATUS_MAP[anilistData.releaseData.releaseStatus] ||
          JSON.stringify(manga.releaseData.startDate) !== JSON.stringify({
            year: anilistData.releaseData.startDate?.year?.toString() || '',
            month: anilistData.releaseData.startDate?.month?.toString() || '',
            day: anilistData.releaseData.startDate?.day?.toString() || ''
          }) ||
          JSON.stringify(manga.releaseData.endDate) !== JSON.stringify({
            year: anilistData.releaseData.endDate?.year?.toString() || '',
            month: anilistData.releaseData.endDate?.month?.toString() || '',
            day: anilistData.releaseData.endDate?.day?.toString() || ''
          })
      },
      lengths: {
        current: manga.lengths,
        anilist: {
          Chapters: anilistData.lengths.Chapters?.toString() || '',
          Volumes: anilistData.lengths.Volumes?.toString() || ''
        },
        isDifferent: manga.lengths.Chapters !== anilistData.lengths.Chapters?.toString() ||
          manga.lengths.Volumes !== anilistData.lengths.Volumes?.toString()
      },
      genres: {
        current: manga.genres,
        anilist: anilistData.genres,
        isDifferent: JSON.stringify(manga.genres.sort()) !== JSON.stringify(anilistData.genres.sort())
      },
      images: {
        current: manga.images.image,
        anilist: anilistData.images.image,
        isDifferent: manga.images.image !== anilistData.images.image
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
    console.log("updateMangaFromAnilist - AniList Data: ", anilistData);
    if (!anilistData) {
      console.warn(`No data found for manga ID: ${manga.anilistId}`);
      return null;
    }

    const updateData = {
      typings: {
        Format: FORMAT_MAP[anilistData.typings.Format] || manga.typings.Format,
        Source: SOURCE_MAP[anilistData.typings.Source] || manga.typings.Source,
        CountryOfOrigin: COUNTRY_MAP[anilistData.typings.CountryOfOrigin] || manga.typings.CountryOfOrigin
      },
      releaseData: {
        releaseStatus: STATUS_MAP[anilistData.releaseData.releaseStatus],
        startDate: {
          year: anilistData.releaseData.startDate?.year?.toString() || '',
          month: anilistData.releaseData.startDate?.month?.toString() || '',
          day: anilistData.releaseData.startDate?.day?.toString() || ''
        },
        endDate: {
          year: anilistData.releaseData.endDate?.year?.toString() || '',
          month: anilistData.releaseData.endDate?.month?.toString() || '',
          day: anilistData.releaseData.endDate?.day?.toString() || ''
        },
      },
      lengths: {
        chapters: anilistData.lengths.Chapters === null ? '' : anilistData.lengths.Chapters.toString(),
        volumes: anilistData.lengths.Volumes === null ? '' : anilistData.lengths.Volumes.toString()
      },
      genres: anilistData.genres,
      description: anilistData.description,
      activityTimestamp: Date.now()
    };

    console.log("Manga update data:", updateData);

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
  updateMangaFromAnilist,
  FORMAT_MAP,
  SOURCE_MAP,
  STATUS_MAP,
  COUNTRY_MAP
};
