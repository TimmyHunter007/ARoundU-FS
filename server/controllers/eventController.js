const axios = require('axios');
require('dotenv').config(); // Load environment variables

const getEvents = async (req, res) => {
    const { location, radius = 10 } = req.query; // Default radius to 10 miles
    if (!location) {
        return res.status(400).json({ error: 'Location is required' });
    }

    try {
        const [latitude, longitude] = location.split(',');
        const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
            params: {
                apikey: process.env.TICKETMASTER_API_KEY,
                latlong: `${latitude},${longitude}`,
                radius,
                unit: 'miles',
            },
        });

        if (response.data && response.data._embedded && response.data._embedded.events) {
            const events = response.data._embedded.events.map((event) => ({
                name: event.name,
                date: event.dates.start.localDate || "Date not available",
                time: event.dates.start.localTime || "Time not available",
                latitude: parseFloat(event._embedded.venues[0].location.latitude),
                longitude: parseFloat(event._embedded.venues[0].location.longitude),
                description: event.info || 'No description available',
            }));
            res.status(200).json({ events });
        } else {
            res.status(200).json({ events: [] });
        }
    } catch (error) {
        console.error('Error fetching events:', error.message);
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

module.exports = { getEvents };
