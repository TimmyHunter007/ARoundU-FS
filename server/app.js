// Load environment variables from a .env file into process.env
require('dotenv').config();

// Import necessary modules
const express = require('express');         // Express framework for building web servers
const bodyParser = require('body-parser');    // Middleware to parse incoming request bodies
const connectDB = require('./config/db');     // Function to connect to the database
const rateLimit = require('express-rate-limit'); // Middleware for rate limiting requests

// Initialize an Express application
const app = express();

// Connect to the database
connectDB();

// Middleware setup

// Parse JSON bodies in incoming requests
app.use(bodyParser.json());
// Serve static files (CSS, JS, HTML) from the "public" directory
app.use(express.static('public'));

// Configure rate limiting: limit each IP to 100 requests per 15 minutes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes in milliseconds
    max: 100,                   // Maximum 100 requests per window per IP
    message: { error: "Too many requests" }, // Response message when limit is reached
});

// Routes setup

// Mount the events API routes under /api/events
app.use('/api/events', require('./routes/eventRoutes'));
// Mount the authentication API routes under /api/auth
app.use('/api/auth', require('./routes/authRoutes'));

// Serve index.html for the root route ('/')
// This sends the main HTML file for the application when the root URL is requested
app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/public/index.html');
});

// Define the port the server will listen on; use environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server and log a message to the console once running
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
