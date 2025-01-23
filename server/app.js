require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');

const app = express();

// Connect to DB
connectDB();

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (CSS, JS, HTML)

// Routes
app.use('/api/events', require('./routes/eventRoutes'));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/public/index.html'); // Serve the HTML file
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
