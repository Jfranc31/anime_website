/**
 * /models/animeModel.js
 * Description: Mongoose model for the 'AnimeModel' collection in MongoDB.
 */

import mongoose from '../db/mongoose.js';

// Defining the schema for the 'AnimeModel' collection
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
    releaseData: {
        releaseStatus: {
            type: String,
            enum: 
                [
                    'Finished Releasing', 
                    'Currently Releasing', 
                    'Not Yet Released', 
                    'Cancelled', 
                    'Hiatus'
                ]
        },
        startDate: {
            year: {
                type: String
            },
            month: {
                type: String
            },
            day: {
                type: String
            },
        },
        endDate: {
            year: {
                type: String
            },
            month: {
                type: String
            },
            day: {
                type: String
            },
        },
    },
    typings: {
        Format: {
            type: String,
            enum: ['TV', "TV Short", "Movie", "Special", "OVA", "ONA", "Music"]
        },
        Source: {
            type: String,
            enum: 
                [
                    "Original", 
                    "Manga", 
                    "Anime", 
                    "Light Novel", 
                    "Web Novel", 
                    "Novel", 
                    "Doujinshi", 
                    "Video Game", 
                    "Visual Novel", 
                    "Comic", 
                    "Game", 
                    "Live Action"
                ]
        },
        CountryOfOrigin: {
            type: String,
            enum: ["China", "Japan", "South Korea", "Taiwan"]
        }
    },
    lengths:{
        Episodes: {
            type: Number,
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
                enum: 
                    [
                        'Adaptation', 
                        'Source', 
                        'Prequel', 
                        'Sequel', 
                        'Side Story', 
                        'Character', 
                        'Summary', 
                        'Alternative', 
                        'Spin Off', 
                        'Other', 
                        'Compilations', 
                        'Contains'
                    ],
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
                enum: 
                    [
                        'Adaptation', 
                        'Source', 
                        'Prequel', 
                        'Sequel', 
                        'Side Story', 
                        'Character', 
                        'Summary', 
                        'Alternative', 
                        'Spin Off', 
                        'Other', 
                        'Compilations', 
                        'Contains'
                    ],
            },
        }
    ],
    activityTimestamp: {
        type: Date,
        default: Date.now,
    },
});

// Creating the 'AnimeModel' using the schema
const AnimeModel = mongoose.model('AnimeModel', animeSchema);

export default AnimeModel;