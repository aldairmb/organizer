import configNodeEnv from './src/middleware/node-env.js';
import express from "express";
import homeRoute from './src/routes/index.js';
import layouts from './src/middleware/layouts.js';
import path from "path";
import { configureStaticPaths } from './src/utils/index.js';
import { fileURLToPath } from 'url';
import { testDatabase, setupDatabase } from './src/models/index.js';
import { notFoundHandler, errorHandler } from './src/middleware/errorHandling.js';
import notesRoutes from './src/routes/notes/index.js';  
import accountRoute from './src/routes/account/index.js';
import adminRoutes from './src/routes/admin/index.js';
import dbClient from "./src/models/index.js";
import session from 'express-session';
import eventRoutes from './src/routes/event/index.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mode = process.env.NODE_ENV;
const port = process.env.PORT;

const app = express();

// Configure the application based on environment settings
app.use(configNodeEnv);

// Configure static paths (public dirs) for the Express application
configureStaticPaths(app);

// Set EJS as the view engine and record the location of the views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Set Layouts middleware to automatically wrap views in a layout and configure default layout
app.set('layout default', 'default');
app.set('layouts', path.join(__dirname, 'src/views/layouts'));
app.use(layouts);

// Session management middleware
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'your_secret_key',
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: mode === 'production',
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        }
    })
);

// Global middleware to check if the user is logged in
app.use((req, res, next) => {
    const publicRoutes = ['/account/login', '/account/register'];
    // Skip the check for public routes like login and register
    if (publicRoutes.includes(req.path)) {
        return next();
    }

    // If the user is not logged in, redirect to /notes (instead of /account/login)
    if (!req.session.userId) {
        return res.redirect('/account/login');
    }
    next();
});


// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global variable to set a default title for all pages
app.use((req, res, next) => {
    res.locals.title = 'My Application';
    res.locals.userId = req.session.userId;  // Make userId available globally
    res.locals.userRole = req.session.userRole;  // Make userRole available globally
    next();
});

/**
 * Routes
 */
app.use('/notes', notesRoutes);  
app.use('/account', accountRoute);
app.use('/admin', adminRoutes);
app.use('/events', eventRoutes);
app.use(notFoundHandler); 
app.use(errorHandler); 
app.use('/', homeRoute);

/**
 * WebSocket server setup (only in dev mode)
 */
if (mode.includes('dev')) {
    const ws = await import('ws');

    try {
        const wsPort = parseInt(port) + 1;
        const wsServer = new ws.WebSocketServer({ port: wsPort });

        wsServer.on('listening', () => {
            console.log(`🔌 WebSocket server running on port ${wsPort}`);
        });

        wsServer.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    } catch (error) {
        console.error('❌ Failed to start WebSocket server:', error);
    }
}

/**
 * Start the Express server and ensure database is set up before starting
 */
app.listen(port, async () => {
    try {
        await setupDatabase();
        console.log(`✅ Database setup complete. Server running on http://127.0.0.1:${port}`);
    } catch (error) {
        console.error('❌ Error during database setup:', error);
    }
});
