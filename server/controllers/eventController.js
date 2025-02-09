const axios = require('axios');
require('dotenv').config();

const getEvents = async (req, res) => {
  const {
    location,
    radius = 10,
    singleDate,
    eventType,
    timeOfDay
  } = req.query;

  if (!location) {
    return res.status(400).json({ error: 'Location is required' });
  }

  try {
    // Separate lat & lng
    const [latitude, longitude] = location.split(',');

    // Convert radius to a number if needed, or clamp here if you like
    let parsedRadius = parseFloat(radius) || 10;
    if (parsedRadius < 0) parsedRadius = 0;
    // If you want to protect from 400 errors, clamp to 100 or 200:
    if (parsedRadius > 200) parsedRadius = 200;

    // Build Ticketmaster query
    const ticketmasterParams = {
      apikey: process.env.TICKETMASTER_API_KEY,
      latlong: `${latitude},${longitude}`,
      radius: parsedRadius,
      unit: 'miles',
    };

    // If user picked a date, we combine it with timeOfDay
    if (singleDate) {
      const { startDateTime, endDateTime } = buildDateTimeRange(singleDate, timeOfDay);
      if (startDateTime && endDateTime) {
        ticketmasterParams.startDateTime = startDateTime;
        ticketmasterParams.endDateTime   = endDateTime;
      }
    }

    // If eventType is provided, map it to classificationName
    if (eventType) {
      ticketmasterParams.classificationName = eventType;
    }

    // Make the request to Ticketmaster
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
      }));
    }

    res.status(200).json({ events });
  } catch (error) {
    console.error('Error fetching events:', error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
};

/**
 * Build an ISO8601 date/time range (startDateTime & endDateTime) for the given singleDate + timeOfDay.
 */
function buildDateTimeRange(singleDate, timeOfDay) {
  // Map timeOfDay to a start/end hour range
  const { startHour, endHour, endMin, endSec } = getTimeRangeForTimeOfDay(timeOfDay);

  // Build the start and end in UTC for that date
  const startDateTime = makeIso8601Z(singleDate, startHour, 0, 0);
  const endDateTime   = makeIso8601Z(singleDate, endHour, endMin, endSec);

  return { startDateTime, endDateTime };
}

/**
 * Return the hours for each time-of-day block.
 * Adjust these if you want different definitions.
 */
function getTimeRangeForTimeOfDay(timeOfDay) {
  switch (timeOfDay) {
    case 'morning':
      // 6:00 -> 11:59:59
      return { startHour: 6, endHour: 11, endMin: 59, endSec: 59 };
    case 'afternoon':
      // 12:00 -> 17:59:59
      return { startHour: 12, endHour: 17, endMin: 59, endSec: 59 };
    case 'evening':
      // 18:00 -> 21:59:59
      return { startHour: 18, endHour: 21, endMin: 59, endSec: 59 };
    case 'late-night':
      // 22:00 -> 23:59:59 (if you want to cross midnight, you'd need more complex logic)
      return { startHour: 22, endHour: 23, endMin: 59, endSec: 59 };
    default:
      // "Any time" => entire day
      return { startHour: 0, endHour: 23, endMin: 59, endSec: 59 };
  }
}

/**
 * Make a "YYYY-MM-DDTHH:mm:ssZ" string by combining a date with specific hours/mins/secs.
 */
function makeIso8601Z(dateString, hour, minute, second) {
  // Parse the day at midnight
  const dateObj = new Date(`${dateString}T00:00:00`);
  if (isNaN(dateObj.getTime())) return undefined;

  // Set the local hours/mins/secs
  dateObj.setHours(hour, minute, second, 0);

  // Convert to UTC string (Ticketmaster expects the 'Z' indicating UTC)
  return dateObj.toISOString(); // e.g. "2025-04-12T18:00:00.000Z"
}

module.exports = { getEvents };