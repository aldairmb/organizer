import express from 'express';
import dbClient from '../../models/index.js';

const router = express.Router();

// Ensure the user is logged in
router.use((req, res, next) => {
    const protectedPaths = ['/add', '/edit', '/view', '/', '/share'];
    const requiresAuth = protectedPaths.some(path => req.path.startsWith(path));
    if (!req.session.userId && requiresAuth) {
        return res.redirect('/account/login');
    }
    next();
});

// Add new note
router.get('/add', (req, res) => {
    res.render('notes/add', { title: 'Add New Note' });
});

router.post('/add', async (req, res) => {
    const { title, content, email, accessLevel } = req.body;
    const userId = req.session.userId;

    try {
        const result = await dbClient.query(
            'INSERT INTO notes (title, content, user_id) VALUES ($1, $2, $3) RETURNING id',
            [title, content, userId]
        );
        const noteId = result.rows[0].id;

        // Optional: Share the note on creation
        if (email && accessLevel) {
            const userResult = await dbClient.query('SELECT id FROM users WHERE email = $1', [email]);
            const sharedUser = userResult.rows[0];
            if (sharedUser) {
                await dbClient.query(`
                    INSERT INTO shared_notes (note_id, shared_with_user_id, access_level, shared_by_user_id)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (note_id, shared_with_user_id) DO NOTHING
                `, [noteId, sharedUser.id, accessLevel, userId]);
            }
        }

        res.redirect(`/notes/view/${noteId}`);
    } catch (error) {
        console.error('Error inserting note:', error);
        res.status(500).send('Failed to add note.');
    }
});

// View note (if owner or shared)
router.get('/view/:id', async (req, res) => {
    const noteId = req.params.id;
    const userId = req.session.userId;

    try {
        const result = await dbClient.query(`
            SELECT * FROM notes 
            WHERE id = $1 AND (
                user_id = $2 OR 
                id IN (
                    SELECT note_id FROM shared_notes WHERE shared_with_user_id = $2
                )
            )
        `, [noteId, userId]);

        const note = result.rows[0];
        if (!note) {
            return res.status(404).send('Note not found or access denied.');
        }

        res.render('notes/view', {
            title: `Note: ${note.title}`,
            note,
        });
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).send('Failed to fetch note.');
    }
});

// List all notes (owned or shared)
router.get('/', async (req, res) => {
    const userId = req.session.userId;

    try {
        const ownedResult = await dbClient.query(`
            SELECT * FROM notes
            WHERE user_id = $1
            ORDER BY created_at DESC
        `, [userId]);

        const sharedResult = await dbClient.query(`
            SELECT notes.*, shared_notes.access_level
            FROM notes
            JOIN shared_notes ON notes.id = shared_notes.note_id
            WHERE shared_notes.shared_with_user_id = $1
            ORDER BY notes.created_at DESC
        `, [userId]);

        res.render('notes/index', {
            title: 'Your Notes',
            ownedNotes: ownedResult.rows,
            sharedNotes: sharedResult.rows,
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).send('Failed to fetch notes.');
    }
});

// Edit a note (only if owner)
router.get('/edit/:id', async (req, res) => {
    const noteId = req.params.id;
    const userId = req.session.userId;

    try {
        const result = await dbClient.query(
            'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
            [noteId, userId]
        );
        const note = result.rows[0];

        if (!note) {
            return res.status(404).send('Note not found or access denied.');
        }

        res.render('notes/edit', {
            title: `Edit Note: ${note.title}`,
            note,
        });
    } catch (error) {
        console.error('Error fetching note for editing:', error);
        res.status(500).send('Failed to fetch note.');
    }
});

router.post('/edit/:id', async (req, res) => {
    const noteId = req.params.id;
    const userId = req.session.userId;
    const { title, content } = req.body;

    try {
        const result = await dbClient.query(
            'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
            [noteId, userId]
        );
        if (!result.rows[0]) {
            return res.status(403).send('You do not have permission to edit this note.');
        }

        await dbClient.query(
            'UPDATE notes SET title = $1, content = $2 WHERE id = $3',
            [title, content, noteId]
        );

        res.redirect(`/notes/view/${noteId}`);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).send('Failed to update note.');
    }
});

// Delete a note (only if owner)
router.post('/delete/:id', async (req, res) => {
    const noteId = req.params.id;
    const userId = req.session.userId;

    try {
        const result = await dbClient.query(
            'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
            [noteId, userId]
        );
        if (!result.rows[0]) {
            return res.status(403).send('You do not have permission to delete this note.');
        }

        await dbClient.query('DELETE FROM notes WHERE id = $1', [noteId]);
        res.redirect('/notes');
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).send('Failed to delete note.');
    }
});

// Share note with user (by email)
router.post('/share/:id', async (req, res) => {
    const noteId = req.params.id;
    const userId = req.session.userId;
    const { email, accessLevel } = req.body;

    try {
        const result = await dbClient.query('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [noteId, userId]);
        if (!result.rows[0]) {
            return res.status(403).send('You do not own this note.');
        }

        const userResult = await dbClient.query('SELECT id FROM users WHERE email = $1', [email]);
        const sharedUser = userResult.rows[0];

        if (!sharedUser) {
            return res.status(404).send('User not found.');
        }

        await dbClient.query(`
            INSERT INTO shared_notes (note_id, shared_with_user_id, access_level, shared_by_user_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (note_id, shared_with_user_id) DO NOTHING
        `, [noteId, sharedUser.id, accessLevel, userId]);

        res.redirect(`/notes/view/${noteId}`);
    } catch (error) {
        console.error('Error sharing note:', error);
        res.status(500).send('Failed to share note.');
    }
});

export default router;
