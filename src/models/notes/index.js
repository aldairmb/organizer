// src/models/dbClient.js

import { pool } from './database-connection.js'; 

// Function to add a new note
export const addNote = async (title, content, userId) => {
    try {
        const query = 'INSERT INTO notes (title, content, user_id) VALUES ($1, $2, $3) RETURNING *';
        const result = await pool.query(query, [title, content, userId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error adding note:', error);
        throw error;
    }
};

// Function to get a note by its ID
export const getNoteById = async (noteId) => {
    try {
        const query = 'SELECT * FROM notes WHERE id = $1';
        const result = await pool.query(query, [noteId]);
        return result.rows[0]; 
    } catch (error) {
        console.error('Error fetching note:', error);
        throw error;
    }
};

// Function to get all notes
export const getAllNotes = async () => {
    try {
        const query = 'SELECT * FROM notes ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching notes:', error);
        throw error;
    }
};
