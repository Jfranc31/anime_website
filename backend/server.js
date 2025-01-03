/**
 * server.js
 * Description: Main server file for the Express application.
 */

import express from "express";
import animeRoutes from "./routes/animeRoutes.js";
import mangaRoutes from "./routes/mangaRoutes.js";
import characterRoutes from "./routes/characterRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import MangaModel from "./Models/mangaModel.js";
import AnimeModel from "./Models/animeModel.js";
import UserModel from "./Models/userModel.js";
import cookieParser from "cookie-parser";
import { runScheduledAnimeUpdates, runScheduledMangaUpdates } from './services/scheduledUpdates.js';

// Creating an Express application
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to parse URL-encoded requests
app.use(express.urlencoded({ extended: false }));

// Middleware for Cross-Origin Resource Sharing (CORS)
import cors from "cors";
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
    exposedHeaders: ["Set-Cookie"],
  }),
);

// Add this before your routes
app.use(cookieParser());

// Using defined routes for different entities
app.use("/animes", animeRoutes);
app.use("/mangas", mangaRoutes);
app.use("/characters", characterRoutes);
app.use("/users", userRoutes);

// Route for searching relations based on a query term and content type
app.get("/searchrelations", async (req, res) => {
  try {
    const searchTerm = req.query.query;
    const contentType = req.query.contentType;
    let foundRelations = [];

    console.log(
      "Relation Search - Search Term:",
      searchTerm,
      "Content Type:",
      contentType,
    );

    if (contentType === "anime") {
      foundRelations = await AnimeModel.find({
        $or: [
          { "titles.english": { $regex: searchTerm, $options: "i" } },
          { "titles.romaji": { $regex: searchTerm, $options: "i" } },
          { "titles.native": { $regex: searchTerm, $options: "i" } },
        ],
      });
    } else if (contentType === "manga") {
      foundRelations = await MangaModel.find({
        $or: [
          { "titles.english": { $regex: searchTerm, $options: "i" } },
          { "titles.romaji": { $regex: searchTerm, $options: "i" } },
          { "titles.native": { $regex: searchTerm, $options: "i" } },
        ],
      });
    } else {
      // Invalid content type, return an empty array or handle accordingly
      res.json({ relations: [] });
      return;
    }

    res.json({ relations: foundRelations });
  } catch (error) {
    console.error("Error during relation search:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route for fetching the latest activities for a specific user
app.get("/latest-activities/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Populate anime details for each activity
    const userAnimeActivities = await Promise.all(
      user.animes.slice(0, 15).map(async (activity) => {
        const animeDetails = await AnimeModel.findById(activity.animeId);
        return { ...activity.toObject(), animeDetails };
      }),
    );

    // Populate manga details for each activity
    const userMangaActivities = await Promise.all(
      user.mangas.slice(0, 15).map(async (activity) => {
        const mangaDetails = await MangaModel.findById(activity.mangaId);
        return { ...activity.toObject(), mangaDetails };
      }),
    );

    const activities = [...userAnimeActivities, ...userMangaActivities];
    res.json(activities);
  } catch (error) {
    console.error("Error fetching latest activities:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/anime/:id/notes", async (req, res) => {
  try {
    const animeId = req.params.id;
    const { notes } = req.body;

    const anime = await AnimeModel.findById(animeId);

    if (!anime) {
      return res.status(404).json({ message: "Anime not found" });
    }

    anime.notes = notes;
    await anime.save();

    res.json({ message: "Notes updated successfully" });
  } catch (error) {
    console.error("Failed to update notes:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/anime/:id/notes", async (req, res) => {
  try {
    const animeId = req.params.id;
    const anime = await AnimeModel.findById(animeId);
    if (!anime) {
      return res.status(404).json({ message: "Anime not found" });
    }
    res.json({ notes: anime.notes });
  } catch (error) {
    console.error("Error fetching anime notes:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/browse/:id", async (req, res) => {
  console.log(req.body);
  try {
    const animeId = req.params.id;

    // Find the anime by ID
    const anime = await AnimeModel.findById(animeId);

    if (!anime) {
      return res.status(404).json({ message: "Anime not found" });
    }

    // Delete the anime
    anime.activityTimestamp = Date.now();
    await anime.deleteOne();

    res.status(201).json({ message: "Anime deleted successfully" });
  } catch (error) {
    console.error("Failed to delete anime:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/anime/:id/notes", async (req, res) => {
  try {
    const animeId = req.params.id;

    const anime = await AnimeModel.findById(animeId);

    if (!anime) {
      return res.status(404).json({ message: "Anime not found" });
    }

    anime.notes = "";
    await anime.save();

    res.json({ message: "Notes deleted successfully" });
  } catch (error) {
    console.error("Failed to delete notes:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/*============================
        listen
=============================*/
// Starting the Express server
app.listen(8080, () => {
  console.log("Server is running at port 8080");
});

// Add this after your other middleware setup
runScheduledAnimeUpdates('*/5 * * * *');
runScheduledMangaUpdates('* */12 * * * ');
