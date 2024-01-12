// /routes/characterRoutes.js
import express from 'express';
import characterController from '../controllers/characterController.js';

const router = express.Router();

router.get('/characters', characterController.getAllCharacters);

router.get('/searchcharacters', characterController.searchForCharacters);

router.get('/character/:id', characterController.getCharacterInfo);

router.post("/addcharacter", characterController.createCharacter);

router.put('/character/:id', characterController.updateCharacter);

export default router;