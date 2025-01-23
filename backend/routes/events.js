const express = require("express");
const axios = require("axios");
const router = express.Router();

//Fetch Events
router.get("/", async (req, res) => 
{
    const {latitude, longitude} = req.query;
    const eventbriteUrl = `https://www.eventbriteapi.com/v3/events/search/?location.latitude=${latitude}&location.longitude=${longitude}`;

    try
    {
        const response = await axios.get(eventbriteUrl, 
        {
            headers: 
            {
                Authorization: `Bearer ${process.env.EVENTBRITE_API_KEY}`,
            },
        });
        res.json(response.data);
    }
    catch (error)
    {
        console.error("Error fetching:". error.message);
        res.status(500).send("Failed to fetch events");
    }
});

module.export = router;