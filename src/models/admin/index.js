// src/routes/admin/index.js

import express from 'express';
import { getAllUsers, updateUserRole, deleteUserById } from '../../models/admin/index.js';

const router = express.Router();

// Admin Dashboard - Display all users
router.get('/', async (req, res) => {
    const userId = req.session.userId;

    // Check if the current user is an admin
    const userResult = await dbClient.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user || user.role !== 'admin') {
        return res.status(403).send('You do not have permission to access this page.');
    }

    try {
        const users = await getAllUsers();
        res.render('admin/index', {
            title: 'Admin Dashboard',
            users
        });
    } catch (error) {
        console.error('Error fetching users for admin dashboard:', error);
        res.status(500).send('Error fetching users.');
    }
});

// Update user role
router.post('/edit/:id', async (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;

    try {
        const updatedUser = await updateUserRole(userId, role);
        res.redirect('/admin');  // Redirect to admin dashboard
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).send('Failed to update user role.');
    }
});

// Delete user
router.post('/delete/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const deletedUser = await deleteUserById(userId);
        res.redirect('/admin');  // Redirect to admin dashboard
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Failed to delete user.');
    }
});

export default router;
