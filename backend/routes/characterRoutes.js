/**
 * /routes/characterRoutes.js
 * Description: Defines the routes related to character in the Express application.
 */

import express from "express";
import { 
  getAllCharacters,
  searchForCharacters,
  getCharacterInfo,
  createCharacter,
  updateCharacter,
  createCharacterFromAnilist
} from "../controllers/characterController.js";
import { fetchCharacterData } from "../services/anilistService.js";
import CharacterModel from "../Models/characterModel.js";

const router = express.Router();

router.get("/characters", getAllCharacters);

router.get("/searchcharacters", searchForCharacters);

router.get('/search/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const characterData = await fetchCharacterData(name);
    
    if (!characterData) {
      return res.status(404).json({ message: 'Character not found' });
    }
    
    res.json(characterData);
  } catch (error) {
    console.error('Error searching character:', error);
    res.status(500).json({ message: 'Error searching character' });
  }
});

router.get("/character/:id", getCharacterInfo);

router.post("/addcharacter", createCharacter);

router.put("/character/:id", updateCharacter);

router.post("/create-from-anilist", createCharacterFromAnilist);

export default router;
