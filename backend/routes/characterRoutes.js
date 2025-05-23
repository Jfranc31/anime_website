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

export default router;
