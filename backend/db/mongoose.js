// /db/mongoose.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '/Users/david923/Desktop/Portfolio/anime_website/.env' });

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connection Successfull');
}).catch((err) => {
    console.error('MongoDB Connection Error:', err);
});

export default mongoose;