import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ANILIST_CLIENT_ID = process.env.ANILIST_CLIENT_ID;
const ANILIST_CLIENT_SECRET = process.env.ANILIST_CLIENT_SECRET;
const ANILIST_REDIRECT_URI = process.env.ANILIST_REDIRECT_URI || 'http://localhost:3000/auth/anilist/callback';

// Generate the authorization URL for AniList OAuth
export const getAuthorizationUrl = () => {
  return `https://anilist.co/api/v2/oauth/authorize?client_id=${ANILIST_CLIENT_ID}&redirect_uri=${ANILIST_REDIRECT_URI}&response_type=code`;
};

// Add validation
if (!ANILIST_CLIENT_ID || !ANILIST_CLIENT_SECRET) {
    console.error('Missing AniList credentials in environment variables');
}

export const getAccessToken = async (code) => {
  try {
    if (!code) {
      throw new Error('Authorization code is required');
    }

    console.log('Requesting access token with code:', code.substring(0, 5) + '...');

    const response = await axios.post('https://anilist.co/api/v2/oauth/token', {
      grant_type: 'authorization_code',
      client_id: ANILIST_CLIENT_ID,
      client_secret: ANILIST_CLIENT_SECRET,
      redirect_uri: ANILIST_REDIRECT_URI,
      code: code
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.data.access_token) {
      throw new Error('No access token received');
    }

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting AniList access token:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to get access token');
  }
};

// Get user information from AniList using the access token
export const getAniListUserInfo = async (accessToken) => {
  try {
    const query = `
      query {
        Viewer {
          id
          name
        }
      }
    `;

    const response = await axios.post('https://graphql.anilist.co', {
      query: query
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    return response.data.data.Viewer;
  } catch (error) {
    console.error('Error getting AniList user info:', error);
    throw error;
  }
};

// Function to initiate AniList authentication
export const initiateAniListAuth = async () => {
  try {
    const authUrl = getAuthorizationUrl();
    // Open this URL in a new window/tab
    return authUrl;
  } catch (error) {
    console.error('Error initiating AniList auth:', error);
    throw error;
  }
};

// Function to validate AniList connection
export const validateAniListConnection = async (accessToken) => {
  try {
    const query = `
      query {
        Viewer {
          id
          name
          mediaListOptions {
            scoreFormat
          }
          statistics {
            anime {
              count
              episodesWatched
              minutesWatched
            }
            manga {
              count
              chaptersRead
              volumesRead
            }
          }
        }
      }
    `;

    const response = await axios.post('https://graphql.anilist.co', {
      query: query
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    return response.data.data.Viewer;
  } catch (error) {
    console.error('Error validating AniList connection:', error);
    throw error;
  }
};

// Function to sync user's AniList data
export const syncAniListData = async (accessToken) => {
  try {
    // First get the user ID
    const userQuery = `
      query {
        Viewer {
          id
        }
      }
    `;

    const userResponse = await axios.post('https://graphql.anilist.co', {
      query: userQuery
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    const userId = userResponse.data.data.Viewer.id;

    // Then fetch the lists with the user ID
    const listsQuery = `
      query {
        anime: MediaListCollection(userId: ${userId}, type: ANIME) {
          lists {
            entries {
              mediaId
              status
              progress
              score
              media {
                id
                title {
                  romaji
                  english
                  native
                }
              }
            }
          }
        }
        manga: MediaListCollection(userId: ${userId}, type: MANGA) {
          lists {
            entries {
              mediaId
              status
              progress
              progressVolumes
              score
              media {
                id
                title {
                  romaji
                  english
                  native
                }
              }
            }
          }
        }
      }
    `;

    const response = await axios.post('https://graphql.anilist.co', {
      query: listsQuery
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    // Process and format the data with the new response structure
    const animeList = response.data.data.anime.lists.flatMap(list => list.entries) || [];
    const mangaList = response.data.data.manga.lists.flatMap(list => list.entries) || [];

    return {
      anime: animeList.map(entry => ({
        mediaId: entry.media.id,
        status: entry.status,
        progress: entry.progress,
        score: entry.score,
        title: entry.media.title
      })),
      manga: mangaList.map(entry => ({
        mediaId: entry.media.id,
        status: entry.status,
        progress: entry.progress,
        progressVolumes: entry.progressVolumes,
        score: entry.score,
        title: entry.media.title
      }))
    };
  } catch (error) {
    console.error('Error syncing AniList data:', error);
    throw error;
  }
};

export const getAniListUserLists = async (accessToken) => {
  try {
    // First get the user ID
    const userQuery = `
      query {
        Viewer {
          id
          name
        }
      }
    `;

    const userResponse = await axios.post('https://graphql.anilist.co', {
      query: userQuery
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const userId = userResponse.data.data.Viewer.id;

    // Then get their lists using their user ID
    const listsQuery = `
      query ($userId: Int!, $typeAnime: MediaType, $typeManga: MediaType) {
        anime: MediaListCollection(userId: $userId, type: $typeAnime) {
          lists {
            name
            isCustomList
            isSplitCompletedList
            entries {
              id
              score
              scoreRaw: score(format: POINT_100)
              progress
              repeat
              private
              notes
              startedAt {
                year
                month
                day
              }
              completedAt {
                year
                month
                day
              }
              updatedAt
              createdAt
              media {
                id
                title {
                  romaji
                  english
                  native
                  userPreferred
                }
                episodes
                duration
                status
              }
            }
          }
          user {
            id
            name
            avatar {
              large
            }
            mediaListOptions {
              scoreFormat
              rowOrder
            }
          }
        }
        manga: MediaListCollection(userId: $userId, type: $typeManga) {
          lists {
            name
            isCustomList
            isSplitCompletedList
            entries {
              id
              score
              scoreRaw: score(format: POINT_100)
              progress
              progressVolumes
              repeat
              private
              notes
              startedAt {
                year
                month
                day
              }
              completedAt {
                year
                month
                day
              }
              updatedAt
              createdAt
              media {
                id
                title {
                  romaji
                  english
                  native
                  userPreferred
                }
                chapters
                volumes
                status
              }
            }
          }
        }
      }
    `;

    const listsResponse = await axios.post('https://graphql.anilist.co', {
      query: listsQuery,
      variables: {
        userId: userId,
        typeAnime: 'ANIME',
        typeManga: 'MANGA'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (listsResponse.data.errors) {
      throw new Error(listsResponse.data.errors[0].message);
    }

    const { anime, manga } = listsResponse.data.data;
    
    return {
      user: anime.user, // User info is the same in both collections
      animeLists: anime.lists,
      mangaLists: manga.lists
    };
  } catch (error) {
    console.error('Error fetching AniList lists:', error.response?.data || error);
    throw error;
  }
}; 