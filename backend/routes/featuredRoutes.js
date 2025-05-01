import express from "express";
import { getFeaturedContent } from "../controllers/featuredController.js";

const router = express.Router();

router.get("/", getFeaturedContent);

export default router; 