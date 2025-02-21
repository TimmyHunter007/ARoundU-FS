require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');

const app = express();

// Connect to DB
connectDB();

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (CSS, JS, HTML)

// Rate Limit
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {error: "Too many requests"},
});

// Routes
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/public/index.html'); // Serve the HTML file
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
