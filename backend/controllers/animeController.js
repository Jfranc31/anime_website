/**
 * controllers/animeController.js
 * Description: Controller for handling anime-related operations.
 */

import AnimeModel from "../Models/animeModel.js";
import CharacterModel from "../Models/characterModel.js";
import MangaModel from "../Models/mangaModel.js";
import { getReverseRelationType } from "../functions.js";

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
        res.status(500).json({ message: 'Internal Server Error' });
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
            return res.status(404).json({ message: 'Anime not found' });
        }
        res.json(anime);
    } catch (error) {
        console.error("Error fetching anime for page: ",error);
        res.status(500).json({ message: 'internal Server Error' });
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
        const { titles, releaseData, typings, lengths, genres, description, images, characters, mangaRelations, animeRelations, activityTimestamp } = req.body;

        // Check if the English title is provided
        if (!titles.english.trim()) {
            return res.status(400).json({ message: 'English title is required' });
        }

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
            activityTimestamp,
        });

        // Set activityTimestamp once after creating the anime
        anime.activityTimestamp = Date.now();

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
                            },
                        },
                    },
                    { new: true }
                );
                return character;
            })
        );

        // Update relations with the anime ID
        const updatedAnimeRelations = await Promise.all(
            animeRelationsArray.map(async (relationInfo) => {
                const reverseRelationType = getReverseRelationType(relationInfo.typeofRelation);

                if (reverseRelationType) {
                    const reverseRelationAnime = await AnimeModel.findByIdAndUpdate(
                        relationInfo.relationId,
                        {
                            $push: {
                                animeRelations: {
                                    relationId: anime._id,
                                    typeofRelation: reverseRelationType,
                                },
                            },
                        },
                        { new: true }
                    );
                    return [anime, reverseRelationAnime];
                } else {
                    return anime;
                }
            })
        );

        // Update relations with the manga ID
        const updatedMangaRelations = await Promise.all(
            mangaRelationsArray.map(async (relationInfo) => {
                const reverseRelationType = getReverseRelationType(relationInfo.typeofRelation);

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
                        { new: true }
                    );
                    return [anime, reverseRelationManga];
                } else {
                    return anime;
                }
            })
        );

        res.status(201).json({ ...anime._doc, characters: updatedCharacters, animeRelations: updatedAnimeRelations.flat(), mangaRelations: updatedMangaRelations.flat() });
    } catch (error) {
        console.error('Error during anime creation:', error);
        res.status(500).json({ message: 'Internal Server Error' });
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
        const { characters, mangaRelations, animeRelations, ...otherFields } = req.body;

        // Filter out characters with empty characterId
        const validCharacters = characters.filter(character => character.characterId);
        const validMangaRelations = mangaRelations.filter(relation => relation.relationId);
        const validAnimeRelations = animeRelations.filter(relation => relation.relationId);

        // Update the anime, excluding characters with empty characterId
        const updatedAnime = await AnimeModel.findByIdAndUpdate(id, { ...otherFields, characters: validCharacters }, {
            new: true, // Return the modified document
            runValidators: true, // Run validators for update operations
        });

        if (!updatedAnime) {
            return res.status(404).json({ error: 'Anime not found' });
        }

        // Update characters, adding new characters if they don't have the animeId already
        const updatedCharacters = await Promise.all(
            validCharacters.map(async (characterInfo) => {
                const { characterId, role } = characterInfo;
        
                // Find the character in the array that needs to be updated
                var existingCharacter = await CharacterModel.findOne({
                    _id: characterId,
                    'animes.animeId': id, // Ensure animeId is present
                });


                if (!existingCharacter) {
                    // If the character doesn't exist with the specified animeId, create a new entry
                    existingCharacter = await CharacterModel.findByIdAndUpdate(
                        characterId,
                        {
                            $push: {
                                animes: {
                                    animeId: id,
                                    role: role,
                                },
                            },
                        },
                        { new: true, upsert: true } // Create a new document if it doesn't exist
                    );

                } else {
                    // Update the role of the character
                    existingCharacter.animes.find(anime => String(anime.animeId) === id).role = role;
                    existingCharacter = await existingCharacter.save();
                }

                return existingCharacter;
            })
        );

        // Update relations
        const updatedAnimeRelations = await Promise.all(
            validAnimeRelations.map(async (relationInfo) => {
                const { relationId, typeofRelation } = relationInfo;

                // Update the relation on the current anime
                let animeRelationResult = await AnimeModel.updateOne(
                    {
                        _id: id,
                        'animeRelations.relationId': relationId,
                    },
                    {
                        $set: {
                            'animeRelations.$.typeofRelation': typeofRelation,
                        },
                    }
                );

                console.log("animeRelationResult: ", animeRelationResult);

                // Check if the document was modified (i.e., updated)
                if (animeRelationResult.nModified > 0) {
                    // Document was updated, return the updated relation
                    const updatedAnime = await AnimeModel.findById(id);
                    return updatedAnime.animeRelations.find((r) => String(r.relationId) === String(relationId));
                } else if (animeRelationResult.matchedCount === 0) {
                    const reverseRelationType = getReverseRelationType(typeofRelation);
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
                        { new: true }
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
                        { new: true }
                    );

                    // Return both the updated relation on the current anime and the reverse relation
                    return [
                        animeRelationResult,
                        reverseRelationAnime ? reverseRelationAnime.animeRelations.find((r) => String(r.relationId) === String(id)) : null,
                    ];
                    
                } else {
                    // Document was not updated, try updating the reverse relation on the related anime
                    const reverseRelationAnime = await AnimeModel.findOneAndUpdate(
                        {
                            'animeRelations.relationId': id,
                        },
                        {
                            $set: {
                                'animeRelations.$.typeofRelation': getReverseRelationType(typeofRelation),
                            },
                        },
                        { new: true }
                    );

                    // Return both the updated relation on the current anime and the reverse relation
                    return [
                        animeRelationResult,
                        reverseRelationAnime ? reverseRelationAnime.animeRelations.find((r) => String(r.relationId) === String(id)) : null,
                    ];
                }
            })
        );

        const updatedMangaRelations = await Promise.all(
            validMangaRelations.map(async (relationInfo) => {
                const { relationId, typeofRelation } = relationInfo;

                // Update the relation on the current anime
                let mangaRelationResult = await AnimeModel.updateOne(
                    {
                        _id: id,
                        'mangaRelations.relationId': relationId,
                    },
                    {
                        $set: {
                            'mangaRelations.$.typeofRelation': typeofRelation,
                        },
                    }
                );

                console.log("mangaRelationResult: ", mangaRelationResult);

                // Check if the document was modefied (i.e., updated)
                if (mangaRelationResult.nModified > 0) {
                    // Document was updated, return the updated relation
                    const updatedAnime = await AnimeModel.findById(id);
                    return updatedAnime.mangaRelations.find((r) => String(r.relationId) === String(relationId));
                } else if (mangaRelationResult.matchedCount === 0) {
                    const reverseRelationType = getReverseRelationType(typeofRelation);
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
                        { new: true }
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
                        { new: true }
                    );

                    // Return both the updated relation on the current anime and the reverse manga
                    return [
                        mangaRelationResult,
                        reverseRelationManga ? reverseRelationManga.animeRelations.find((r) => String(r.relationId) === String(id)) : null,
                    ];
                } else {
                    // Document was not updated, try updaying the reverse relation on the related manga
                    const reverseRelationManga = await MangaModel.findOneAndUpdate(
                        {
                            'animeRelations.relationId': id,
                        },
                        {
                            $set: {
                                'animeRelations.$.typeofRelation': getReverseRelationType(typeofRelation),
                            },
                        },
                        { new: true }
                    );

                    // Return both the updated relation on the current anime and the reverse relation for manga
                    return [
                        mangaRelationResult,
                        reverseRelationManga ? reverseRelationManga.mangaRelations.find((r) => String(r.relationId) === String(id)) : null,
                    ];
                }
            })
        );
        // Debugging logs
        // console.log('Updated Anime:', updatedAnime);
        // console.log('Updated Characters:', updatedCharacters);
        console.log('Updated Anime Relations:', updatedAnimeRelations);
        // console.log('Updated Manga Relations:', updatedMangaRelations);

        res.status(200).json({ ...updatedAnime._doc, characters: updatedCharacters.filter(Boolean), mangaRelations: updatedMangaRelations.flat(), animeRelations: updatedAnimeRelations.flat() });
    } catch (error) {
        console.error('Error updating anime:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default {
    getAllAnimes,
    getAnimeInfo,
    createAnime,
    updateAnime
};