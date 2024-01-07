import express from "express"
import dotenv from "dotenv"
dotenv.config({ path: '/Users/david923/Desktop/Portfolio/anime_website/.env' });
const app = express();
app.use(express.json())
app.use(express.urlencoded({extended : false}))


const MONGO_URI = process.env.MONGO_URI;
console.log("MONGO_URI from process.env:", MONGO_URI);

import cors from 'cors';
app.use(cors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

/*=================================
        Database
===================================*/
import mongoose from 'mongoose';

mongoose.connect(MONGO_URI,{
    useNewUrlParser: true,
    useUnifiedTopology : true,
}).then(()=>{
    console.log("Connection Successfull")
}).catch((err)=>{
    console.error("MongoDB Connection Error:", err)
})
/************schema*********** */
const userSchema = new mongoose.Schema({
    firstName : String,
    lastName : String,
    email : {
        type: String,
        required :true,
        unique : true,
    },
    password : String
})
const UserModel = new mongoose.model("UserModel",userSchema)

const characterSchema = new mongoose.Schema({
    names: {
        givenName: {
            type: String,
            required: true
        },
        middleName: {
            type: String
        },
        surName: {
            type: String
        },
        alterNames: {
            type: String
        }
    },
    about: {
        type: String
    },
    gender: {
        type: String,
        enum: ["Female", "Male", "Non-binary"]
    },
    age: {
        type: Number
    },
    DOB: {
        year: {
            type: Number
        },
        month: {
            type: Number
        },
        day: {
            type: Number
        }
    },
    characterImage: {
        type: String
    },
    animes: [
        {
            animeId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AnimeModel'
            },
            role: {
                type: String,
                enum: ["Main", "Supporting", "Background"]
            },
        }
    ],
});

const CharacterModel = mongoose.model("CharacterModel",characterSchema)

const animeSchema = new mongoose.Schema({
    titles: {
        romaji: {
            type: String,
        },
        english: {
            type: String,
            requred: true,
        },
        Native: {
            type: String,
        }
    },
    typings: {
        Format: {
            type: String,
            enum: ['TV', "TV Short", "Movie", "Special", "OVA", "ONA", "Music"]
        },
        Source: {
            type: String,
            enum: ["Original", "Manga", "Anime", "Light Novel", "Web Novel", "Novel", "Doujinshi", "Video Game", "Visual Novel", "Comic", "Game", "Live Action"]
        },
        CountryOfOrigin: {
            type: String,
            enum: ["China", "Japan", "South Korea", "Taiwan"]
        }
    },
    lengths:{
        Episodes: {
            type: Number,
            required: true
        },
        EpisodeDuration: {
            type: Number,
            required: true
        }
    },
    genres: [
        String
    ],
    description: {
        type: String
    },
    images:{
        image: {
            type: String
        },
        border: {
            type: String
        }
    },
    characters: [
        {
            characterId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'CharacterModel'
            },
            role: {
                type: String,
                enum: ["Main", "Supporting", "Background"],
                default: "Supporting"
            },
        }
    ],
    // relations: {
    //     typeofRelation: {
    //         type: String,
    //         enum: ["Adaptation", "Source", "Prequel", "Sequel", "Side Story", "Character", "Summary", "Alternative", "Spin Off", "Other", "Compilations", "Contains"]
    //     }
    // },  
    activityTimestamp: {
        type: Date,
        default: Date.now,
    },
});

const AnimeModel = mongoose.model('AnimeModel', animeSchema);

