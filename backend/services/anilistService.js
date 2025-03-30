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
        relations {
          edges {
            relationType(version: 2)
            node {
              id
              type
              title {
                romaji
                english
                native
              }
              format
              status
              coverImage {
                large
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(ANILIST_API, {
      query,
      variables: { id }
    });

    console.log("AniList Raw Response:", response.data);
    const media = response.data.data.Media;

    // Process relations
    if (media.relations?.edges) {
      console.log("Found relations edges:", media.relations.edges);
      const processedRelations = {
        animeRelations: [],
        mangaRelations: []
      };

      for (const edge of media.relations.edges) {
        console.log("Processing relation edge:", edge);
        const relation = {
          anilistId: edge.node.id,
          typeofRelation: edge.relationType,
          titles: edge.node.title,
          images: {
            image: edge.node.coverImage?.large
          },
          format: edge.node.format,
          status: edge.node.status,
          type: edge.node.type
        };

        if (edge.node.type === 'ANIME') {
          processedRelations.animeRelations.push(relation);
        } else if (edge.node.type === 'MANGA') {
          processedRelations.mangaRelations.push(relation);
        }
      }

      media.relations = processedRelations;
    }

    // Transform the data
    const transformedData = {
      anilistId: media.id,
      titles: media.title,
      releaseData: {
        releaseStatus: media.status,
        startDate: media.startDate,
        endDate: media.endDate
      },
      typings: {
        Format: media.format,
        Source: media.source,
        CountryOfOrigin: media.countryOfOrigin
      },
      lengths: {
        Episodes: media.episodes,
        EpisodeDuration: media.duration
      },
      genres: media.genres,
      description: media.description,
      images: {
        image: media.coverImage?.large,
        border: media.bannerImage
      },
      nextAiringEpisode: media.nextAiringEpisode,
      relations: media.relations // Make sure this is included
    };

    console.log("Transformed data with relations:", transformedData);
    return transformedData;
  } catch (error) {
    console.error('Error fetching anime data from AniList:', error);
    if (error.response) {
      console.error('AniList API error response:', error.response.data);
    }
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
          relations {
            edges {
              relationType(version: 2)
              node {
                id
                type
                title {
                  romaji
                  english
                  native
                }
                format
                status
                coverImage {
                  large
                }
              }
            }
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
    
    const mediaList = data.data.Page.media;
    console.log("media list length:", mediaList.length);
    
    // Process each media item
    const processedMediaList = mediaList.map(media => {
      // Process relations for this specific media item
      let processedRelations = {
        animeRelations: [],
        mangaRelations: []
      };

      if (media.relations && media.relations.edges) {
        console.log(`Processing relations for anime ID ${media.id}:`, media.relations.edges);
        
        for (const edge of media.relations.edges) {
          console.log("Processing relation edge:", edge);
          
          if (!edge.node || !edge.node.id) {
            console.log("Invalid relation node:", edge);
            continue;
          }
          
          const relation = {
            anilistId: edge.node.id,
            typeofRelation: edge.relationType,
            titles: edge.node.title,
            images: {
              image: edge.node.coverImage?.large
            },
            format: edge.node.format,
            status: edge.node.status,
            type: edge.node.type
          };
          
          if (edge.node.type === 'ANIME') {
            processedRelations.animeRelations.push(relation);
          } else if (edge.node.type === 'MANGA') {
            processedRelations.mangaRelations.push(relation);
          }
        }
      } else {
        console.log(`No relations found for anime ID ${media.id}`);
      }
      
      // Transform the data for this media item
      return {
        anilistId: media.id,
        titles: media.title,
        releaseData: {
          releaseStatus: media.status,
          startDate: media.startDate,
          endDate: media.endDate
        },
        typings: {
          Format: media.format,
          Source: media.source,
          CountryOfOrigin: media.countryOfOrigin
        },
        lengths: {
          Episodes: media.episodes,
          EpisodeDuration: media.duration
        },
        genres: media.genres,
        description: media.description,
        images: {
          image: media.coverImage?.large,
          border: media.bannerImage
        },
        nextAiringEpisode: media.nextAiringEpisode,
        relations: processedRelations // Make sure relations are attached to each item
      };
    });
    
    console.log(`Processed ${processedMediaList.length} anime with relations`);
    return processedMediaList;
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
        relations {
          edges {
            relationType(version: 2)
            node {
              id
              type
              format
              status
              title {
                romaji
                english
                native
              }
              coverImage {
                large
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(ANILIST_API, {
      query,
      variables: { id }
    });

    const media = response.data.data.Media;
    
    // Process relations
    if (media.relations?.edges) {
      const processedRelations = {
        animeRelations: [],
        mangaRelations: []
      };

      for (const edge of media.relations.edges) {
        const relation = {
          anilistId: edge.node.id,
          typeofRelation: edge.relationType,
          titles: edge.node.title,
          images: {
            image: edge.node.coverImage?.large
          },
          format: edge.node.format,
          status: edge.node.status,
          type: edge.node.type
        };

        if (edge.node.type === 'ANIME') {
          processedRelations.animeRelations.push(relation);
        } else if (edge.node.type === 'MANGA') {
          processedRelations.mangaRelations.push(relation);
        }
      }

      media.relations = processedRelations;
    }

    // Transform the data
    const transformedData = {
      anilistId: media.id,
      titles: media.title,
      releaseData: {
        releaseStatus: media.status,
        startDate: media.startDate,
        endDate: media.endDate
      },
      typings: {
        Format: media.format,
        Source: media.source,
        CountryOfOrigin: media.countryOfOrigin
      },
      lengths: {
        Chapters: media.chapters,
        Volumes: media.volumes
      },
      genres: media.genres,
      description: media.description,
      images: {
        image: media.coverImage?.large,
        border: media.bannerImage
      },
      relations: media.relations // Make sure this is included
    };

    console.log("Transformed data with relations:", transformedData);
    return transformedData;
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
          relations {
            edges {
              relationType(version: 2)
              node {
                id
                type
                title {
                  romaji
                  english
                  native
                }
                format
                status
                coverImage {
                  large
                }
              }
            }
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

    const mediaList = data.data.Page.media;
    console.log("media list length:", mediaList.length);

    const processedMediaList = mediaList.map(media => {
      let processedRelations = {
        animeRelations: [],
        mangaRelations: []
      };

      if (media.relations && media.relations.edges) {
        console.log(`Processing relations for manga ID ${media.id}:`, media.relations.edges);

        for (const edge of media.relations.edges) {
          console.log("Processing relation edge:", edge);

          if (!edge.node || !edge.node.id) {
            console.log("Invalid relation node:", edge);
            continue;
          } 

          const relation = {
            anilistId: edge.node.id,
            typeofRelation: edge.relationType,
            titles: edge.node.title,
            images: {
              image: edge.node.coverImage?.large
            },
            format: edge.node.format,
            status: edge.node.status,
            type: edge.node.type
          };
          
          if (edge.node.type === 'ANIME') {
            processedRelations.animeRelations.push(relation);
          } else if (edge.node.type === 'MANGA') {
            processedRelations.mangaRelations.push(relation);
          }
        }
      } else {
        console.log(`No relations found for manga ID ${media.id}`);
      }

      // Transform the data for this media item
      return {
        anilistId: media.id,
        titles: media.title,
        releaseData: {
          releaseStatus: media.status,
          startDate: media.startDate,
          endDate: media.endDate
        },
        typings: {
          Format: media.format,
          Source: media.source,
          CountryOfOrigin: media.countryOfOrigin
        },
        lengths: {
          Chapters: media.chapters,
          Volumes: media.volumes
        },
        genres: media.genres,
        description: media.description,
        images: {
          image: media.coverImage?.large,
          border: media.bannerImage
        },
        relations: processedRelations // Make sure relations are attached to each item
      };
    });

    console.log(`Processed ${processedMediaList.length} manga with relations`);
    return processedMediaList;
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
