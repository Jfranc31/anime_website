/**
 * /routes/characterRoutes.js
 * Description: Defines the routes related to character in the Express application.
 */

import express from "express";
import {
  getAllCharacters,
  searchForCharacters,
  checkForCharacter,
  getCharacterInfo,
  findCharacterInfo,
  createCharacter,
  updateCharacter,
  createCharacterFromAnilist,
  getBatchCharacters
} from "../controllers/characterController.js";
import { fetchCharacterDataById } from "../services/anilistService.js";
import axios from 'axios';

const router = express.Router();

router.get("/characters", getAllCharacters);

router.get("/searchcharacters", searchForCharacters);

router.post("/check-by-database", checkForCharacter);

router.get('/search/:id', async (req, res) => {
  console.log('Starting character search in characterRoute');
  try {
    const { id } = req.params;
    const anilistData = await fetchCharacterDataById(id);

    if (!anilistData) {
      return res.status(404).json({ message: 'Character not found' });
    }

    const characterData = {
      anilistId: anilistData.id.toString() || '',
      names: {
        givenName: anilistData.name?.first || '',
        middleName: anilistData.name?.middle || '',
        surName: anilistData.name?.last || '',
        nativeName: anilistData.name?.native || '',
        alterNames: anilistData.name?.alternative || '',
        alterSpoiler: anilistData.name?.alternativeSpoiler || ''
      },
      about: anilistData.description || '',
      gender: anilistData.gender || '',
      age: anilistData.age?.toString() || '',
      DOB: {
        year: anilistData.dateOfBirth?.year?.toString() || '',
        month: anilistData.dateOfBirth?.month?.toString() || '',
        day: anilistData.dateOfBirth?.day?.toString() || '',
      },
      characterImage: anilistData.image?.large || ''
    };

    res.json(characterData);
  } catch (error) {
    console.error('Error searching character:', error);
    res.status(500).json({ message: 'Error searching character' });
  }
});

router.get("/character/:id", getCharacterInfo);

router.get("/find-character/:id", findCharacterInfo);

router.post("/addcharacter", createCharacter);

router.put("/character/:id", updateCharacter);

router.post("/create-from-anilist", createCharacterFromAnilist);

router.get("/batch", getBatchCharacters);

// Add the new proxy route for images
router.get('/image/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const imageUrl = `https://s4.anilist.co/file/anilistcdn/character/large/${imageId}`;
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Convert the image to base64
    const base64Image = Buffer.from(response.data).toString('base64');
    const dataUrl = `data:${response.headers['content-type'] || 'image/jpeg'};base64,${base64Image}`;

    // Send the data URL
    res.json({ dataUrl });
  } catch (error) {
    console.error('Error proxying image:', error);
    // Try alternative URL pattern if the first one fails
    try {
      const altImageUrl = `https://s4.anilist.co/file/anilistcdn/character/medium/${req.params.imageId}`;
      const altResponse = await axios.get(altImageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'Accept': 'image/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Convert the alternative image to base64
      const base64Image = Buffer.from(altResponse.data).toString('base64');
      const dataUrl = `data:${altResponse.headers['content-type'] || 'image/jpeg'};base64,${base64Image}`;

      res.json({ dataUrl });
    } catch (altError) {
      console.error('Error with alternative image URL:', altError);
      res.status(404).json({ message: 'Image not found' });
    }
  }
});

export default router;
