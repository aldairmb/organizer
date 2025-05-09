import express from 'express';
import path from 'path';

/** @type {Array<{route: string, dir: string}|string>} Static path configurations */
const staticPaths = [
   { route: '/css', dir: 'public/css' },
   { route: '/js', dir: 'public/js' },
   { route: '/images', dir: 'public/images' }
];

/**
 * THIS IS A CUSTOM FUNCTION. This code is specifically needed to support Brother Keers' layout
 * middleware. If you decide not to use Brother Keers' layout middleware, you can remove this and
 * will need to add the normal express.static middleware to your server.js file.
 * 
 * Configures static paths for the given Express application.
 *
 * @param {Object} app - The Express application instance.
 */
const configureStaticPaths = (app) => {
    // Track registered paths
    const registeredPaths = new Set(app.get('staticPaths') || []);
    
    staticPaths.forEach((pathConfig) => {
        const pathKey = typeof pathConfig === 'string' ? pathConfig : pathConfig.route;
        
        if (!registeredPaths.has(pathKey)) {
            registeredPaths.add(pathKey);
            
            if (typeof pathConfig === 'string') {
                // Register the path directly
                app.use(pathConfig, express.static(pathConfig));
            } else {
                // Register the path with the specified route and directory
                app.use(pathConfig.route, express.static(path.join(process.cwd(), pathConfig.dir)));
            }
        }
    });

    // Update the app settings with the newly registered paths
    app.set('staticPaths', Array.from(registeredPaths));
};

/**
 * Returns the navigation menu.
 *
 * @returns {string} The navigation menu.
 */
// utils/index.js
const getNav = (req) => {
    const isLoggedIn = !!req.session?.userId;
    const userRole = req.session?.userRole;
    const isLoginOrRegisterPage = req.originalUrl === '/account/login' || req.originalUrl === '/account/register';

    let navLinks = '';

    // Don't display "My Notes" if on the login or register page
    if (!isLoginOrRegisterPage) {
        navLinks += `<a href="/notes">My Notes</a>`;
    }

    // If the user is an admin or owner, show the Admin link
    if (userRole === 'admin' || userRole === 'owner') {
        navLinks += `<a href="/admin">Admin</a>`;
    }

    // Add the logout link at the end, if logged in
    if (isLoggedIn) {
        navLinks += `<a href="/account/logout" class="logout-button">Logout</a>`;
    }

    return `
        <nav>
            ${navLinks}
        </nav>
    `;
};

export { configureStaticPaths, getNav };
