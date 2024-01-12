// /controllers/mangaController.js
import MangaModel from "../Models/mangaModel.js";
import CharacterModel from "../Models/characterModel.js";
import AnimeModel from "../Models/animeModel.js";
import { getReverseRelationType } from "../functions.js";

const getAllManga = async (req, res) => {
    try {
        const mangas = await MangaModel.find({});
        res.json(mangas);
    } catch (error) {
        console.error("Error fetching mangas:,", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getMangaInfo = async (req, res) => {
    try {
        const mangaID = req.params.id;
        const manga = await MangaModel.findById(mangaID);
        if (!manga) {
            return res.status(404).json({ message: 'Manga not found' });
        }
        res.json(manga);
    } catch (error) {
        console.error("Error fetching manga for page: ",error);
        res.status(500).json({ message: 'internal Server Error' });
    }
};

const createManga = async (req, res) => {
    try {
        const { titles, releaseData, typings, lengths, genres, description, images, characters, mangaRelations, animeRelations, activityTimestamp } =req.body;

        // Check if English title is provided
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
            activityTimestamp
        });

        // Set activityTimestamp once after creating the manga
        manga.activityTimestamp = Date.now();

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
                                mangaRelations: {
                                    relationId: manga._id,
                                    typeofRelation: reverseRelationType,
                                },
                            },
                        },
                        { new: true }
                    );
                    return [manga, reverseRelationAnime];
                } else {
                    return manga;
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
                                mangaRelations: {
                                    relationId: manga._id,
                                    typeofRelation: reverseRelationType,
                                },
                            },
                        },
                        { new: true }
                    );
                    return [manga, reverseRelationManga];
                } else {
                    return manga;
                }
            })
        );

        res.status(201).json({ ...manga._doc, characters: updatedCharacters, animeRelations: updatedAnimeRelations.flat(), mangaRelations: updatedMangaRelations.flat() });
    } catch (error) {
        console.error('Error during manga creation:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const updateManga = async (req, res) => {
    const { id } = req.params;

    try {
        const { characters, mangaRelations, animeRelations, ...otherFields } = req.body;

        // Filter out characters with empty characterId
        const validCharacters = characters.filter(character => character.characterId);
        const validMangaRelations = mangaRelations.filter(relation => relation.relationId);
        const validAnimeRelations = animeRelations.filter(relation => relation.relationId);

        // Update the manga, excluding characters with empty characterId
        const updatedManga = await MangaModel.findByIdAndUpdate(id, { ...otherFields, characters: validCharacters }, {
            new: true, // Return the modified document
            runValidators: true, // Run validators for update operations
        });

        if (!updatedManga) {
            return res.status(404).json({ error: 'Manga not found' });
        }

        // Update characters, adding new characters if they don't have the mangaId already
        const updatedCharacters = await Promise.all(
            validCharacters.map(async (characterInfo) => {
                const { characterId, role } = characterInfo;
        
                // Use updateOne to atomically update the document
                const result = await CharacterModel.updateOne(
                    {
                        _id: characterId,
                        'mangas.mangaId': { $ne: updatedManga._id }, // Ensure mangaId is not already present
                    },
                    {
                        $push: {
                            mangas: {
                                mangaId: updatedManga._id,
                                role: role,
                            },
                        },
                    }
                );
        
                // Check if the document was modified (i.e., updated)
                if (result.nModified > 0) {
                    // Document was updated, return the updated character
                    const updatedCharacter = await CharacterModel.findById(characterId);
                    return updatedCharacter;
                }
        
                // Document was not updated, return null
                return null;
            })
        );

        // Update relations
        const updatedAnimeRelations = await Promise.all(
            validAnimeRelations.map(async (relationInfo) => {
                const { relationId, typeofRelation } = relationInfo;

                // Update the relation on the current manga
                const result = await MangaModel.updateOne(
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

                // Check if the document was modified (i.e., updated)
                if (result.nModified > 0) {
                    // Document was updated, return the updated relation
                    const updatedManga = await MangaModel.findById(id);
                    return updatedManga.mangaRelations.find((r) => String(r.relationId) === String(relationId));
                } else {
                    // Document was not updated, try updating the reverse relation on the related anime
                    const reverseRelationAnime = await AnimeModel.findOneAndUpdate(
                        {
                            'mangaRelations.relationId': id,
                        },
                        {
                            $set: {
                                'mangaRelations.$.typeofRelation': getReverseRelationType(typeofRelation),
                            },
                        },
                        { new: true }
                    );

                    // Return both the updated relation on the current manga and the reverse relation anime
                    return [
                        updatedManga.animeRelations.find((r) => String(r.relationId) === String(relationId)),
                        reverseRelationAnime ? reverseRelationAnime.mangaRelations.find((r) => String(r.relationId) === String(id)) : null,
                    ];
                }
            })
        );

        const updatedMangaRelations = await Promise.all(
            validMangaRelations.map(async (relationInfo) => {
                const { relationId, typeofRelation } = relationInfo;

                // update the relation on the current manga
                const result = await MangaModel.updateOne(
                    {
                        _id: id,
                        'mangaRelations.relationId': relationId,
                    },
                    {
                        $set: {
                            'mangaRelations.$.typeofRelation': typeofRelation,
                        }
                    }
                );

                // Check if the document was modified (i.e., updated)
                if (result.nModified > 0) {
                    // Document was updated, return the updated relation
                    const updatedManga = await MangaModel.findById(id);
                    return updatedManga.mangaRelations.find((r) => String(r.relationId) === String(relationId));
                } else {
                    // Document was not updated, try updating the reverse relation on the related manga
                    const reverseRelationManga = await MangaModel.findOneAndUpdate(
                        {
                            'mangaRelations.relationId': id,
                        },
                        {
                            $set: {
                                'mangaRelations.$.typeofRelation': getReverseRelationType(typeofRelation),
                            },
                        },
                        { new: true }
                    );

                    // Return both the updated relation on the current manga and the reverse relation for manga
                    return [
                        updatedManga.mangaRelations.find((r) => String(r.relationId) === String(relationId)),
                        reverseRelationManga ? reverseRelationManga.mangaRelations.find((r) => String(r.relationId) === String(id)) : null,
                    ];
                }
            })
        );

        res.status(200).json({ ...updatedManga._doc, characters: updatedCharacters.filter(Boolean), mangaRelations: updatedMangaRelations.flat(), animeRelations: updatedAnimeRelations.flat() });
    } catch (error) {
        console.error('Error updating manga:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default {
    getAllManga,
    getMangaInfo,
    createManga,
    updateManga
};