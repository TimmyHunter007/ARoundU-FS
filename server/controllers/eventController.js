const axios = require('axios');
require('dotenv').config();

/**
 * GET /api/events
 * Handles fetching events from Ticketmaster with optional filters:
 * - startDate & endDate => date range
 * - eventType => classificationName
 * - timeOfDay => filter by localTime after retrieval (morning, afternoon, evening, late-night)
 */
const getEvents = async (req, res) => {
    const {
        location,
        radius = 10,
        startDateTime,
        endDateTime,
        startTime,
        eventType
    } = req.query;

    if (!location) {
        return res.status(400).json({ error: 'Location is required' });
    }

    try {
        // Separate lat/long
        const [latitude, longitude] = location.split(',');

        // Build Ticketmaster query params
        const ticketmasterParams = {
            apikey: process.env.TICKETMASTER_API_KEY,
            latlong: `${latitude},${longitude}`,
            radius,
            unit: 'miles',
        };

        if (startDateTime) {
            ticketmasterParams.startDateTime = convertToISO8601(startDateTime, '00:00:00');
        }

        if (endDateTime) {
            ticketmasterParams.endDateTime = convertToISO8601(endDateTime, '23:59:59');
        }

        if (eventType) {
            ticketmasterParams.classificationName = eventType;
        }

        // Fetch events from Ticketmaster
        const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
            params: ticketmasterParams,
        });

        let events = [];
        if (response.data && response.data._embedded && response.data._embedded.events) {
            events = response.data._embedded.events.map((event) => ({
                name: event.name,
                date: event.dates.start.localDate || 'Date not available',
                time: event.dates.start.localTime || 'Time not available',
                latitude: parseFloat(event._embedded.venues[0].location.latitude),
                longitude: parseFloat(event._embedded.venues[0].location.longitude),
                description: event.info || 'No description available',
                postalcode: event._embedded.venues[0].postalCode || 'N/A',
            }));
        }

        // Optional filter by startTime after fetching
        if (startTime) {
            const selectedHour = parseInt(startTime.split('T')[1].split(':')[0], 10);
            events = events.filter((e) => {
                if (!e.time || e.time === 'Time not available') return true;
                const eventHour = parseInt(e.time.split(':')[0], 10);
                return eventHour === selectedHour;
            });
        }

        res.status(200).json({ events });
    } catch (error) {
        console.error('Error fetching events:', error.message);
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

/**
 * Convert a date like "2025-05-01" + "HH:mm:ss" to an ISO8601 string for Ticketmaster
 */
function convertToISO8601(dateString, timeString) {
    const dateObj = new Date(`${dateString}T${timeString}`);
    return isNaN(dateObj.getTime()) ? undefined : dateObj.toISOString();
}

module.exports = { getEvents };
