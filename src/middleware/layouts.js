import { renderFile } from 'ejs';
import path from 'path';
import { getNav } from '../utils/index.js';

/**
 * Middleware to automatically wrap EJS views in a layout.
 * This replicates `express-ejs-layouts` behavior in pure EJS.
 */
const layouts = (req, res, next) => {
    const layoutDir = req.app.get('layouts') || path.join(process.cwd(), 'views/layouts');
    const defaultLayout = req.app.get('layout default')?.replace(/\.ejs$/, '') || 'default';

    const originalRender = res.render;

    res.render = (view, options = {}, callback) => {
        const mergedOptions = { ...res.locals, ...options };

        // Inject navHTML into the layout context
        mergedOptions.navHTML = getNav(req);

        if (mergedOptions.layout === false) {
            return originalRender.call(res, view, mergedOptions, callback);
        }

        const viewsDir = res.app.get('views');
        const viewPath = view.startsWith(viewsDir) ? view : path.join(viewsDir, `${view}.ejs`);

        renderFile(viewPath, mergedOptions, (err, body) => {
            if (err) {
                return next(err);
            }

            mergedOptions.body = body || '';

            const layoutFile = `${mergedOptions.layout || defaultLayout}.ejs`;
            const layoutPath = path.join(layoutDir, layoutFile);

            originalRender.call(res, layoutPath, mergedOptions, callback);
        });
    };

    if (!res.headersSent) {
        next();
    }
};

export default layouts;
