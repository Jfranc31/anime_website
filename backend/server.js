import express from "express"
import animeRoutes from "./routes/animeRoutes.js";
import mangaRoutes from "./routes/mangaRoutes.js";
import characterRoutes from "./routes/characterRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import MangaModel from "./Models/mangaModel.js";
import AnimeModel from "./Models/animeModel.js";

const app = express();
app.use(express.json())
app.use(express.urlencoded({extended : false}))

import cors from 'cors';
app.use(cors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

app.use('/animes', animeRoutes);
app.use('/mangas', mangaRoutes);
app.use('/characters', characterRoutes);
app.use('/users', userRoutes);


app.get('/searchrelations', async (req, res) => {
    try {
        const searchTerm = req.query.query;
        const contentType = req.query.contentType;
        let foundRelations = [];

        console.log('Relation Search - Search Term:', searchTerm, 'Content Type:', contentType);


        if (contentType === 'anime') {
            foundRelations = await AnimeModel.find({
                $or: [
                    {'titles.english': { $regex: searchTerm, $options: 'i' }},
                    {'titles.romaji': { $regex: searchTerm, $options: 'i' }},
                    {'titles.Native': { $regex: searchTerm, $options: 'i' }},
                ]
            });
        } else if (contentType === 'manga') {
            foundRelations = await MangaModel.find({
                $or: [
                    {'titles.english': { $regex: searchTerm, $options: 'i' }},
                    {'titles.romaji': { $regex: searchTerm, $options: 'i' }},
                    {'titles.Native': { $regex: searchTerm, $options: 'i' }},
                ]
            });
        } else {
            // Invalid content type, return an empty array or handle accordingly
            res.json({ relations: [] });
            return;
        }

        res.json({ relations: foundRelations });
    } catch (error) {
        console.error('Error during relation search:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

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

/*=================================
        get and post
===================================*/

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