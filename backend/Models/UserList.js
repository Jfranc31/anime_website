import mongoose from 'mongoose';

const userListSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  watchingAnime: [{
    animeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Anime',
      required: true
    },
    progress: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  completedAnime: [{
    animeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Anime',
      required: true
    },
    progress: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  planningAnime: [{
    animeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Anime',
      required: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  readingManga: [{
    mangaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manga',
      required: true
    },
    progress: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  completedManga: [{
    mangaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manga',
      required: true
    },
    progress: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  planningManga: [{
    mangaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manga',
      required: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

// Indexes for better query performance
userListSchema.index({ userId: 1 });
userListSchema.index({ 'watchingAnime.animeId': 1 });
userListSchema.index({ 'completedAnime.animeId': 1 });
userListSchema.index({ 'planningAnime.animeId': 1 });
userListSchema.index({ 'readingManga.mangaId': 1 });
userListSchema.index({ 'completedManga.mangaId': 1 });
userListSchema.index({ 'planningManga.mangaId': 1 });

const UserList = mongoose.model('UserList', userListSchema);
export default UserList; 