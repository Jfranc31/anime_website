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

const animeSchema = new mongoose.Schema({
    title: {
        type: String, 
        required: true
    },
    genres: [
        { genre: {
            type: String
        }}
    ],
    episodes: {
        type: Number, 
        required: true
    },
    currentEpisode: {
        type: Number, 
        default: 0
    },
    description: {
        type: String
    },
    image: {
        type: String
    },
    characters: [
        {name: {
            type: String
        }}
    ],
    status: {
        type: String, 
        enum: ['Planning', 'Watching', 'Completed'], 
        default: 'Planning'
    },
    border: {
        type: String
    },
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

app.get('/browse', async (req, res) => {
    try {
        const animes = await AnimeModel.find({});
        res.json(animes);
    } catch (error) {
        console.error("Error fetching animes:", error);
        res.status(500).json({ message: 'Internal Server Error' });
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


app.post("/addanime", async (req, res) => {
    console.log('Received request to create anime:', req.body);
    try {
        // Validate
        const { title, genres, episodes, image, description, characters, status, border } = req.body;
        if(!title) {
        console.log(title);
        return res.status(400).json({message: 'no title'});
        }
        // Convert the genres string to an array of objects
        const genresArray = genres.map(genre => ({ genre }));

        if (!genresArray || genresArray.length === 0 || !genresArray[0].genre) {
        console.log(genresArray);
        return res.status(400).json({ message: 'genres issue' });
        }
        if( !episodes) {
        console.log(episodes);
        return res.status(400).json({message: 'no episode'});
        }
        const charactersArray = characters.split(',').map(name => ({ name }));

        if (!charactersArray || charactersArray.length === 0 || !charactersArray[0].name) {
        console.log(charactersArray);
        return res.status(400).json({ message: 'characters issue' });
        }

        const anime = await AnimeModel.create({
        title,
        genres: genresArray,
        episodes,
        image,
        description,
        characters: charactersArray,
        status,
        border
        });

        anime.activityTimestamp = Date.now();
        res.status(201).json(anime);

    } catch (error) {
        res.status(400).json({ message: error.message });
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


/*============================
        listen
=============================*/
app.listen(8080,()=>{
    console.log("Server is runing at port 8080")
})