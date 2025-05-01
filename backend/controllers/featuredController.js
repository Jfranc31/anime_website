import AnimeModel from '../Models/animeModel.js';
import MangaModel from '../Models/mangaModel.js';

/**
 * @function getFeaturedContent
 * @description Get featured content including trending anime and manga
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFeaturedContent = async (req, res) => {
  try {
    // Get trending anime (sorted by most recent activity)
    const trendingAnime = await AnimeModel.find({})
      .sort({ activityTimestamp: -1 })
      .limit(5)
      .lean();

    // Get trending manga (sorted by most recent activity)
    const trendingManga = await MangaModel.find({})
      .sort({ activityTimestamp: -1 })
      .limit(5)
      .lean();

    // Get recent releases (sorted by release date)
    const recentReleases = await AnimeModel.find({})
      .sort({ 'releaseData.startDate.year': -1, 'releaseData.startDate.month': -1, 'releaseData.startDate.day': -1 })
      .limit(5)
      .lean();

    res.json({
      trendingAnime,
      trendingManga,
      recentReleases
    });
  } catch (error) {
    console.error('Error fetching featured content:', error);
    res.status(500).json({ message: 'Error fetching featured content' });
  }
};

export { getFeaturedContent }; 