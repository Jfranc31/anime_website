// /controllers/userController.js
import UserModel from "../Models/userModel.js";
import AnimeModel from "../Models/animeModel.js";
import MangaModel from "../Models/mangaModel.js";
import bcrypt from 'bcrypt';

const registerUser = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
        const user = await UserModel.findOne({ email: email });

        if (user) {
            res.send({ message: "This email id already registered" });
        } else {
            // Hash the password before saving it to the database
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const newUser = new UserModel({
                firstName,
                lastName,
                email,
                password: hashedPassword,
            });

            await newUser.save();
            res.send({ message: "Successfully registered" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await UserModel.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ message: "This email id is not registered" });
        }

        // Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            return res.json({ message: "Login Successful", user });
        } else {
            return res.status(401).json({ message: "Password didn't match" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getUserInfo = async (req, res) => {
    try {
        const userID = req.params.userId;
        const user = await UserModel.findById(userID);
        if(!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch(error) {
        console.error("Error fetching user for page: ",error);
        res.status(500).json({ message: 'internal Server Error' });
    }
};

const addAnime = async (req, res) => {
    const { userId } = req.params;
    const { animeId, status, currentEpisode } = req.body;

    try {
        // Find the user
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        
        user.animes.push({ animeId, status, currentEpisode });

        // Save the updated user
        await user.save();

        // Fetch the updated user with populated anime details
        const updatedUser = await UserModel.findById(userId);

        return res.json({ message: "Anime updated successfully", user: updatedUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const addManga = async (req, res) => {
    const { userId } = req.params;
    const { mangaId, status, currentChapter, currentVolume } = req.body;

    try {
        // find the user
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.mangas.push({ mangaId, status, currentChapter, currentVolume });

        // Save the updated user
        await user.save();

        // Fetch the updated user with populated manga details
        const updatedUser = await UserModel.findById(userId);

        return res.json({ message: "Manga updated successfully", user: updatedUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const updateUserAnime = async (req, res) => {
    const { userId } = req.params;
    const { animeId, status, currentEpisode } = req.body;

    try {
        // Find the user
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the anime is already in the user's list
        const existingAnimeIndex = user.animes.findIndex(anime => anime.animeId.toString() === animeId.toString());


        if (existingAnimeIndex !== -1) {
            const anime = await AnimeModel.findById(animeId).select('lengths.Episodes');
            console.log(anime);
            // Update the existing show
            if(status === "Completed"){
                user.animes[existingAnimeIndex].status = status;
                user.animes[existingAnimeIndex].currentEpisode = anime.lengths.Episodes;
            } else if (status === "Planning") {
                if(currentEpisode > 0 && currentEpisode < anime.lengths.Episodes){
                    user.animes[existingAnimeIndex].status = "Watching";
                    user.animes[existingAnimeIndex].currentEpisode = currentEpisode;
                } else if(currentEpisode >= anime.lengths.Episodes) {
                    if(anime.lengths.Episodes !== 0){
                        user.animes[existingAnimeIndex].status = "Completed";
                        user.animes[existingAnimeIndex].currentEpisode = anime.lengths.Episodes;
                    } else {
                        user.animes[existingAnimeIndex].currentEpisode = currentEpisode;
                    }
                } else {
                    user.animes[existingAnimeIndex].status = status;
                    user.animes[existingAnimeIndex].currentEpisode = currentEpisode;
                }
            } else {
                user.animes[existingAnimeIndex].status = status;
                if(currentEpisode >= anime.lengths.Episodes){
                    if(anime.lengths.Episodes !== 0){
                        user.animes[existingAnimeIndex].status = "Completed";
                        user.animes[existingAnimeIndex].currentEpisode = anime.lengths.Episodes;
                    } else {
                        user.animes[existingAnimeIndex].currentEpisode = currentEpisode;
                    }
                } else {
                    user.animes[existingAnimeIndex].currentEpisode = currentEpisode;
                }
            }

            const activity = new Date();

            user.animes[existingAnimeIndex].activityTimestamp = activity.toLocaleString('en-US');
            console.log(activity, user.animes[existingAnimeIndex].activityTimestamp);

            // Save the updated user
            await user.save();

            // Fetch the updated user with populated anime details
            const updatedUser = await UserModel.findById(userId);

            return res.json({ message: "Anime updated successfully", user: updatedUser });
        } else {
            return res.status(404).json({ message: "Anime not found in user's list" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const updateUserManga = async (req, res) => {
    const { userId } = req.params;
    const { mangaId, status, currentChapter, currentVolume } = req.body;

    try {
        // Find the user
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the manga is already in the user's list
        const existingMangaIndex = user.mangas.findIndex(manga => manga.mangaId.toString() === mangaId.toString());

        if (existingMangaIndex !== -1) {
            const mangaChapters = await MangaModel.findById(mangaId).select('lengths.chapters');
            const mangaVolumes = await MangaModel.findById(mangaId).select('lengths.volumes');
            if(status === "Completed"){
                user.mangas[existingMangaIndex].status = status;
                user.mangas[existingMangaIndex].currentChapter = mangaChapters.lengths.chapters;
                user.mangas[existingMangaIndex].currentVolume = mangaVolumes.lengths.volumes;
            } else if (status === "Planning") {
                if ((currentChapter > 0 || currentVolume > 0) && (currentChapter < mangaChapters.lengths.chapters || currentVolume < mangaVolumes.lengths.volumes)) {
                    user.mangas[existingMangaIndex].status = "Reading";
                    user.mangas[existingMangaIndex].currentChapter = currentChapter;
                    user.mangas[existingMangaIndex].currentVolume = currentVolume;
                } else if (currentChapter >= mangaChapters.lengths.chapters || currentVolume >= mangaVolumes.lengths.volumes) {
                    if(mangaChapters !== 0) {
                    user.mangas[existingMangaIndex].status = "Completed";
                    user.mangas[existingMangaIndex].currentChapter = mangaChapters.lengths.chapters;
                    user.mangas[existingMangaIndex].currentVolume = mangaVolumes.lengths.volumes;
                    }
                } else {
                    user.mangas[existingMangaIndex].status = status;
                    user.mangas[existingMangaIndex].currentChapter = currentChapter;
                    user.mangas[existingMangaIndex].currentVolume = currentVolume;
                }
            } else {
                user.mangas[existingMangaIndex].status = status;
                if(currentChapter >= mangaChapters.lengths.chapters || currentVolume >= mangaVolumes.lengths.volumes) {
                    user.mangas[existingMangaIndex].status = "Completed";
                    user.mangas[existingMangaIndex].currentChapter = mangaChapters.lengths.chapters;
                    user.mangas[existingMangaIndex].currentVolume = mangaVolumes.lengths.volumes;
                } else {
                    user.mangas[existingMangaIndex].currentChapter = currentChapter;
                    user.mangas[existingMangaIndex].currentVolume = currentVolume;
                }
            }
        }

        const activity = new Date();

        user.mangas[existingMangaIndex].activityTimestamp = activity.toLocaleString('en-US');

        // Save the updated user
        await user.save();

        // Fetch the updated user with populated anime details
        const updatedUser = await UserModel.findById(userId);

        return res.json({ message: "Manga updated successfully", user: updatedUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const removeAnime = async (req, res) => {
    const userId = req.params.userId;
    const animeId = req.body.animeId;

    try{
        const user = await UserModel.findById(userId);

        const animeIndex = user.animes.findIndex((userAnime) => userAnime.animeId.toString() === animeId);
        console.log(animeIndex);

        if (animeIndex !== -1) {
            user.animes.splice(animeIndex, 1);

            await user.save();

            return { success: true, message: 'Anime removed successfully' };
        } else {
            return { success: false, message: 'Anime not found in user list' };
        }
    } catch (error) {
        console.error('Error removing anime from user list:', error);
        return { success: false, message: 'Internal server error' };
    }
};

const removeManga = async (req, res) => {
    const userId = req.params.userId;
    const mangaId = req.body.mangaId;

    try{
        const user = await UserModel.findById(userId);

        const mangaIndex = user.mangas.findIndex((userManga) => userManga.mangaId.toString() === mangaId);
        console.log(mangaIndex);

        if (mangaIndex !== -1) {
            user.mangas.splice(mangaIndex, 1);

            await user.save();

            return { success: true, message: 'Manga removed successfully' };
        } else {
            return {success: false, message: 'Manga not found in user list' };
        }
    } catch (error) {
        console.error('Error removing manga from user list:', error);
        return { success: false, message: 'Internal server error' };
    }
};

export default {
    registerUser,
    loginUser,
    updateUserAnime,
    updateUserManga,
    addAnime,
    getUserInfo,
    addManga,
    removeAnime,
    removeManga
}