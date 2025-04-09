import express from 'express';
import dbClient from '../../models/index.js';

const router = express.Router();

// Ensure the user is logged in and has admin or owner role
router.use((req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/account/login');
    }

    const userId = req.session.userId;
    dbClient.query('SELECT * FROM users WHERE id = $1', [userId])
        .then((userResult) => {
            const user = userResult.rows[0];
            if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
                return res.status(403).send('You do not have permission to access this page.');
            }
            next();
        })
        .catch((error) => {
            console.error('Error checking user role:', error);
            res.status(500).send('Internal server error.');
        });
});

// Admin Dashboard - list users and contact messages
router.get('/', async (req, res) => {
    try {
        const usersResult = await dbClient.query('SELECT id, username, email, role FROM users WHERE role != $1', ['owner']);
        const messagesResult = await dbClient.query('SELECT * FROM contact_messages ORDER BY created_at DESC');

        res.render('admin/index', {
            title: 'Admin Dashboard',
            users: usersResult.rows,
            messages: messagesResult.rows,
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.status(500).send('Failed to fetch admin dashboard data.');
    }
});

// Edit user role
router.post('/edit/:id', async (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;

    // Prevent changing the "owner" role
    if (role === 'owner') {
        return res.status(400).send('You cannot assign the "owner" role through this interface.');
    }

    // Validate role
    if (!['user', 'admin'].includes(role)) {
        return res.status(400).send('Invalid role.');
    }

    try {
        await dbClient.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
        res.redirect('/admin');
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).send('Failed to update role.');
    }
});

// Delete user
router.post('/delete/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        await dbClient.query('DELETE FROM users WHERE id = $1', [userId]);
        res.redirect('/admin');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Failed to delete user.');
    }
});

// Delete contact message
router.post('/messages/delete/:id', async (req, res) => {
    const messageId = req.params.id;

    try {
        await dbClient.query('DELETE FROM contact_messages WHERE id = $1', [messageId]);
        res.redirect('/admin');
    } catch (error) {
        console.error('Error deleting contact message:', error);
        res.status(500).send('Failed to delete contact message.');
    }
});

// View all notes for a specific user (admin or owner-only)
router.get('/user/:id/notes', async (req, res) => {
    const currentUserId = req.session.userId;

    // Check if the current user is an admin or owner
    const userResult = await dbClient.query('SELECT * FROM users WHERE id = $1', [currentUserId]);
    const currentUser = userResult.rows[0];

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'owner')) {
        return res.status(403).send('You do not have permission to access this page.');
    }

    try {
        const userId = req.params.id;

        // Get the user’s notes
        const notesResult = await dbClient.query(
            'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        const userInfoResult = await dbClient.query(
            'SELECT id, username, email FROM users WHERE id = $1',
            [userId]
        );

        const userInfo = userInfoResult.rows[0];

        res.render('admin/user-notes', {
            title: `Notes by ${userInfo.username}`,
            user: userInfo,
            notes: notesResult.rows,
        });
    } catch (error) {
        console.error('Error fetching user notes:', error);
        res.status(500).send('Failed to fetch notes.');
    }
});

export default router;
