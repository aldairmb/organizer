import { pool } from '../index.js'; // Import your db connection

// Function to add a new event to the database
export const addEvent = async (title, time, userId) => {
    try {
        const query = 'INSERT INTO calendar_events (title, time, user_id) VALUES ($1, $2, $3) RETURNING *';
        const result = await pool.query(query, [title, time, userId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error adding event:', error);
        throw error;
    }
};

// Function to get all events for a specific user
export const getUserEvents = async (userId) => {
    try {
        const query = 'SELECT * FROM calendar_events WHERE user_id = $1 ORDER BY time';
        const result = await pool.query(query, [userId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching user events:', error);
        throw error;
    }
};

// Function to delete an event by its ID
export const deleteEvent = async (eventId) => {
    try {
        const query = 'DELETE FROM calendar_events WHERE id = $1';
        await pool.query(query, [eventId]);
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
};
