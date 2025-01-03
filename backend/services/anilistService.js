import axios from 'axios';

const ANILIST_API = 'https://graphql.anilist.co';

const fetchAnimeDataById = async (id) => {
  const query = `
    query ($id: Int) {
      Media (id: $id, type: ANIME) {
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
        nextAiringEpisode {
          airingAt
          timeUntilAiring
          episode
        }
      }
    }
  `;

  try {
    const response = await axios.post(ANILIST_API, {
      query,
      variables: { id }
    });

    return response.data.data.Media;
  } catch (error) {
    console.error('Error fetching anime data from AniList:', error);
    return null;
  }
};

const fetchAnimeData = async (title) => {
  const query = `
    query ($search: String) {
      Page (page: 1, perPage: 60) {
        media (search: $search, type: ANIME) {
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
          nextAiringEpisode {
            airingAt
            timeUntilAiring
            episode
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { search: title }
      })
    });

    const data = await response.json();

    if (data.errors) {
      const errorMessage = data.errors[0]?.message || 'Unknown AniList API error';
      if (errorMessage.includes('temporarily disabled')) {
        throw new Error('SERVICE_UNAVAILABLE');
      }
      throw new Error(errorMessage);
    }

    if (!data.data?.Page?.media) {
      throw new Error('NO_RESULTS');
    }

    return data.data.Page.media;
  } catch (error) {
    console.error('Error fetching anime data from AniList:', error);
    throw error;
  }
};

const fetchMangaDataById = async (id) => {
  const query = `
    query ($id: Int) {
      Media (id: $id, type: MANGA) {
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
        chapters
        volumes
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
      variables: { id }
    });

    return response.data.data.Media;
  } catch (error) {
    console.error('Error fetching manga data from AniList:', error);
    return null;
  }
};

const fetchMangaData = async (title) => {
  const query = `
    query ($search: String) {
      Page (page: 1, perPage: 60) {
        media (search: $search, type: MANGA) {
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
          chapters
          volumes
          genres
          description
          coverImage {
            large
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { search: title }
      })
    });

    const data = await response.json();

    if (data.errors) {
      const errorMessage = data.errors[0]?.message || 'Unknown AniList API error'
      if (errorMessage.includes('temporarily disabled')) {
        throw new Error('SERVICE_UNAVAILABLE');
      }
      throw new Error(errorMessage);
    }

    if (!data.data?.Page?.media) {
      throw new Error('NO_RESULTS');
    }

    return data.data.Page.media;
  } catch (error) {
    console.error('Error fetching manga data from AniList:', error);
    return error;
  }
};

const fetchCharacterData = async (search) => {
  const query = `
    query ($search: String) {
      Page (page: 1, perPage: 60) {
        characters(search: $search) {
          id
          name {
            first
            middle
            last
            native
            alternative
            alternativeSpoiler
          }
          gender
          age
          dateOfBirth {
            year
            month
            day
          }
          description
          image {
            large
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { search }
      })
    });

    const data = await response.json();

    if (data.errors) {
      const errorMessage = data.errors[0]?.message || 'Unknown AniList API error';
      if (errorMessage.includes('temporarily disabled')) {
        throw new Error('SERVICE_UNAVAILABLE');
      }
      throw new Error(errorMessage);
    }

    if (!data.data?.Page?.characters) {
      throw new Error('NO_RESULTS');
    }

    return data.data.Page.characters;
  } catch (error) {
    console.error('Error fetching character data from AniList:', error);
    throw error;
  }
};

export { fetchAnimeData, fetchAnimeDataById, fetchMangaDataById, fetchMangaData, fetchCharacterData };
