import express from "express";
import { createUser, findUserByEmail, comparePassword } from "../../models/account/index.js";

const router = express.Router();

// 🔹 GET Register Page
router.get("/register", (req, res) => {
    res.render("account/register", { title: "Register" });
});
// 🔹 POST Register Form
router.post("/register", async (req, res) => {
    const { username, email, password, confirm_password } = req.body;

    // Validate fields
    if (!username || !email || !password || !confirm_password) {
        return res.status(400).send("❌ All fields are required.");
    }

    if (password !== confirm_password) {
        return res.status(400).send("❌ Passwords do not match.");
    }

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).send("❌ Email is already in use.");
        }

        // Create new user
        const newUser = await createUser(username, email, password);

        // 🔐 Log them in by setting session
        req.session.userId = newUser.id;
        req.session.userRole = newUser.role;

        // 👋 Redirect to homepage or notes
        return res.redirect('/notes');
    } catch (error) {
        console.error(error);
        res.status(500).send("❌ Error registering user.");
    }
});
// 🔹 GET Login Page
router.get("/login", (req, res) => {
    res.render("account/login", { title: "Login" });
});

// 🔹 POST Login Form
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(400).send("❌ User not found.");
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(400).send("❌ Incorrect password.");
        }

        // Store the user ID and role in the session to track login state
        req.session.userId = user.id;
        req.session.userRole = user.role;

        // Redirect based on the user's role
        if (user.role === 'admin' || user.role === 'owner') {
            return res.redirect('/admin');
        } else {
            return res.redirect('/notes');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("❌ Error logging in.");
    }
});

// 🔹 GET Logout
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("❌ Error logging out.");
        }
        res.redirect('/account/login');
    });
});


export default router;
