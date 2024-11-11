/**
 *  /models/characterModel.js
 * Description: Mongoose model for the 'CharacterModel' collection in MongoDB.
 */

import mongoose from "../db/mongoose.js";

// Defining the schema for the 'CharacterModel' collection
const characterSchema = new mongoose.Schema({
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
    alterNames: {
      type: String,
    },
  },
  about: {
    type: String,
  },
  gender: {
    type: String,
    enum: ["Female", "Male", "Non-binary"],
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
    },
  ],
});

// Creating the 'CharacterModel' using the schema
const CharacterModel = mongoose.model("CharacterModel", characterSchema);

export default CharacterModel;
