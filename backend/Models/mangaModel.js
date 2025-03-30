/**
 * /models/mangaModel.js
 * Description: Mongoose model for the 'MangaModel' collection in MongoDB.
 */

import mongoose from "../db/mongoose.js";

// Defining the schema for the 'MangaModel' collection
const mangaSchema = new mongoose.Schema({
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
      enum: ["Manga", "Light Novel", "One Shot"],
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
        "Multimedia Project",
        "Picture Book",
        "Other",
      ],
    },
    CountryOfOrigin: {
      type: String,
      enum: ["China", "Japan", "South Korea", "Taiwan"],
    },
  },
  lengths: {
    chapters: {
      type: String,
    },
    volumes: {
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
          'Parent',
          'Child',
          "Alternative",
          "Compilations",
          "Contains",
          "Other",
        ],
      },
    },
  ],
  activityTimestamp: {
    type: Number,
    default: Date.now,
  },
  anilistId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
});

// Creating the 'MangaModel' using the schema
const MangaModel = mongoose.model("MangaModel", mangaSchema);

export default MangaModel;
