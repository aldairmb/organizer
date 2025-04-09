import express from 'express';
import { addEvent, getUserEvents, deleteEvent } from '../../models/event/index.js'; // Import the event model

const router = express.Router();

// Route to get events for the user (this will be used by the calendar to fetch existing events)
router.get('/', async (req, res) => {
    const userId = req.session.userId; // Get user ID from the session

    try {
        const events = await getUserEvents(userId);
        res.json(events); // Return the events as JSON to the frontend
    } catch (error) {
        res.status(500).send('Error fetching events.');
    }
});

// Route to add a new event
router.post('/add', async (req, res) => {
    const { title, time } = req.body;
    const userId = req.session.userId; // Get user ID from the session

    try {
        const event = await addEvent(title, time, userId);
        res.json(event); // Return the added event as JSON
    } catch (error) {
        res.status(500).send('Error adding event.');
    }
});

// Route to delete an event
router.post('/delete/:id', async (req, res) => {
    const eventId = req.params.id;

    try {
        await deleteEvent(eventId);
        res.status(200).send('Event deleted successfully');
    } catch (error) {
        res.status(500).send('Error deleting event.');
    }
});

export default router;
