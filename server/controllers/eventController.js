/* eventController.js */

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
        eventType,
        timeOfDay
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

        // 1) Convert user date range to ISO8601 if provided
        //    e.g., "2025-05-01" => "2025-05-01T00:00:00Z"
        if (startDateTime) {
            ticketmasterParams.startDateTime = convertToISO8601(startDateTime, '00:00:00');
            ticketmasterParams.endDateTime = convertToISO8601(endDateTime, '23:59:59');
        }

        // 2) If eventType is provided, use classificationName
        //    Make sure it matches Ticketmaster's known classifications, e.g. "Music", "Sports"
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
                postalcode: event.postalcode,
            }));
        }

        // 3) Post-fetch filter by timeOfDay (morning, afternoon, evening, late-night)
        if (timeOfDay) {
            events = events.filter((e) => isWithinTimeOfDay(e.time, timeOfDay));
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
    if (isNaN(dateObj.getTime())) {
        return undefined;
    }
    return dateObj.toISOString(); // e.g., "2025-05-01T00:00:00.000Z"
}

/**
 * Check if an event's localTime is within the chosen timeOfDay category.
 * localTime is usually in "HH:MM:SS" format.
 */
function isWithinTimeOfDay(localTime, timeOfDay) {
    if (!localTime || localTime === 'Time not available') return true; // can't filter unknown time

    const [hourStr] = localTime.split(':');
    const hour = parseInt(hourStr, 10);
    if (isNaN(hour)) return true;

    // Define time blocks
    switch (timeOfDay) {
        case 'morning':     // 6am - 11:59am
            return hour >= 6 && hour < 12;
        case 'afternoon':   // 12pm - 5:59pm
            return hour >= 12 && hour < 18;
        case 'evening':     // 6pm - 9:59pm
            return hour >= 18 && hour < 22;
        case 'late-night':  // 10pm - 5:59am
            return (hour >= 22 && hour <= 23) || (hour >= 0 && hour < 6);
        default:
            return true;
    }
}

module.exports = { getEvents };
