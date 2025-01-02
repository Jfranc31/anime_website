/**
 *  /models/characterModel.js
 * Description: Mongoose model for the 'CharacterModel' collection in MongoDB.
 */

import mongoose from "../db/mongoose.js";

// Defining the schema for the 'CharacterModel' collection
const characterSchema = new mongoose.Schema({
  anilistId: {
    type: Number,
    unique: true
  },
  names: {
    givenName: {
      type: String,
      required: true,
    },
    middleName: {
      type: String,
    },
    surName: {
      type: String,
    },
    nativeName: {
      type: String,
    },
    alterNames: [
      {
        type: String,
      }
    ],
    alterSpoiler: [
      {
        type: String,
      }
    ],
  },
  about: {
    type: String,
  },
  gender: {
    type: String,
  },
  age: {
    type: String,
  },
  DOB: {
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
  characterImage: {
    type: String,
  },
  animes: [
    {
      animeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AnimeModel",
      },
      role: {
        type: String,
        enum: ["Main", "Supporting", "Background"],
      },
      animeName: {
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
    },
  ],
  mangas: [
    {
      mangaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MangaModel",
      },
      role: {
        type: String,
        enum: ["Main", "Supporting", "Background"],
      },
      mangaName: {
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
    },
  ],
});

// Creating the 'CharacterModel' using the schema
const CharacterModel = mongoose.model("CharacterModel", characterSchema);

export default CharacterModel;
