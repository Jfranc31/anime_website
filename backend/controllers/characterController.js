/**
 * controllers/characterController.js
 * Description: Controller for handling character-related operations.
 */

import CharacterModel from "../Models/characterModel.js";
import AnimeModel from "../Models/animeModel.js";
import MangaModel from "../Models/mangaModel.js";
import { fetchCharacterData } from "../services/anilistService.js";

/**
 * @function getAllCharacters
 * @description Get all character documents from the database with optional search and filtering.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @return {Array} - Array of character documents.
 */
const getAllCharacters = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';
    const gender = req.query.gender || '';
    const animeId = req.query.animeId || '';
    const mangaId = req.query.mangaId || '';

    // Build the query object
    const query = {};

    // Add search query if provided
    if (searchQuery) {
      query.$or = [
        { 'name.english': { $regex: searchQuery, $options: 'i' } },
        { 'name.romaji': { $regex: searchQuery, $options: 'i' } },
        { 'name.native': { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Add gender filter if provided
    if (gender) {
      query.gender = gender;
    }

    // Add anime filter if provided
    if (animeId) {
      query['appearances.anime'] = animeId;
    }

    // Add manga filter if provided
    if (mangaId) {
      query['appearances.manga'] = mangaId;
    }

    // First get the total count
    const total = await CharacterModel.countDocuments(query);

    // Then get the paginated results
    const characters = await CharacterModel.find(query)
      .sort({ 'name.english': 1 }) // Sort by English name
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      characters,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching characters:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @function searchForCharacters
 * @description Search for characters based on a provided query string.
 * @param {Object} req - Express request object with query parameter.
 * @param {Object} res - Express response object.
 * @return {Object} - Object containing an array of found characters.
 */
const searchForCharacters = async (req, res) => {
  try {
    const searchTerm = req.query.query;
    let foundCharacters = [];

    console.log(
      "Character Search - Search Term",
      searchTerm,
    );

    // Perform a case-insensitive search for characters with any name field containing the searchTerm
    foundCharacters = await CharacterModel.find({
      $or: [
        { "names.givenName": { $regex: searchTerm, $options: "i" } },
        { "names.middleName": { $regex: searchTerm, $options: "i" } },
        { "names.surName": { $regex: searchTerm, $options: "i" } },
        { "names.nativeName": { $regex: searchTerm, $options: "i" } },
        { "names.alterNames": { $regex: searchTerm, $options: "i" } },
        { "animes.animeName.romaji": { $regex: searchTerm, $options: "i" } },
        { "animes.animeName.english": { $regex: searchTerm, $options: "i" } },
        { "animes.animeName.native": { $regex: searchTerm, $options: "i" } },
        { "mangas.mangaName.romaji": { $regex: searchTerm, $options: "i" } },
        { "mangas.mangaName.english": { $regex: searchTerm, $options: "i" } },
        { "mangas.mangaName.native": { $regex: searchTerm, $options: "i" } },
      ],
    });

    if (foundCharacters.length > 0) {
      res.json({ characters: foundCharacters });
    } else {
      res.json({characters: []});
    }

  } catch (error) {
    console.error("Error during character search:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const checkForCharacter = async (req, res) => {
  try {
    const { anilistId } = req.body;

    // Validate that anilistId is a number
    if (!anilistId || isNaN(Number(anilistId))) {
      return res.status(400).json({ message: "Invalid anilistId" });
    }

    const character = await CharacterModel.findOne({ anilistId: Number(anilistId) });

    if (!character) {
      return res.status(200).json(false);
    }
    res.status(200).json(true);
  } catch (error) {
    console.error("Error checking if character exists: ", error.message);
    res.status(500).json({ message: "internal Server Error" });
  }
};

/**
 * @function getCharacterInfo
 * @description Get information about a specific character.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @return {Object} - Character document.
 */
const getCharacterInfo = async (req, res) => {
  try {
    const characterID = req.params.id;
    const character = await CharacterModel.findById(characterID);
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }
    res.json(character);
  } catch (error) {
    console.error("Error fetching character for page: ", error);
    res.status(500).json({ message: "internal Server Error" });
  }
};

const findCharacterInfo = async (req, res) => {
  try {
    const anilistId = req.params.id;
    const character = await CharacterModel.findOne({ anilistId });
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }
    res.json(character);
  } catch (error) {
    console.error("Error fetching character for page: ", error);
    res.status(500).json({ message: "internal Server Error" });
  }
};

/**
 * @function createCharacter
 * @description Create a new character document in the database.
 * @param {Object} req - Express request object with character data.
 * @param {Object} res - Express response object.
 * @return {Object} - Created character document.
 */
const createCharacter = async (req, res) => {
  try {
    const { anilistId, names, about, gender, age, DOB, characterImage, animes, mangas } =
      req.body;

    const character_in_list = await CharacterModel.findOne({ anilistId: anilistId });

    if(character_in_list) {
      return res.status(400).send({ message: "This character is already registered" });
    }

    // Check if animes are provided
    if (animes && Array.isArray(animes) && animes.length > 0) {
      // If animes array is provided, associate the character with the animes
      const animeIds = animes.map((animeInfo) => ({
        animeId: animeInfo.animeId,
        role: animeInfo.role,
        animeName: [
          {
            romaji: animeInfo.animeName.romaji || '',
            english: animeInfo.animeName.english || '',
            native: animeInfo.animeName.native || '',
          },
        ],
      }));

      const character = await CharacterModel.create({
        anilistId,
        names,
        about,
        gender,
        age,
        DOB,
        characterImage,
        animes: animeIds,
        mangas,
      });

      // Update the anime documents with the character ID
      await AnimeModel.updateMany(
        { _id: { $in: animeIds.map((animeInfo) => animeInfo.animeId) } },
        { $push: { characters: character._id } },
      );

      res.status(201).json(character);
    }
    // CHeck if mangas are provided
    else if (mangas && Array.isArray(mangas) && mangas.length > 0) {
      // If mangas array is provided, associate the character with the mangas
      const mangaIds = mangas.map((mangaInfo) => ({
        mangaId: mangaInfo.mangaId,
        role: mangaInfo.role,
        mangaName: [
          {
            romaji: mangaInfo.mangaName.romaji || '',
            english: mangaInfo.mangaName.english || '',
            native: mangaInfo.mangaName.native || '',
          },
        ],
      }));

      const character = await CharacterModel.create({
        anilistId,
        names,
        about,
        gender,
        age,
        DOB,
        characterImage,
        animes,
        mangas: mangaIds,
      });

      // Update the manga documents with the character ID
      await MangaModel.updateMany(
        { _id: { $in: mangaIds.map((mangaInfo) => mangaInfo.mangaId) } },
        { $push: { characters: character._id } },
      );

      res.status(201).json(character);
    } else {
      // If animes are not provided, create the character without association
      const character = await CharacterModel.create({
        anilistId,
        names,
        about,
        gender,
        age,
        DOB,
        characterImage,
        animes,
        mangas,
      });

      res.status(201).json(character);
    }
  } catch (error) {
    console.error("Error during character creation:", error);
    res.status(400).json({ message: error.message });
  }
};

/**
 * @function updateCharacter
 * @description Update an existing character document in the database.
 * @param {Object} req - Express request object with updated character data.
 * @param {Object} res - Express response object.
 * @return {Object} - Success message.
 */
const updateCharacter = async (req, res) => {
  try {
    const characterId = req.params.id;
    const { names, about, gender, age, DOB, characterImage } = req.body;

    // Find the character by ID
    const character = await CharacterModel.findById(characterId);

    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    // Update the core character information
    character.names = names;
    character.about = about;
    character.gender = gender;
    character.age = age;
    character.DOB = DOB;
    character.characterImage = characterImage;

    // Save the updated character
    await character.save();

    res.json({ message: "Character updated successfully" });
  } catch (error) {
    console.error("Failed to update character:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @function createCharacterFromAnilist
 * @description Get all character documents from the AniList database matching the search.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @return {Array} - Array of characters documents.
 */
const createCharacterFromAnilist = async (req, res) => {
  console.log('Starting createCharacterFromAnilist in characterController');
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({message: `Name is required: Search term: ${name}` });
    }

    const anilistResults = await fetchCharacterData(name);
    if (!anilistResults) {
      return res.status(404).json({ message: `No character found on AniList matching "${name}"` });
    }

    const characterList = anilistResults.map((anilistData) => ({
      anilistId: anilistData.id.toString() || '',
      names: {
        givenName: anilistData.name?.first || '',
        middleName: anilistData.name?.middle || '',
        surName: anilistData.name?.last || '',
        nativeName: anilistData.name?.native || '',
        alterNames: anilistData.name?.alternative || '',
        alterSpoiler: anilistData.name?.alternativeSpoiler || ''
      },
      about: anilistData.description || '',
      gender: anilistData.gender || '',
      age: anilistData.age?.toString() || '',
      DOB: {
        year: anilistData.dateOfBirth?.year?.toString() || '',
        month: anilistData.dateOfBirth?.month?.toString() || '',
        day: anilistData.dateOfBirth?.day?.toString() || '',
      },
      characterImage: anilistData.image?.large || ''
    }));

    res.status(201).json(characterList);
  } catch (error) {
    if (error.message === 'SERVICE_UNAVAILABLE') {
      return res.status(503).json({
        message: 'AniList API is temporarily unavailable. Please try again later.',
        retryAfter: 300 // 5 minutes
      });
    } else {
      console.error('Error creating character from AniList:', error);
    }
    res.status(500).json({
      message: 'Error creating character from AniList',
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * @function getBatchCharacters
 * @description Get multiple characters by their IDs in a single request
 * @param {Object} req - Express request object with query parameter containing comma-separated IDs
 * @param {Object} res - Express response object
 * @return {Array} - Array of character documents
 */
const getBatchCharacters = async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ message: "No character IDs provided" });
    }

    // Split the comma-separated IDs and filter out any empty strings
    const characterIds = ids.split(',').filter(id => id);

    if (characterIds.length === 0) {
      return res.status(400).json({ message: "Invalid character IDs format" });
    }

    // Find all characters that match the provided IDs
    const characters = await CharacterModel.find({
      _id: { $in: characterIds }
    });

    // If no characters found, return an empty array
    if (!characters || characters.length === 0) {
      return res.json([]);
    }

    res.json(characters);
  } catch (error) {
    console.error("Error fetching batch characters:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  getAllCharacters,
  searchForCharacters,
  checkForCharacter,
  getCharacterInfo,
  findCharacterInfo,
  createCharacter,
  updateCharacter,
  createCharacterFromAnilist,
  getBatchCharacters
};
