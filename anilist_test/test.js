import fetch from 'node-fetch';

const getAnimeRelations = async (animeId) => {
  const query = `
    query ($id: Int) {
      Media (id: $id, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        relations {
          edges {
            id
            relationType
            node {
              id
              title {
                romaji
                english
                native
              }
              type
              format
              status
              coverImage {
                large
                medium
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    id: animeId
  };

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        variables: variables
      })
    });

    const data = await response.json();
    console.log('Raw API Response:', JSON.stringify(data, null, 2));
    
    if (data.errors) {
      console.error('API Errors:', data.errors);
      return null;
    }

    return data.data.Media;
  } catch (error) {
    console.error('Error fetching anime relations:', error);
    return null;
  }
};

// Test the function
const test = async () => {
  try {
    const relations = await getAnimeRelations(21459);
    
    if (!relations) {
      console.error('No data returned from API');
      return;
    }

    if (!relations.title) {
      console.error('No title data found:', relations);
      return;
    }

    console.log('Anime Title:', relations.title.english || relations.title.romaji);
    console.log('\nRelations:');
    
    if (relations.relations && relations.relations.edges) {
      relations.relations.edges.forEach(relation => {
        console.log(`\nType: ${relation.relationType}`);
        console.log(`Title: ${relation.node.title.english || relation.node.title.romaji}`);
        console.log(`Format: ${relation.node.format}`);
        console.log(`Status: ${relation.node.status}`);
        console.log(`AniList ID: ${relation.node.id}`);
      });
    } else {
      console.log('No relations found');
    }
  } catch (error) {
    console.error('Error in test function:', error);
  }
};

test();
