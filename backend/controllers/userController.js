// /controllers/userController.js
import UserModel from "../Models/userModel.js";

const registerUser = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
        const user = await UserModel.findOne({ email: email });

        if (user) {
            res.send({ message: "This email id already registered" });
        } else {
            const newUser = new UserModel({
                firstName,
                lastName,
                email,
                password,
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

        if (password === user.password) {
            return res.json({ message: "Login Successful", user });
        } else {
            return res.status(401).json({ message: "Password didn't match" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export default {
    registerUser,
    loginUser
}