/*=================================
            put
===================================*/
app.put('/browse/:id/status', async (req, res) => {
    try {
        const animeId = req.params.id;
        const { status } = req.body;

        // Find the anime by ID
        const anime = await AnimeModel.findById(animeId);

        if (!anime) {
            return res.status(404).json({ message: 'Anime not found' });
        }

        console.log('Before Update - Current Episode:', anime.currentEpisode, 'Status:', anime.status, 'Status', status);

        anime.status = status;
        if (anime.status === 'Planning') {
            anime.currentEpisode = 0;
        } else if (anime.status === 'Completed') {
            anime.currentEpisode = anime.episodes;
        }

        // Save the updated anime
        anime.activityTimestamp = Date.now();
        await anime.save();

        console.log('After Update - Current Episode:', anime.currentEpisode, 'Status:', anime.status);

        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Failed to update status:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/browse/:id/currentEpisode', async(req, res) => {
    try {
        const animeId = req.params.id;
        const { currentEpisode } = req.body;

        const anime = await AnimeModel.findById(animeId);

        if (!anime) {
            return res.status(404).json({ message: 'Anime not found' });
        }

        console.log('Before Update - Current Episode:', anime.currentEpisode, 'Status:', anime.status);

        anime.currentEpisode = currentEpisode;
        if(anime.currentEpisode === 0){
            anime.status = 'Planning';
        }else if(anime.currentEpisode >= anime.episodes) {
            anime.currentEpisode = anime.episodes;
            anime.status = 'Completed';
        } else {
            anime.status = 'Watching';
        }

        // Save the updated anime
        anime.activityTimestamp = Date.now();
        await anime.save();

        console.log('After Update - Current Episode:', anime.currentEpisode, 'Status:', anime.status);

        res.json({ message: 'Status updated successfully' });
                
    } catch (error) {
        console.error('Failed to update status:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

app.put('/anime/:id/notes', async (req, res) => {
    try {
        const animeId = req.params.id;
        const { notes } = req.body;

        const anime = await AnimeModel.findById(animeId);

        if (!anime) {
            return res.status(404).json({ message: 'Anime not found' });
        }

        anime.notes = notes;
        await anime.save();

        res.json({ message: 'Notes updated successfully' });
    } catch (error) {
        console.error('Failed to update notes:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/anime/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Assuming Anime is your Mongoose model
        const { characters, ...otherFields } = req.body;

        // Filter out characters with empty characterId
        const validCharacters = characters.filter(character => character.characterId);

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
                const character = await CharacterModel.findById(characterInfo.characterId);

                if (!character) {
                    // Handle case where character is not found
                    return null;
                }

                // Check if the character already has the given animeId
                const hasAnime = character.animes.some(animeInfo => String(animeInfo.animeId) === String(updatedAnime._id));

                if (!hasAnime) {
                    // If not, push the new animeId
                    character.animes.push({
                        animeId: updatedAnime._id,
                        role: characterInfo.role,
                    });
                    await character.save();
                }

                return character;
            })
        );

        res.status(200).json({ ...updatedAnime._doc, characters: updatedCharacters.filter(Boolean) });
    } catch (error) {
        console.error('Error updating anime:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.put('/characters/:id', async (req, res) => {
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
});


/*=================================
        get and post
===================================*/
app.post("/register", async (req, res) => {
    console.log(req.body);
    const { firstName, lastName, email, password } = req.body;

    try {
        const user = await UserModel.findOne({ email: email });

        if (user) {
            res.send({ message: "This email id already registered" });
        } else {
            const newUser = new UserModel({
                firstName,
                lastName,
                email,
                password,
            });

            await newUser.save();
            res.send({ message: "Successfully registered" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

app.post("/login", async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;

    try {
        const user = await UserModel.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ message: "This email id is not registered" });
        }

        if (password === user.password) {
            return res.json({ message: "Login Successful", user });
        } else {
            return res.status(401).json({ message: "Password didn't match" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get('/animes', async (req, res) => {
    try {
        const animes = await AnimeModel.find({});
        res.json(animes);
    } catch (error) {
        console.error("Error fetching animes:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }    
});

app.get('/characters', async (req, res) => {
    try{
        const characters = await CharacterModel.find({});
        res.json(characters);
    } catch (error) {
        console.error("Error fetching characters:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/searchcharacters', async (req, res) => {
    console.log(req.body);
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
});

app.get('/anime/:id', async (req, res) => {
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
});

app.get('/characters/:id', async (req, res) => {
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
});

app.post("/addcharacter", async (req, res) => {
    try {
        const { names, about, gender, age, DOB, characterImage, animes } = req.body;

        // Check if animes are provided
        if (animes && Array.isArray(animes) && animes.length > 0) {
            // If animes array is provided, associate the character with the animes
            const animeIds = animes.map((animeInfo) => ({
                anime: animeInfo.animeId,
                role: animeInfo.role,
            }));

            const character = await CharacterModel.create({
                names,
                about,
                gender,
                age,
                DOB,
                characterImage,
                animes: animeIds
            });

            // Update the anime documents with the character ID
            await AnimeModel.updateMany(
                { _id: { $in: animeIds.map(animeInfo => animeInfo.anime) } },
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
            });

            res.status(201).json(character);
        }
    } catch (error) {
        console.error('Error during character creation:', error);
        res.status(400).json({ message: error.message });
    }
});

app.post("/addanime", async (req, res) => {
    try {
        const { titles, typings, lengths, genres, description, images, characters, activityTimestamp } = req.body;

        // Check if the English title is provided
        if (!titles.english.trim()) {
            return res.status(400).json({ message: 'English title is required' });
        }

        // Create an array of genre objects
        // const genresArray = genres.map((genre) => ({ genre }));

        // Assuming characters is an array of character objects
        const charactersArray = characters.map((characterInfo) => ({
            characterId: characterInfo.characterId,
            role: characterInfo.role, // Assuming the type of character is provided in the request
        }));

        const anime = await AnimeModel.create({
            titles,
            lengths,
            typings,
            genres,
            description,
            images,
            characters: charactersArray,
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

        res.status(201).json({ ...anime._doc, characters: updatedCharacters });
    } catch (error) {
        console.error('Error during anime creation:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Example endpoint to get the latest activities
app.get('/latest-activities', async (req, res) => {
    try {
        const activities = await AnimeModel.find().sort({ activityTimestamp: -1 }).limit(10);
        res.json(activities);
    } catch (error) {
        console.error('Error fetching latest activities:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/anime/:id/notes', async (req, res) => {
    try {
        const animeId = req.params.id;
        const anime = await AnimeModel.findById(animeId);
        if (!anime) {
            return res.status(404).json({ message: 'Anime not found' });
        }
        res.json({ notes: anime.notes });
    } catch (error) {
        console.error("Error fetching anime notes:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


/*============================
        DELETE
=============================*/
app.delete('/browse/:id', async (req, res) => {
    console.log(req.body);
    try {
        const animeId = req.params.id;

        // Find the anime by ID
        const anime = await AnimeModel.findById(animeId);

        if (!anime) {
            return res.status(404).json({ message: 'Anime not found' });
        }

        // Delete the anime
        anime.activityTimestamp = Date.now();
        await anime.deleteOne();

        res.status(201).json({ message: 'Anime deleted successfully' });
    } catch (error) {
        console.error('Failed to delete anime:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/anime/:id/notes', async (req, res) => {
    try {
        const animeId = req.params.id;

        const anime = await AnimeModel.findById(animeId);

        if (!anime) {
            return res.status(404).json({ message: 'Anime not found' });
        }

        anime.notes = "";
        await anime.save();

        res.json({ message: 'Notes deleted successfully' });
    } catch (error) {
        console.error('Failed to delete notes:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/*============================
        listen
=============================*/
app.listen(8080,()=>{
    console.log("Server is runing at port 8080")
})