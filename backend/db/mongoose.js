/**
 * /db/mongoose.js
 * Description: Configuration file for connecting to MongoDB using Mongoose.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from the specified .env file
dotenv.config({ path: '/Users/david923/Desktop/Portfolio/anime_website/.env' });

// MongoDB URI retrieved from environment variables
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB using Mongoose
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connection Successfull');
}).catch((err) => {
    console.error('MongoDB Connection Error:', err);
});

export default mongoose;