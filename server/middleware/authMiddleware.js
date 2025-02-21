const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1]; // e.g. "Bearer <token>"
    if (!token) {
        return res.status(401).json({ error: 'No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Put userId on req object so next route can use it
        req.userId = decoded.userId;
        next();
    } catch (err) {
        console.error('Token verification error:', err);
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};
