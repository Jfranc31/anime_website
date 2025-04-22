/**
 * server.js
 * Description: Main server file for the Express application.
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import animeRoutes from "./routes/animeRoutes.js";
import mangaRoutes from "./routes/mangaRoutes.js";
import characterRoutes from "./routes/characterRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import MangaModel from "./Models/mangaModel.js";
import AnimeModel from "./Models/animeModel.js";
import UserModel from "./Models/userModel.js";
import cookieParser from "cookie-parser";
import { runScheduledAnimeUpdates, runScheduledMangaUpdates, runScheduledAiringUpdates } from './services/scheduledUpdates.js';

// Creating an Express application
const app = express();

// Increase the payload size limit - add these lines before other middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to parse URL-encoded requests
app.use(express.urlencoded({ extended: false }));

// Middleware for Cross-Origin Resource Sharing (CORS)
import cors from "cors";

// Allow your Vercel frontend
const allowedOrigins = ['https://anime-website-alpha.vercel.app'];

app.use(
  cors({
    origin: "http://localhost:3000" || allowedOrigins.includes(origin),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
    exposedHeaders: ["Set-Cookie"],
  }),
);

// Add this before your routes
app.use(cookieParser());

// // Add this logging middleware to debug routes
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   next();
// });

// // Add detailed request logging
// app.use((req, res, next) => {
//   next();
// });

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
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const type = req.query.type; // 'anime' or 'manga'
  const skip = (page - 1) * limit;

  try {
    const user = await UserModel.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle either anime or manga activities based on type
    const activities = type === 'anime' ? user.animes : user.mangas;
    const totalActivities = activities?.length || 0;

    // Sort and paginate activities
    const sortedActivities = (activities || [])
      .sort((a, b) => new Date(b.activityTimestamp || b.updatedAt) - new Date(a.activityTimestamp || a.updatedAt))
      .slice(skip, skip + limit)
      .map(activity => ({
        ...activity,
        _id: activity._id || new mongoose.Types.ObjectId(),
        type
      }));

    // Fetch details based on type
    const ids = sortedActivities.map(activity => 
      type === 'anime' ? activity.animeId : activity.mangaId
    );

    const details = ids.length > 0 
      ? await (type === 'anime' ? AnimeModel : MangaModel)
          .find({ _id: { $in: ids } })
          .lean()
      : [];

    // Create lookup map
    const detailsMap = new Map(
      details.map(item => [item._id.toString(), item])
    );

    // Combine activities with their details
    const activitiesWithDetails = sortedActivities.map(activity => ({
      ...activity,
      [`${type}Details`]: detailsMap.get(
        (type === 'anime' ? activity.animeId : activity.mangaId).toString()
      )
    }));

    res.json({
      activities: activitiesWithDetails,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalActivities / limit),
        totalActivities,
        hasMore: skip + limit < totalActivities
      }
    });
  } catch (error) {
    console.error("Error fetching latest activities:", error);
    res.status(500).json({ 
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the frontend's public directory
app.use('/public', express.static(path.join(__dirname, '../frontend/public')));

/*============================
        listen
=============================*/
// Starting the Express server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});

// Initialize all schedulers
console.log('Initializing scheduled tasks...');
runScheduledAnimeUpdates('0 */11 * * *');     // Daily at 11 PM
runScheduledMangaUpdates('0 */11 * * *');     // Daily at 11 PM
runScheduledAiringUpdates('15 * * * *');    // Every 15 minutes
console.log('Scheduled tasks registered.');

/*  * * * * *  command_to_run
    | | | | |
    | | | | |_____ Day of the week (0 - 7) [Sunday = 0 or 7]
    | | | |_______ Month (1 - 12)
    | | |_________ Day of the month (1 - 31)
    | |___________ Hour (0 - 23)
    |_____________ Minute (0 - 59) */
