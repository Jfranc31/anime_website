/**
 * /db/mongoose.js
 * Description: Configuration file for connecting to MongoDB using Mongoose.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables from the specified .env file
dotenv.config({
  path: path.resolve(__dirname, '..', '..', '.env')
});

// MongoDB URI retrieved from environment variables
let MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI && !MONGO_URI.endsWith('/')) {
  MONGO_URI = MONGO_URI + '/animewebsite';
}

console.log('Looking for .env file at: ', path.resolve(__dirname, '..', '..', '.env'));
console.log('MongoDB URI found: ', MONGO_URI ? 'Yes' : 'No');

if (!MONGO_URI) {
  console.error('MONGO_URI is undefined. Please check your .env file configuration.');
  process.exit(1);
}

// Connect to MongoDB using Mongoose
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connection Successful");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });

export default mongoose;
