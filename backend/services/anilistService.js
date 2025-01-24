import axios from 'axios';

const ANILIST_API = 'https://graphql.anilist.co';

async function fetchCharactersBySeriesId(seriesId, mediaType = "ANIME") {
  const baseUrl = "https://graphql.anilist.co";
  let allCharacters = [];
  let currentPage = 1;
  let hasNextPage = true;

  while (hasNextPage) {
      try {
          const query = `
          query ($id: Int!, $type: MediaType, $page: Int!) {
              Media(id: $id, type: $type) {
                  characters(page: $page, sort: [ROLE]) {
                      pageInfo {
                          hasNextPage
                          currentPage
                      }
                      edges {
                          node {
                              id
                              name {
                                  first
                                  last
                              }
                          }
                          role
                      }
                  }
              }
          }`;

          const variables = {
              id: seriesId,
              type: mediaType,
              page: currentPage,
          };

          const response = await axios.post(baseUrl, {
              query,
              variables,
          });

          const data = response.data.data.Media.characters;

          // Append the current page's characters to the list
          allCharacters.push(...data.edges);

          // Check if there are more pages
          hasNextPage = data.pageInfo.hasNextPage;
          currentPage = data.pageInfo.currentPage + 1;

      } catch (error) {
          console.error(`Error fetching characters data from AniList: ${error}`);
          throw error;
      }
  }

  return allCharacters;
}

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
        bannerImage
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
          bannerImage
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
        bannerImage
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
          bannerImage
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

const fetchCharacterDataById = async (id) => {
  const query = `
    query ($id: Int) {
      Character(id: $id) {
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
  `;

  try {
    console.log('Sending request to AniList API with ID:', id);
    console.log('Query:', query);
    console.log('Variables:', { id: parseInt(id, 10) });

    const response = await axios.post(ANILIST_API, {
      query,
      variables: { id: parseInt(id, 10) }
    });

    return response.data.data.Character;
  } catch (error) {
    console.error('Error fetching character data from AniList:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return null;
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

export { fetchCharactersBySeriesId, fetchAnimeData, fetchAnimeDataById, fetchMangaDataById, fetchMangaData, fetchCharacterDataById, fetchCharacterData };
