import axios from 'axios';

const ANILIST_API = 'https://graphql.anilist.co';

async function fetchCharactersBySeriesId(seriesId, mediaType = "ANIME") {
  if (!seriesId) {
      throw new Error('Series ID is required');
  }

  const baseUrl = "https://graphql.anilist.co";
  let allCharacters = new Map();
  let page = 1;
  let hasNextPage = true;

  // Modified query to remove sorting which might be limiting results
  const query = `
      query ($id: Int!, $type: MediaType, $page: Int!) {
          Media(id: $id, type: $type) {
              id
              characters(page: $page, perPage: 50) {
                  pageInfo {
                      hasNextPage
                      total
                      currentPage
                      lastPage
                  }
                  edges {
                      id
                      role
                      node {
                          id
                          name {
                              first
                              last
                              native
                          }
                      }
                  }
              }
          }
      }`;

  console.log(`Starting character fetch for series ID: ${seriesId}, Media Type: ${mediaType}`);

  while (hasNextPage) {
      try {
          if (page > 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
          }

          const variables = {
              id: seriesId,
              type: mediaType,
              page: page
          };

          const response = await axios.post(baseUrl, {
              query,
              variables,
          }, {
              headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
              }
          });

          if (response.data.errors) {
              console.error('GraphQL Errors:', response.data.errors);
              throw new Error(response.data.errors[0].message);
          }

          const { characters } = response.data.data.Media;

          if (page === 1) {
              console.log(`Total characters reported: ${characters.pageInfo.total}`);
          }

          // Process characters
          characters.edges.forEach(edge => {
              if (!allCharacters.has(edge.node.id)) {
                  allCharacters.set(edge.node.id, edge);
              }
          });

          hasNextPage = characters.pageInfo.hasNextPage;
          page++;

          console.log(`Processed page ${page-1}, Current unique characters: ${allCharacters.size}`);
      } catch (error) {
          if (error.response?.status === 429) {
              console.log('Rate limit hit, waiting 10 seconds...');
              await new Promise(resolve => setTimeout(resolve, 10000));
              continue;
          }
          console.error(`Error on page ${page}:`, error.message);
          throw error;
      }
  }

  const finalCharacters = Array.from(allCharacters.values());
  console.log(`Fetch complete. Retrieved ${finalCharacters.length} unique characters`);

  return finalCharacters;
}

// async function fetchCharactersBySeriesId(seriesId, mediaType = "ANIME") {
//   const baseUrl = "https://graphql.anilist.co";

//   let allCharacters = new Map(); // Using Map to prevent duplicates
//   let page = 1;
//   let hasNextPage = true;
//   let totalCharacters = 0;

//   const query = `
//     query ($id: Int!, $type: MediaType, $page: Int!) {
//         Media(id: $id, type: $type) {
//             id
//             title {
//               romaji
//               english
//             }
//             characters(page: $page, sort: [ROLE, RELEVANCE], perPage: 25) {
//                 pageInfo {
//                     hasNextPage
//                     total
//                     currentPage
//                     lastPage
//                     perPage
//                 }
//                 edges {
//                     id
//                     node {
//                         id
//                         name {
//                             first
//                             last
//                         }
//                     }
//                     role
//                 }
//             }
//         }
//     }`;

//   console.log(`Starting character fetch for series ID: ${seriesId}, Media Type: ${mediaType}`);

//   while (hasNextPage) {
//     try {
//       // If not the first request, apply rate limiting
//       if (page > 1) {
//         await new Promise(resolve => setTimeout(resolve, 1000));
//       }

//       const variables = {
//           id: seriesId,
//           type: mediaType,
//           page: page
//       };

//       const response = await axios.post(baseUrl, {
//           query,
//           variables,
//       }, {
//           headers: {
//               'Content-Type': 'application/json',
//               'Accept': 'application/json',
//           }
//       });

//       // Error checking for the GraphQL response
//       if (response.data.errors) {
//           throw new Error(response.data.errors[0].message);
//       }

//       const { characters, title } = response.data.data.Media;

//        // Set total characters on first page
//       if (page === 1) {
//         totalCharacters = characters.pageInfo.total;
//         console.log(`Total characters reported by API: ${totalCharacters}`);
//         console.log(`Series Title: ${title.english || title.romaji}`);
//       }

//       // Log pagination information
//       console.log(`Processing page ${page}/${characters.pageInfo.lastPage}`);
//       console.log(`Characters on this page: ${characters.edges.length}`);

//       // Add characters to Map using their ID as key to prevent duplicates
//       characters.edges.forEach(edge => {
//         const characterId = edge.node.id;
//         if (!allCharacters.has(characterId)) {
//             allCharacters.set(characterId, edge);
//             // Log character addition
//             console.log(`Added character: ${edge.node.name.first} ${edge.node.name.last || ''} (ID: ${characterId})`);
//         }
//       });

//       // Update pagination info
//       hasNextPage = characters.pageInfo.hasNextPage;
//       page++; // Manually increment the page number

//       // Log progress
//       console.log(`Current unique characters: ${allCharacters.size}`);

//     } catch (error) {
//       if (error.response?.status === 429) {
//         console.log('Rate limit hit, waiting 5 seconds...');
//         await new Promise(resolve => setTimeout(resolve, 5000));
//         continue;
//       }
//       console.error(`Error on page ${page}:`, error.message);
//       throw error;
//     }
//   }
//   const finalCharacters = Array.from(allCharacters.values());
//   console.log(`Fetch complete. Retrieved ${finalCharacters.length}/${totalCharacters} unique characters`);

//   return finalCharacters;
// }

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
