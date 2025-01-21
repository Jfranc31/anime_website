/**
 * controllers/animeController.js
 * Description: Controller for handling anime-related operations.
 */

import AnimeModel from "../Models/animeModel.js";
import CharacterModel from "../Models/characterModel.js";
import MangaModel from "../Models/mangaModel.js";
import { getReverseRelationType } from "../functions.js";
import { fetchAnimeData } from "../services/anilistService.js";
import { updateAnimeFromAnilist, compareAnimeData, FORMAT_MAP } from "../services/updateService.js";

/**
 * @function getAllAnimes
 * @description Get all anime documents from the database.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @return {Array} - Array of anime documents.
 */
const getAllAnimes = async (req, res) => {
  try {
    const animes = await AnimeModel.find({});
    res.json(animes);
  } catch (error) {
    console.error("Error fetching animes:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @function getAnimeInfo
 * @description Get information about a specific anime.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @return {Object} - Anime document.
 */
const getAnimeInfo = async (req, res) => {
  try {
    const animeID = req.params.id;
    const anime = await AnimeModel.findById(animeID);
    if (!anime) {
      return res.status(404).json({ message: "Anime not found" });
    }
    res.json(anime);
  } catch (error) {
    console.error("Error fetching anime for page: ", error);
    res.status(500).json({ message: "internal Server Error" });
  }
};

/**
 * @function createAnime
 * @description Create a new anime document in the database.
 * @param {Object} req - Express request object with anime data.
 * @param {Object} res - Express response object.
 * @return {Object} - Created anime document.
 */
const createAnime = async (req, res) => {
  try {
    const {
      titles,
      releaseData,
      typings,
      lengths,
      genres,
      description,
      images,
      characters,
      mangaRelations,
      animeRelations,
      anilistId,
      nextAiringEpisode,
    } = req.body;

    const mangaRelationsArray = mangaRelations.map((relationInfo) => ({
      relationId: relationInfo.relationId,
      typeofRelation: relationInfo.typeofRelation,
    }));

    const animeRelationsArray = animeRelations.map((relationInfo) => ({
      relationId: relationInfo.relationId,
      typeofRelation: relationInfo.typeofRelation,
    }));

    const charactersArray = characters.map((characterInfo) => ({
      characterId: characterInfo.characterId,
      role: characterInfo.role,
      animeName:{
        romaji: titles.romaji || '',
        english: titles.english || '',
        native: titles.native || '',
      },
    }));

    const anime = await AnimeModel.create({
      titles,
      releaseData,
      lengths,
      typings,
      genres,
      description,
      images,
      characters: charactersArray,
      mangaRelations: mangaRelationsArray,
      animeRelations: animeRelationsArray,
      activityTimestamp: Date.now(),
      anilistId,
      nextAiringEpisode,
    });

    // Update characters with the anime ID
    const updatedCharacters = await Promise.all(
      charactersArray.map(async (characterInfo) => {
        const character = await CharacterModel.findByIdAndUpdate(
          characterInfo.characterId,
          {
            $push: {
              animes: {
                animeId: anime._id,
                role: characterInfo.role,
                animeName: {
                  romaji: titles.romaji || '',
                  english: titles.english || '',
                  native: titles.native || '',
                },
              },
            },
          },
          { new: true },
        );
        return character;
      }),
    );

    // Update related animes with reverse relations
    const updatedAnimeRelations = await Promise.all(
      animeRelationsArray.map(async (relationInfo) => {
        const relatedAnime = await AnimeModel.findById(relationInfo.relationId);
        if (relatedAnime) {
          const reverseRelationType = getReverseRelationType(relationInfo.typeofRelation);
          if (reverseRelationType) {
            // Add the reverse relation to the related anime
            await AnimeModel.findByIdAndUpdate(
              relationInfo.relationId,
              {
                $push: {
                  animeRelations: {
                    relationId: anime._id,
                    typeofRelation: reverseRelationType
                  }
                }
              }
            );
          }
        }
        return relatedAnime;
      })
    );

    // Update related mangas with reverse relations
    const updatedMangaRelations = await Promise.all(
      mangaRelationsArray.map(async (relationInfo) => {
        const reverseRelationType = getReverseRelationType(
          relationInfo.typeofRelation,
        );

        if (reverseRelationType) {
          const reverseRelationManga = await MangaModel.findByIdAndUpdate(
            relationInfo.relationId,
            {
              $push: {
                animeRelations: {
                  relationId: anime._id,
                  typeofRelation: reverseRelationType,
                },
              },
            },
            { new: true },
          );
          return [anime, reverseRelationManga];
        } else {
          return anime;
        }
      }),
    );

    res
      .status(201)
      .json({
        ...anime._doc,
        characters: updatedCharacters,
        animeRelations: updatedAnimeRelations.flat(),
        mangaRelations: updatedMangaRelations.flat(),
      });

  } catch (error) {
    console.error("Error creating anime:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @function updateAnime
 * @description Update an existing anime document in the database.
 * @param {Object} req - Express request object with updated anime data.
 * @param {Object} res - Express response object.
 * @return {Object} - Updated anime document.
 */
const updateAnime = async (req, res) => {
  const { id } = req.params;

  try {
    const {
      characters,
      mangaRelations,
      animeRelations,
      nextAiringEpisode,
      titles,  // Make sure titles is destructured from req.body
      ...otherFields
    } = req.body;

    // Validate required data
    if (!titles) {
      console.error('Titles object is missing from request body');
      return res.status(400).json({
        error: "Missing required field: titles",
        receivedBody: req.body
      });
    }

    // Log the character updates being attempted
    console.log('Processing character updates:', {
      characterCount: characters?.length || 0,
      characters: characters
    });

    // Validate characters array
    if (!Array.isArray(characters)) {
      console.error('Characters is not an array:', characters);
      return res.status(400).json({
        error: "Characters must be an array",
        received: typeof characters
      });
    }

    // Filter out characters with empty characterId
    const validCharacters = characters.filter(
      (character) => character.characterId,
    );
    const validMangaRelations = mangaRelations.filter(
      (relation) => relation.relationId,
    );
    const validAnimeRelations = animeRelations.filter(
      (relation) => relation.relationId,
    );

    // Update the anime, excluding characters with empty characterId
    const updatedAnime = await AnimeModel.findByIdAndUpdate(
      id,
      { ...otherFields, characters: validCharacters },
      {
        new: true, // Return the modified document
        runValidators: true, // Run validators for update operations
      },
    );

    if (!updatedAnime) {
      return res.status(404).json({ error: "Anime not found" });
    }

    // Update characters, adding new characters if they don't have the animeId already
    const updatedCharacters = await Promise.all(
      validCharacters.map(async (characterInfo) => {
        const { characterId, role } = characterInfo;

        // Use updateOne to atomically update the document
        var existingCharacter = await CharacterModel.findOne({
          _id: characterId,
          "animes.animeId": id, // Ensure animeId is not already present
        });

        // Check if the document was modified (i.e., updated)
        if (!existingCharacter) {
          // Document was updated, return the updated character
          existingCharacter = await CharacterModel.findByIdAndUpdate(
            characterId,
            {
              $push: {
                animes: {
                  animeId: id,
                  role: role,
                  animeName: {
                    romaji: titles.romaji || '',
                    english: titles.english || '',
                    native: titles.native || '',
                  },
                },
              },
            },
            { new: true, upsert: true },
          );
        } else {
          // Update both the role and animeName of the character
          const animeEntry = existingCharacter.animes.find(
            (anime) => String(anime.animeId) === id
          );
          if (animeEntry) {
            animeEntry.role = role;
            animeEntry.animeName = [
              {
                romaji: titles.romaji || '',
                english: titles.english || '',
                native: titles.native || '',
              },
            ];
          }
          existingCharacter = await existingCharacter.save();
        }

        return existingCharacter;
      }),
    );

    // Update relations
    const updatedAnimeRelations = await Promise.all(
      validAnimeRelations.map(async (relationInfo) => {
        const { relationId, typeofRelation } = relationInfo;

        // Update the relation on the current anime
        let animeRelationResult = await AnimeModel.updateOne(
          {
            _id: id,
            "animeRelations.relationId": relationId,
          },
          {
            $set: {
              "animeRelations.$.typeofRelation": typeofRelation,
            },
          },
        );

        // Check if the document was modified (i.e., updated)
        if (animeRelationResult.nModified > 0) {
          // Document was updated, return the updated relation
          const updatedAnime = await AnimeModel.findById(id);
          return updatedAnime.animeRelations.find(
            (r) => String(r.relationId) === String(relationId),
          );
        } else if (animeRelationResult.matchedCount === 0) {
          const reverseRelationType = getReverseRelationType(typeofRelation.replace(/\s/g, ''));
          animeRelationResult = await AnimeModel.findByIdAndUpdate(
            id,
            {
              $push: {
                animeRelations: {
                  relationId: relationId,
                  typeofRelation: typeofRelation,
                },
              },
            },
            { new: true },
          );

          // Handle the opposite relation for the related anime
          const reverseRelationAnime = await AnimeModel.findByIdAndUpdate(
            relationId,
            {
              $push: {
                animeRelations: {
                  relationId: id,
                  typeofRelation: reverseRelationType,
                },
              },
            },
            { new: true },
          );

          // Return both the updated relation on the current anime and the reverse anime
          return [
            animeRelationResult,
            reverseRelationAnime
              ? reverseRelationAnime.animeRelations.find(
                  (r) => String(r.relationId) === String(id),
                )
              : null,
          ];
        } else {
          // Document was not updated, try updating the reverse relation on the related anime
          const reverseRelationAnime = await AnimeModel.findOneAndUpdate(
            {
              "animeRelations.relationId": id,
            },
            {
              $set: {
                "animeRelations.$.typeofRelation":
                  getReverseRelationType(typeofRelation.replace(/\s/g, '')),
              },
            },
            { new: true },
          );

          // Return both the updated relation on the current anime and the reverse relation anime
          return [
            animeRelationResult,
            reverseRelationAnime
              ? reverseRelationAnime.animeRelations.find(
                  (r) => String(r.relationId) === String(id),
                )
              : null,
          ];
        }
      }),
    );

    const updatedMangaRelations = await Promise.all(
      validMangaRelations.map(async (relationInfo) => {
        const { relationId, typeofRelation } = relationInfo;

        // update the relation on the current anime
        let mangaRelationResult = await AnimeModel.updateOne(
          {
            _id: id,
            "mangaRelations.relationId": relationId,
          },
          {
            $set: {
              "mangaRelations.$.typeofRelation": typeofRelation,
            },
          },
        );

        // Check if the document was modified (i.e., updated)
        if (mangaRelationResult.nModified > 0) {
          // Document was updated, return the updated relation
          const updatedAnime = await AnimeModel.findById(id);
          return updatedAnime.mangaRelations.find(
            (r) => String(r.relationId) === String(relationId),
          );
        } else if (mangaRelationResult.matchedCount === 0) {
          const reverseRelationType = getReverseRelationType(typeofRelation.replace(/\s/g, ''));
          mangaRelationResult = await AnimeModel.findByIdAndUpdate(
            id,
            {
              $push: {
                mangaRelations: {
                  relationId: relationId,
                  typeofRelation: typeofRelation,
                },
              },
            },
            { new: true },
          );

          // Handle the opposite relation for the related manga
          const reverseRelationManga = await MangaModel.findByIdAndUpdate(
            relationId,
            {
              $push: {
                animeRelations: {
                  relationId: id,
                  typeofRelation: reverseRelationType,
                },
              },
            },
            { new: true },
          );

          // Return both the updated relation on the current manga and the reverse manga
          return [
            mangaRelationResult,
            reverseRelationManga
              ? reverseRelationManga.animeRelations.find(
                  (r) => String(r.relationId) === String(id),
                )
              : null,
          ];
        } else {
          // Document was not updated, try updating the reverse relation on the related manga
          const reverseRelationManga = await MangaModel.findOneAndUpdate(
            {
              "animeRelations.relationId": id,
            },
            {
              $set: {
                "animeRelations.$.typeofRelation":
                  getReverseRelationType(typeofRelation),
              },
            },
            { new: true },
          );

          // Return both the updated relation on the current manga and the reverse relation for manga
          return [
            mangaRelationResult,
            reverseRelationManga
              ? reverseRelationManga.mangaRelations.find(
                  (r) => String(r.relationId) === String(id),
                )
              : null,
          ];
        }
      }),
    );

    res
      .status(200)
      .json({
        ...updatedAnime._doc,
        characters: updatedCharacters.filter(Boolean),
        mangaRelations: updatedMangaRelations.flat(),
        animeRelations: updatedAnimeRelations.flat(),
      });
    } catch (error) {
      // Enhanced error logging
      console.error("Error updating anime:", {
        error: error.message,
        stack: error.stack,
        animeId: id,
        requestBody: req.body
      });

      // More specific error response
      res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
};

/**
 * @function createAnimeFromAnilist
 * @description Get all anime documents from AniList database matching search result.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @return {Array} - Array of anime documents.
 */
const createAnimeFromAnilist = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const anilistResults = await fetchAnimeData(title);
    if (!anilistResults) {
      return res.status(404).json({ message: `No anime found on AniList matching "${title}"` });
    }

    // Map AniList status to our status
    const statusMap = {
      'FINISHED': 'Finished Releasing',
      'RELEASING': 'Currently Releasing',
      'NOT_YET_RELEASED': 'Not Yet Released',
      'CANCELLED': 'Cancelled',
      'HIATUS': 'Hiatus'
    };

    // Map AniList source to our source
    const sourceMap = {
      'MANGA': 'Manga',
      'ORIGINAL': 'Original',
      'MOVIE': 'Movie',
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
    const countryMap = {
      'JP': 'Japan',
      'KR': 'South Korea',
      'CN': 'China',
      'TW': 'Taiwan'
    };

    const animeList = anilistResults.map((anilistData) => ({
      anilistId: anilistData.id.toString(),
      titles: {
        romaji: anilistData.title?.romaji || '',
        english: anilistData.title?.english || '',
        native: anilistData.title?.native || ''
      },
      releaseData: {
        releaseStatus: statusMap[anilistData.status] || 'Currently Releasing',
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
      typings: {
        Format: FORMAT_MAP[anilistData.format] || '',
        Source: sourceMap[anilistData.source] || 'Original',
        CountryOfOrigin: countryMap[anilistData.countryOfOrigin] || 'Japan'
      },
      lengths: {
        Episodes: anilistData.episodes?.toString() || '',
        EpisodeDuration: anilistData.duration?.toString() || ''
      },
      genres: anilistData.genres || [],
      description: anilistData.description || '',
      images: {
        image: anilistData.coverImage?.large || '',
        border: anilistData?.bannerImage
      },
      characters: [],
      animeRelations: [],
      mangaRelations: [],
      nextAiringEpisode: anilistData.nextAiringEpisode,
      activityTimestamp: Date.now()
    }));

    res.status(201).json(animeList);
  } catch (error) {
    if (error.message === 'SERVICE_UNAVAILABLE') {
      return res.status(503).json({
        message: 'AniList API is temporarily unavailable. Please try again later.',
        retryAfter: 300 // 5 minutes
      });
    } else {
      console.error('Error creating anime from AniList:', error);
    }
    res.status(500).json({
      message: 'Error creating anime from AniList',
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * @function compareAnimeWithAnilist
 * @description Compare the anime from the database with the AniList database.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @return {Array} - Array of differences.
 */
const compareAnimeWithAnilist = async (req, res) => {
  try {
    const { id } = req.params;
    const anime = await AnimeModel.findById(id);

    if (!anime) {
      return res.status(404).json({ message: 'Anime not found' });
    }

    const differences = await compareAnimeData(anime);
    if (!differences) {
      return res.status(400).json({ message: 'Failed to compare anime with AniList' });
    }

    res.json(differences);
  } catch (error) {
    console.error('Error comparing anime with AniList:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @function updateAnimeAnilist
 * @description Get all anime documents from AniList database matching search result.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @return {Array} - Array of anime documents.
 */
const updateAnimeAnilist = async (req, res) => {
  try {
    const anime = await AnimeModel.findById(req.params.id);
    if (!anime) {
      return res.status(404).json({ message: 'Anime not found' });
    }

    const updatedAnime = await updateAnimeFromAnilist(anime);
    if (!updatedAnime) {
      return res.status(400).json({ message: 'Failed to update from AniList' });
    }

    res.json(updatedAnime);
  } catch (error) {
    console.error('Error updating anime from AniList:', error);
    res.status(500).json({ message: 'Error updating anime from AniList' });
  }
};

export {
  getAllAnimes,
  getAnimeInfo,
  createAnime,
  updateAnime,
  createAnimeFromAnilist,
  compareAnimeWithAnilist,
  updateAnimeAnilist
};
