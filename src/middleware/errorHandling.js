// 404 Error Handler: Catch all unmatched routes
const notFoundHandler = (req, res, next) => {
    res.status(404).render('404', { title: 'Page Not Found' });
};

// 500 Error Handler: Catch internal server errors
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('500', { title: 'Internal Server Error' });
};

export { notFoundHandler, errorHandler };
