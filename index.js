import express from "express";
import cors from "cors";
import transpileRoutes from "./src/routes/transpileRoutes.js";
import { PORT } from "./src/config/constants.js";

// Setup dasar
const app = express();
app.use(express.json());
app.use(cors());




// Endpoint utama
app.use("/api/", transpileRoutes);

app.listen(PORT, () =>
  	console.log(`Backend running on http://localhost:${PORT}`)
);
