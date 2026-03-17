import express from "express";
import { handleTranspile } from "../controllers/transpileController.js";

const router = express.Router();

router.post("/transpile", handleTranspile);

export default router;