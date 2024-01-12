// /controllers/characterController.js
import CharacterModel from "../Models/characterModel.js";
import AnimeModel from "../Models/animeModel.js";
import MangaModel from "../Models/mangaModel.js";

const getAllCharacters = async (req, res) => {
    try{
        const characters = await CharacterModel.find({});
        res.json(characters);
    } catch (error) {
        console.error("Error fetching characters:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const searchForCharacters = async (req, res) => {
    try {
        const searchTerm = req.query.query;

        // Perform a case-insensitive search for characters with any name field containing the searchTerm
        const foundCharacters = await CharacterModel.find({
            $or: [
                {'names.givenName': { $regex: searchTerm, $options: 'i' }},
                {'names.middleName': { $regex: searchTerm, $options: 'i' }},
                {'names.surName': { $regex: searchTerm, $options: 'i' }},
                {'names.alterNames': { $regex: searchTerm, $options: 'i' }},
            ]
        });

        res.json({ characters: foundCharacters });
    } catch (error) {
        console.error('Error during character search:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getCharacterInfo = async (req, res) => {
    try {
        const characterID = req.params.id;
        const character = await CharacterModel.findById(characterID);
        if (!character){
            return res.status(404).json({ message: 'Character not found' });
        }
        res.json(character);
    } catch (error) {
        console.error("Error fetching character for page: ",error);
        res.status(500).json({ message: 'internal Server Error' });
    }
};

const createCharacter = async (req, res) => {
    try {
        const { names, about, gender, age, DOB, characterImage, animes, mangas } = req.body;

        // Check if animes are provided
        if (animes && Array.isArray(animes) && animes.length > 0) {
            // If animes array is provided, associate the character with the animes
            const animeIds = animes.map((animeInfo) => ({
                animeId: animeInfo.animeId,
                role: animeInfo.role,
            }));

            const character = await CharacterModel.create({
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
                { $push: { characters: character._id } }
            );

            res.status(201).json(character);
        }
        // CHeck if mangas are provided 
        else if (mangas && Array.isArray(mangas) && mangas.length > 0) {
            // If mangas array is provided, associate the character with the mangas
            const mangaIds = mangas.map((mangaInfo) => ({
                mangaId: mangaInfo.mangaId,
                role: mangaInfo.role,
            }));

            const character = await CharacterModel.create({
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
                { $push: { characters: character._id } }
            );

            res.status(201).json(character);
        } else {
            // If animes are not provided, create the character without association
            const character = await CharacterModel.create({
                names,
                about,
                gender,
                age,
                DOB,
                characterImage,
                animes,
                mangas
            });

            res.status(201).json(character);
        }
    } catch (error) {
        console.error('Error during character creation:', error);
        res.status(400).json({ message: error.message });
    }
};

const updateCharacter = async (req, res) => {
    try {
        const characterId = req.params.id;
        const { names, about, gender, age, DOB, characterImage } = req.body;

        // Find the character by ID
        const character = await CharacterModel.findById(characterId);

        if (!character) {
            return res.status(404).json({ message: 'Character not found' });
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

        res.json({ message: 'Character updated successfully' });
    } catch (error) {
        console.error('Failed to update character:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export default {
    getAllCharacters,
    searchForCharacters,
    getCharacterInfo,
    createCharacter,
    updateCharacter
}