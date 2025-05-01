/**
 * controllers/mangaController.js
 * Description: Controller for handling manga-related operations.
 */

import MangaModel from "../Models/mangaModel.js";
import CharacterModel from "../Models/characterModel.js";
import AnimeModel from "../Models/animeModel.js";
import { getReverseRelationType } from "../functions.js";
import { fetchMangaData } from "../services/anilistService.js";
import { updateMangaFromAnilist, compareMangaData } from "../services/updateService.js";

/**
 * @function getAllManga
 * @description Get all manga documents from the database with optional search and filtering.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @return {Array} - Array of manga documents.
 */
const getAllManga = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';
    const genres = req.query.genres ? req.query.genres.split(',') : [];
    const formats = req.query.formats ? req.query.formats.split(',') : [];
    const status = req.query.status || '';
    const year = req.query.year || '';

    // Build the query object
    const query = {};

    // Add search query if provided
    if (searchQuery) {
      query.$or = [
        { 'titles.english': { $regex: searchQuery, $options: 'i' } },
        { 'titles.romaji': { $regex: searchQuery, $options: 'i' } },
        { 'titles.native': { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Add genre filter if provided
    if (genres.length > 0) {
      query.genres = { $all: genres };
    }

    // Add format filter if provided
    if (formats.length > 0) {
      query['typings.Format'] = { $in: formats };
    }

    // Add status filter if provided
    if (status) {
      query['releaseData.releaseStatus'] = status;
    }

    // Add year filter if provided
    if (year) {
      query['releaseData.startDate.year'] = parseInt(year);
    }

    // First get the total count
    const total = await MangaModel.countDocuments(query);

    // Then get the paginated results
    const mangas = await MangaModel.find(query)
      .sort({ 'titles.english': 1 }) // Sort by English title
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      mangas,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching mangas:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const checkForManga = async (req, res) => {
  try {
    const { anilistId } = req.body;

    console.log("checking for manga: ", anilistId);

    if (!anilistId || isNaN(Number(anilistId))) {
      return res.status(400).json({ message: "invalid anilistId"});
    }

    const manga = await MangaModel.findOne({ anilistId: Number(anilistId) });

    if (!manga) {
      return res.status(200).json(false);
    }
    res.status(200).json(true);
  } catch (error) {
    console.error("Error checking if manga exists: ", error.message);
    res.status(500).json({ message: "internal Server Error" });
  }
};

/**
 * @function getMangaInfo
 * @description Get information about a specific manga.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @return {Object} - Manga document.
 */
const getMangaInfo = async (req, res) => {
  try {
    const mangaID = req.params.id;
    const manga = await MangaModel.findById(mangaID);
    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }
    res.json(manga);
  } catch (error) {
    console.error("Error fetching manga for page: ", error);
    res.status(500).json({ message: "internal Server Error" });
  }
};

const findMangaInfo = async (req, res) => {
  try {
    const anilistId = req.params.id;
    const manga = await MangaModel.findOne({ anilistId });
    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }
    res.json(manga);
  } catch (error) {
    console.error("Error fetching manga for page: ", error);
    res.status(500).json({ message: "internal Server Error" });
  }
};

/**
 * @function createManga
 * @description Create a new manga document in the database.
 * @param {Object} req - Express request object with manga data.
 * @param {Object} res - Express response object.
 * @return {Object} - Created manga document.
 */
const createManga = async (req, res) => {
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
    } = req.body;

    const mangaRelationsArray = mangaRelations.map((relationInfo) => ({
      relationId: relationInfo.relationId,
      typeofRelation: relationInfo.typeofRelation,
    }));

    const animeRelationsArray = animeRelations.map((relationInfo) => ({
      relationId: relationInfo.relationId,
      typeofRelation: relationInfo.typeofRelation,
    }));

    // Assuming characters is an array of character objects
    const charactersArray = characters.map((characterInfo) => ({
      characterId: characterInfo.characterId,
      role: characterInfo.role, // Assuming the type of character is provided in the request
      mangaName: {
        romaji: titles.romaji || '',
        english: titles.english || '',
        native: titles.native || '',
      },
    }));

    const manga = await MangaModel.create({
      titles,
      releaseData,
      typings,
      lengths,
      genres,
      description,
      images,
      characters: charactersArray,
      mangaRelations: mangaRelationsArray,
      animeRelations: animeRelationsArray,
      activityTimestamp: Date.now(),
      anilistId,
    });

    // Update characters with the manga ID
    const updatedCharacters = await Promise.all(
      charactersArray.map(async (characterInfo) => {
        const character = await CharacterModel.findByIdAndUpdate(
          characterInfo.characterId,
          {
            $push: {
              mangas: {
                mangaId: manga._id,
                role: characterInfo.role,
                mangaName: {
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

    // Update relations with the anime ID
    const updatedAnimeRelations = await Promise.all(
      animeRelationsArray.map(async (relationInfo) => {
        const reverseRelationType = getReverseRelationType(
          relationInfo.typeofRelation,
        );

        if (reverseRelationType) {
          const reverseRelationAnime = await AnimeModel.findByIdAndUpdate(
            relationInfo.relationId,
            {
              $push: {
                mangaRelations: {
                  relationId: manga._id,
                  typeofRelation: reverseRelationType,
                },
              },
            },
            { new: true },
          );
          return [manga, reverseRelationAnime];
        } else {
          return manga;
        }
      }),
    );

    // Update relations with the manga ID
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
                mangaRelations: {
                  relationId: manga._id,
                  typeofRelation: reverseRelationType,
                },
              },
            },
            { new: true },
          );
          return [manga, reverseRelationManga];
        } else {
          return manga;
        }
      }),
    );

    res
      .status(201)
      .json({
        ...manga._doc,
        characters: updatedCharacters,
        animeRelations: updatedAnimeRelations.flat(),
        mangaRelations: updatedMangaRelations.flat(),
      });
  } catch (error) {
    console.error("Error during manga creation:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};

/**
 * @function updateManga
 * @description Update an existing manga document in the database.
 * @param {Object} req - Express request object with updated manga data.
 * @param {Object} res - Express response object.
 * @return {Object} - Success message.
 */
const updateManga = async (req, res) => {
  const { id } = req.params;

  try {
    const {
      characters,
      mangaRelations,
      animeRelations,
      titles,
      ...otherFields
    } = req.body;

    console.log("Titles: ", titles);

    // Validate required data
    if (!titles) {
      console.error('Titles object is missing from request body');
      return res.status(400).json({
        error: "Missing required field: titles",
        receivedBody: req.body
      });
    }

    // Log the character updates being attempted
    // console.log('Processing character updates:', {
    //   characterCount: characters?.length || 0,
    //   characters: characters
    // });

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

    // Update the manga, excluding characters with empty characterId
    const updatedManga = await MangaModel.findByIdAndUpdate(
      id,
      { ...otherFields, titles: titles, characters: validCharacters },
      {
        new: true, // Return the modified document
        runValidators: true, // Run validators for update operations
      },
    );

    if (!updatedManga) {
      return res.status(404).json({ error: "Manga not found" });
    }

    // Update characters, adding new characters if they don't have the mangaId already
    const updatedCharacters = await Promise.all(
      validCharacters.map(async (characterInfo) => {
        const { characterId, role } = characterInfo;

        // Use updateOne to atomically update the document
        var existingCharacter = await CharacterModel.findOne({
          _id: characterId,
          "mangas.mangaId": id, // Ensure mangaId is not already present
        });

        // Check if the document was modified (i.e., updated)
        if (!existingCharacter) {
          // Document was updated, return the updated character
          existingCharacter = await CharacterModel.findByIdAndUpdate(
            characterId,
            {
              $push: {
                mangas: {
                  mangaId: id,
                  role: role,
                  mangaName: {
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
          const mangaEntry = existingCharacter.mangas.find(
            (manga) => String(manga.mangaId) === id
          );
          if (mangaEntry) {
            mangaEntry.role = role;
            mangaEntry.mangaName = [
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

        // Update the relation on the current manga
        let animeRelationResult = await MangaModel.updateOne(
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
          const updatedManga = await MangaModel.findById(id);
          return updatedManga.mangaRelations.find(
            (r) => String(r.relationId) === String(relationId),
          );
        } else if (animeRelationResult.matchedCount === 0) {
          const reverseRelationType = getReverseRelationType(typeofRelation);
          animeRelationResult = await MangaModel.findByIdAndUpdate(
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
                mangaRelations: {
                  relationId: id,
                  typeofRelation: reverseRelationType,
                },
              },
            },
            { new: true },
          );

          // Return both the updated relation on the current manga and the reverse anime
          return [
            animeRelationResult,
            reverseRelationAnime
              ? reverseRelationAnime.mangaRelations.find(
                  (r) => String(r.relationId) === String(id),
                )
              : null,
          ];
        } else {
          // Document was not updated, try updating the reverse relation on the related anime
          const reverseRelationAnime = await AnimeModel.findOneAndUpdate(
            {
              "mangaRelations.relationId": id,
            },
            {
              $set: {
                "mangaRelations.$.typeofRelation":
                  getReverseRelationType(typeofRelation),
              },
            },
            { new: true },
          );

          // Return both the updated relation on the current manga and the reverse relation anime
          return [
            animeRelationResult,
            reverseRelationAnime
              ? reverseRelationAnime.mangaRelations.find(
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

        // update the relation on the current manga
        let mangaRelationResult = await MangaModel.updateOne(
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
          const updatedManga = await MangaModel.findById(id);
          return updatedManga.mangaRelations.find(
            (r) => String(r.relationId) === String(relationId),
          );
        } else if (mangaRelationResult.matchedCount === 0) {
          const reverseRelationType = getReverseRelationType(typeofRelation);
          mangaRelationResult = await MangaModel.findByIdAndUpdate(
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
                mangaRelations: {
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
              ? reverseRelationManga.mangaRelations.find(
                  (r) => String(r.relationId) === String(id),
                )
              : null,
          ];
        } else {
          // Document was not updated, try updating the reverse relation on the related manga
          const reverseRelationManga = await MangaModel.findOneAndUpdate(
            {
              "mangaRelations.relationId": id,
            },
            {
              $set: {
                "mangaRelations.$.typeofRelation":
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
        ...updatedManga._doc,
        characters: updatedCharacters.filter(Boolean),
        mangaRelations: updatedMangaRelations.flat(),
        animeRelations: updatedAnimeRelations.flat(),
      });
  } catch (error) {
    // Enhanced error logging
    console.error("Error updating anime:", {
      error: error.message,
      stack: error.stack,
      mangaId: id,
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
 * @function createMangaFromAnilist
 * @description Get all manga documents from AniList database matching the search.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @return {Array} - Array of manga documents.
 */
const createMangaFromAnilist = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const anilistResults = await fetchMangaData(title);
    if (!anilistResults) {
      return res.status(404).json({ message: `No manga found on AniList matching "${title}"` });
    }

    // Map AniList status to our status
    const statusMap = {
      'RELEASING': 'Currently Releasing',
      'FINISHED': 'Finished Releasing',
      'NOT_YET_RELEASED': 'Not Yet Released',
      'CANCELLED': 'Cancelled',
      'HIATUS': 'Hiatus'
    };

    // Map AniList format to our format
    const formatMap = {
      'MANGA': 'Manga',
      'NOVEL': 'Light Novel',
      'ONE_SHOT': 'One Shot'
    };

    // Map AniList source to our source
    const sourceMap = {
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
    const countryMap = {
      'JP': 'Japan',
      'KR': 'South Korea',
      'CN': 'China',
      'TW': 'Taiwan'
    };

    const mangaList = anilistResults.map((anilistData) => ({
      anilistId: anilistData.anilistId,
      titles: {
        romaji: anilistData.titles?.romaji || '',
        english: anilistData.titles?.english || '',
        native: anilistData.titles?.native || ''
      },
      releaseData: {
        releaseStatus: statusMap[anilistData.releaseData.releaseStatus] || 'Currently Releasing',
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
      typings: {
        Format: formatMap[anilistData.typings.Format] || 'Manga',
        Source: sourceMap[anilistData.typings.Source] || 'Original',
        CountryOfOrigin: countryMap[anilistData.typings.CountryOfOrigin] || 'Japan'
      },
      lengths: {
        Chapters: anilistData.lengths.Chapters?.toString() || '',
        Volumes: anilistData.lengths.Volumes?.toString() || ''
      },
      genres: anilistData.genres || [],
      description: anilistData.description || '',
      images: {
        image: anilistData.images?.image || '',
        border: anilistData?.images?.border || ''
      },
      characters: [],
      mangaRelations: anilistData.relations?.mangaRelations || [],
      animeRelations: anilistData.relations?.animeRelations || [],
      activityTimestamp: Date.now()
    }));

    res.status(200).json(mangaList);
  } catch (error) {
    if (error.message === 'SERVICE_UNAVAILABLE') {
      return res.status(503).json({
        message: 'AniList API is temporarily unavailable. Please try again later.',
        retryAfter: 300 // 5 minutes
      });
    } else {
      console.error('Error creating manga from Anilist:', error);
    }
    res.status(500).json({
      message: "Error creating manga from AniList",
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * @function compareMangaWithAnilist
 * @description Compare manga data with the data from AniList.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @return {Array} - Array of differences.
 */
const compareMangaWithAnilist = async (req, res) => {
  try {
    const { id } = req.params;
    const manga = await MangaModel.findById(id);

    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    const differences = await compareMangaData(manga);
    if (!differences) {
      return res.status(400).json({ message: "Failed to compare manga with AniList" });
    }
    res.json(differences);
  } catch (error) {
    console.error("Error comparing manga with AniList:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * @function updateMangaAnilist
 * @description Get all manga documents from AniList database matching search result.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @return {Array} - Array of manga documents.
 */
const updateMangaAnilist = async (req, res) => {
  try {
    const manga = await MangaModel.findById(req.params.id);
    if (!manga) {
      return res.status(404).json({ message: 'Manga not found' });
    }

    const updatedManga = await updateMangaFromAnilist(manga);
    if (!updatedManga) {
      return res.status(400).json({ message: 'Failed to update from AniList' });
    }

    res.json(updatedManga);
  } catch (error) {
    console.error('Error updating manga from AniList:', error);
    res.status(500).json({ message: 'Error updating manga from AniList' });
  }
};

export {
  getAllManga,
  checkForManga,
  getMangaInfo,
  findMangaInfo,
  createManga,
  updateManga,
  createMangaFromAnilist,
  compareMangaWithAnilist,
  updateMangaAnilist
};
