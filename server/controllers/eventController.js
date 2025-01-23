const axios = require('axios');
/*
const getEvents = async (req, res) => 
{
    const { location } = req.query;
    if (!location) 
    {
        return res.status(400).json({ error: 'Location is required' });
    }
    try 
    {
        const response = await axios.get('https://www.eventbriteapi.com/v3/events/search/', 
        {
            headers: 
            {
                Authorization: `Bearer ${process.env.EVENTBRITE_API_KEY}`, // Use your token
            },
            params: 
            {
                'location.latitude': location.split(',')[0],
                'location.longitude': location.split(',')[1],
            },
        });
        res.status(200).json(response.data);
    } 
    catch (error) 
    {
        console.error('Error fetching events:', error.message);
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

module.exports = { getEvents };
*/
const axios = require('axios');

const getEvents = async (req, res) => {
    const { location } = req.query;
    if (!location) {
        return res.status(400).json({ error: 'Location is required' });
    }

    try {
        // Split location into latitude and longitude
        const [latitude, longitude] = location.split(',');

        // Call Ticketmaster's Discovery API for events
        const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
            params: {
                apikey: process.env.TICKETMASTER_CONSUMER_KEY, // Ticketmaster API Key
                latlong: `${latitude},${longitude}`,
                radius: 25, // Radius in miles
                unit: 'miles',
                size: 10, // Number of events
            },
        });

        // Respond with the data
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching events:', error.message);
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

module.exports = { getEvents };
