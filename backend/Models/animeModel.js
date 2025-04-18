/**
 * /models/animeModel.js
 * Description: Mongoose model for the 'AnimeModel' collection in MongoDB.
 */

import mongoose from "../db/mongoose.js";

// Defining the schema for the 'AnimeModel' collection
const animeSchema = new mongoose.Schema({
  titles: {
    romaji: {
      type: String,
    },
    english: {
      type: String,
    },
    native: {
      type: String,
    },
  },
  releaseData: {
    releaseStatus: {
      type: String,
      enum: [
        "Finished Releasing",
        "Currently Releasing",
        "Not Yet Released",
        "Cancelled",
        "Hiatus",
      ],
    },
    startDate: {
      year: {
        type: String,
      },
      month: {
        type: String,
      },
      day: {
        type: String,
      },
    },
    endDate: {
      year: {
        type: String,
      },
      month: {
        type: String,
      },
      day: {
        type: String,
      },
    },
  },
  typings: {
    Format: {
      type: String,
      enum: ["TV", "TV Short", "Movie", "Special", "OVA", "ONA", "Music", "Unknown"],
    },
    Source: {
      type: String,
      enum: [
        "Original",
        "Manga",
        "Anime",
        "Movie",
        "Light Novel",
        "Web Novel",
        "Novel",
        "Doujinshi",
        "Video Game",
        "Visual Novel",
        "Comic",
        "Game",
        "Live Action",
        "Other"
      ],
    },
    CountryOfOrigin: {
      type: String,
      enum: ["China", "Japan", "South Korea", "Taiwan"],
    },
  },
  lengths: {
    Episodes: {
      type: String,
    },
    EpisodeDuration: {
      type: String,
    },
  },
  genres: [String],
  description: {
    type: String,
  },
  images: {
    image: {
      type: String,
    },
    border: {
      type: String,
    },
  },
  characters: [
    {
      characterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CharacterModel",
      },
      role: {
        type: String,
        enum: ["Main", "Supporting", "Background"],
        default: "Supporting",
      },
    },
  ],
  mangaRelations: [
    {
      relationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MangaModel",
      },
      typeofRelation: {
        type: String,
        enum: [
          "Adaptation",
          "Source",
          "Prequel",
          "Sequel",
          'Parent',
          'Child',
          "Alternative",
          "Compilations",
          "Contains",
          "Other",
          "Character"
        ],
      },
    },
  ],
  animeRelations: [
    {
      relationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AnimeModel",
      },
      typeofRelation: {
        type: String,
        enum: [
          "Adaptation",
          "Source",
          "Prequel",
          "Sequel",
          "Parent",
          "Child",
          "Alternative",
          "Contains",
          "Compilation",
          "Other",
          "Character"
        ],
      },
    },
  ],
  activityTimestamp: {
    type: Number,
    default: Date.now
  },
  anilistId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  nextAiringEpisode: {
      airingAt: {
        type: Number
      },
      episode: {
        type: Number
      },
      timeUntilAiring: {
        type: Number
      }
  },
});

// Creating the 'AnimeModel' using the schema
const AnimeModel = mongoose.model("AnimeModel", animeSchema);

export default AnimeModel;
