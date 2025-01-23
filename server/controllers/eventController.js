/*
const axios = require('axios');

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
        const [latitude, longitude] = location.split(',');
        const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
            params: {
                apikey: process.env.TICKETMASTER_API_KEY, // Ensure this environment variable is set
                latlong: `${latitude},${longitude}`,
                radius: 10, // Adjust the search radius if necessary
                unit: 'miles', // Use 'km' for kilometers
            },
        });

        console.log('Ticketmaster API Response:', response.data); // Debugging

        if (response.data && response.data._embedded && response.data._embedded.events) {
            const events = response.data._embedded.events.map((event) => ({
                name: event.name,
                latitude: parseFloat(event._embedded.venues[0].location.latitude),
                longitude: parseFloat(event._embedded.venues[0].location.longitude),
                description: event.info || 'No description available',
            }));
            res.status(200).json({ events });
        } else {
            res.status(200).json({ events: [] }); // No events found
        }
    } catch (error) {
        console.error('Error fetching events:', error.message);
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

module.exports = { getEvents };
