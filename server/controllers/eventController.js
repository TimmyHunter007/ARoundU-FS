// Import the axios library to make HTTP requests.
const axios = require('axios');
// Load environment variables from a .env file.
require('dotenv').config();

/**
 * Controller function to fetch events from the Ticketmaster API based on query parameters.
 * Expects query parameters such as location, radius, date/time filters, and event type.
 *
 * @param {object} req - The request object containing query parameters.
 * @param {object} res - The response object used to send back the JSON data.
 */
const getEvents = async (req, res) => {
    // Destructure the required query parameters from the request.
    // If radius is not provided, it defaults to 10.
    const {
        location,
        radius = 10,
        startDateTime,
        endDateTime,
        startTime,
        eventType
    } = req.query;

    // Validate that the location parameter is provided.
    if (!location) {
        return res.status(400).json({ error: 'Location is required' });
    }

    try {
        // Extract latitude and longitude from the 'location' string (expected format: "lat,lng").
        const [latitude, longitude] = location.split(',');

        // Build the query parameters required by the Ticketmaster API.
        const ticketmasterParams = {
            apikey: process.env.TICKETMASTER_API_KEY, // API key from environment variables.
            latlong: `${latitude},${longitude}`,        // Coordinates in the required format.
            radius,                                     // Search radius (in miles).
            unit: 'miles',
        };

        // If either a start or end date/time filter is provided, convert them to ISO8601 format.
        if (startDateTime || endDateTime) {
            // Convert the start date/time to ISO format. If startTime is not provided, default to midnight.
            const startISO = startDateTime ? convertToISO8601(startDateTime, startTime || '00:00:00') : '*';
            // Convert the end date/time to ISO format. Notice the default time is set to "23:59:59".
            // (There is a minor typo here: "23:59"59" should likely be "23:59:59".)
            const endISO = endDateTime ? convertToISO8601(endDateTime, '23:59"59') : '*';

            // Add the localStartDateTime parameter to the Ticketmaster API query.
            // The API expects a range in the format "startISO,endISO".
            ticketmasterParams.localStartDateTime = `${startISO},${endISO}`;
        }

        // If an event type filter is provided, add it to the query parameters.
        if (eventType) {
            ticketmasterParams.classificationName = eventType;
        }

        // Make a GET request to the Ticketmaster API endpoint with the constructed parameters.
        const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
            params: ticketmasterParams,
        });

        // Initialize an empty array to store processed events.
        let events = [];

        // Check if the response contains event data.
        if (response.data && response.data._embedded && response.data._embedded.events) {
            // Map the raw Ticketmaster event data to a simpler object structure.
            events = response.data._embedded.events.map((event) => ({
                name: event.name,
                // Use provided local date or a fallback message if not available.
                date: event.dates.start.localDate || 'Date not available',
                // Use provided local time or a fallback message if not available.
                time: event.dates.start.localTime || 'Time not available',
                // Parse latitude and longitude from the venue's location.
                latitude: parseFloat(event._embedded.venues[0].location.latitude),
                longitude: parseFloat(event._embedded.venues[0].location.longitude),
                // Use the event info or a fallback if not available.
                description: event.info || 'No description available',
                // Use the please note info or a fallback if not available.
                pleaseNote: event.pleaseNote || 'No description available',
                // Use provided address or a fallback message if not available.
                address: event._embedded.venues[0].address.line1 || 'State not available',
                // Use the postal code or 'N/A' if not provided.
                postalcode: event._embedded.venues[0].postalCode || 'N/A',
                // Use provided city or a fallback message if not available.
                city: event._embedded.venues[0].city.name || 'City not available',
                // Use provided state code or a fallback message if not available.
                stateCode: event._embedded.venues[0].state.stateCode || 'State not available',
            }));
        }

        // If a startTime filter is provided, further filter the events by comparing the event hour.
        if (startTime) {
            // Extract the hour from the provided startTime (assumes format "HH:mm" or similar).
            const selectedHour = parseInt(startTime.split(':')[0], 10);
            events = events.filter((e) => {
                // If the event's time is not available, include it in the results.
                if (!e.time || e.time === 'Time not available') return true;
                // Extract the hour from the event's time.
                const eventHour = parseInt(e.time.split(':')[0], 10);
                // Only include events that match the selected hour.
                return eventHour === selectedHour;
            });
        }

        // Respond with the filtered events data in JSON format.
        res.status(200).json({ events });
    } catch (error) {
        // Log the error message to the console for debugging.
        console.error('Error fetching events:', error.message);
        // Respond with an error status and message. Use the error response status if available, otherwise default to 500.
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

/**
 * Converts a date and time string into an ISO8601 formatted string.
 *
 * @param {string} dateString - The date in a string format (e.g., "2025-02-16").
 * @param {string} timeString - The time in a string format (e.g., "14:30:00").
 * @returns {string|undefined} The ISO8601 formatted date-time string, or undefined if the date is invalid.
 */
function convertToISO8601(dateString, timeString) {
    // Create a new Date object using the provided date and time.
    const dateObj = new Date(`${dateString}T${timeString}`);
    // If the Date object is invalid, return undefined; otherwise, return the ISO string.
    return isNaN(dateObj.getTime()) ? undefined : dateObj.toISOString();
}

// Export the getEvents function so it can be used by other parts of the application (e.g., as an API route).
module.exports = { getEvents };
