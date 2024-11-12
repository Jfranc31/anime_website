import axios from 'axios';

const ANILIST_API = 'https://graphql.anilist.co';

const fetchAnimeData = async (title) => {
  const query = `
    query ($search: String) {
      Media (search: $search, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        status
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        format
        source
        countryOfOrigin
        episodes
        duration
        genres
        description
        coverImage {
          large
        }
      }
    }
  `;

  try {
    const response = await axios.post(ANILIST_API, {
      query,
      variables: { search: title }
    });

    return response.data.data.Media;
  } catch (error) {
    console.error('Error fetching from AniList:', error);
    return null;
  }
};

export { fetchAnimeData }; 