// /models/animeModel.js
import mongoose from '../db/mongoose.js';

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
    mangaRelations: [
        {
            relationId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'MangaModel',
            },
            typeofRelation: {
                type: String,
                enum: ['Adaptation', 'Source', 'Prequel', 'Sequel', 'Side Story', 'Character', 'Summary', 'Alternative', 'Spin Off', 'Other', 'Compilations', 'Contains'],
            },
        }
    ],  
    animeRelations: [
        {
            relationId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AnimeModel',
            },
            typeofRelation: {
                type: String,
                enum: ['Adaptation', 'Source', 'Prequel', 'Sequel', 'Side Story', 'Character', 'Summary', 'Alternative', 'Spin Off', 'Other', 'Compilations', 'Contains'],
            },
        }
    ],
    activityTimestamp: {
        type: Date,
        default: Date.now,
    },
});

const AnimeModel = mongoose.model('AnimeModel', animeSchema);

export default AnimeModel;