import dbClient from '../../models/index.js';
import bcrypt from 'bcryptjs';

// 🔹 Create a new user (Register)
export const createUser = async (username, email, password) => {
    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into DB with username
        const result = await dbClient.query(
            `INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email;`,
            [username, email, hashedPassword]
        );
        
        return result.rows[0];
    } catch (error) {
        console.error("❌ Error creating user:", error);
        throw error;
    }
};

// 🔹 Find user by email (for login)
export const findUserByEmail = async (email) => {
    try {
        const result = await dbClient.query(
            `SELECT * FROM users WHERE email = $1;`,
            [email]
        );
        return result.rows[0];
    } catch (error) {
        console.error("❌ Error finding user:", error);
        throw error;
    }
};

// 🔹 Compare passwords
export const comparePassword = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};
