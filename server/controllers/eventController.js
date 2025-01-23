const axios = require('axios');

const getEvents = async (req, res) => {
  try {
    const { location } = req.query;
    const response = await axios.get(`https://www.eventbriteapi.com/v3/events/search/`, {
      headers: {
        Authorization: `Bearer ${process.env.EVENTBRITE_API_KEY}`,
      },
      params: { location },
    });

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

module.exports = { getEvents };
