import express from 'express';
import dbClient from '../models/index.js';

const router = express.Router();

// Root route - Redirect to notes if the user is logged in
router.get('/', (req, res) => {
    if (!req.session.userId) {
        // If the user is not logged in, redirect to /notes instead of /account/login
        return res.redirect('/notes');
    }

    const userId = req.session.userId;
    
    // Check the user's role and redirect based on that
    dbClient.query('SELECT * FROM users WHERE id = $1', [userId])
        .then((userResult) => {
            const user = userResult.rows[0];
            if (!user) {
                // If the user doesn't exist in the database
                return res.redirect('/notes');
            }
            // Redirect to the appropriate page based on the user's role
            if (user.role === 'admin' || user.role === 'owner') {
                return res.redirect('/admin');
            } else {
                return res.redirect('/notes');
            }
        })
        .catch((error) => {
            console.error('Error checking user role:', error);
            res.status(500).send('Internal server error.');
        });
});

export default router;
