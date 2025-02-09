let map;
let userLat;
let userLng;

// We'll store active markers in this array to clear them when we refetch
let markers = [];

/**
 * Initialize the Google Map, get user location, and set up event listeners.
 */
function initMap() {
  navigator.geolocation.getCurrentPosition((position) => {
    // Store user coordinates in global vars so we can re-use them
    userLat = position.coords.latitude;
    userLng = position.coords.longitude;

    const defaultCenter = { lat: userLat, lng: userLng };
    map = new google.maps.Map(document.getElementById("map"), {
      center: defaultCenter,
      zoom: 10,
    });

    // Fetch events for the default location with no filters (radius=10)
    fetchEvents(userLat, userLng, 10, {});

    // When user clicks "Search"
    document.getElementById("searchBtn").addEventListener("click", () => {
      let radius = parseFloat(document.getElementById("radius").value) || 10;
      if (radius < 0) radius = 0;
      if (radius > 200) radius = 200; // to avoid 400 errors from Ticketmaster

      let singleDate = document.getElementById("single-date")?.value.trim() || "";
      const eventType = document.getElementById("event-type")?.value || "";
      const timeOfDay = document.getElementById("time-of-day")?.value || "";

      fetchEvents(userLat, userLng, radius, {
        singleDate,
        eventType,
        timeOfDay,
      });
    });
  });
}

/**
 * Convert the Ticketmaster date/time strings (e.g. "2025-04-12", "18:00:00")
 * into a user-friendly format ("April 12, 2025, 6:00 PM").
 */
function formatDateTime(dateStr, timeStr) {
  if (
    !dateStr ||
    dateStr === "Date not available" ||
    !timeStr ||
    timeStr === "Time not available"
  ) {
    return "Date/Time not available";
  }

  const dateObj = new Date(`${dateStr}T${timeStr}`);
  if (isNaN(dateObj.getTime())) {
    return "Date/Time not available";
  }

  return dateObj.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Fetches events from our server (/api/events) with optional filters,
 * then displays them on the map and in event cards.
 */
function fetchEvents(latitude, longitude, radius, filters = {}) {
  const eventsContainer = document.getElementById("events-container");
  eventsContainer.innerHTML = ""; // Clear any existing events

  // Clear old markers from the map
  markers.forEach((m) => m.setMap(null));
  markers = [];

  // Build the query string
  let url = `/api/events?location=${latitude},${longitude}&radius=${radius}`;
  if (filters.singleDate) url += `&singleDate=${filters.singleDate}`;
  if (filters.eventType)  url += `&eventType=${filters.eventType}`;
  if (filters.timeOfDay)  url += `&timeOfDay=${filters.timeOfDay}`;

  fetch(url)
    .then((res) => {
      if (!res.ok) {
        // If server responded with 400/500, throw an error
        throw new Error(`${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .then((data) => {
      if (data.events && data.events.length > 0) {
        const bounds = new google.maps.LatLngBounds();

        data.events.forEach((event) => {
          // Create a marker
          const marker = new google.maps.Marker({
            position: { lat: event.latitude, lng: event.longitude },
            map,
            title: event.name,
          });
          markers.push(marker);
          bounds.extend(marker.getPosition());

          // Info window for each marker
          const infoWindow = new google.maps.InfoWindow({
            content: `<h3>${event.name}</h3><p>${event.description}</p>`,
          });
          marker.addListener("click", () => infoWindow.open(map, marker));

          // Build the event card
          const eventCard = document.createElement("div");
          eventCard.className = "card";

          const formattedDateTime = formatDateTime(event.date, event.time);
          eventCard.innerHTML = `
            <h3>${event.name}</h3>
            <hr>
            <h4>${formattedDateTime}</h4>
            <p>${event.description}</p>
          `;
          eventsContainer.appendChild(eventCard);
        });

        // Fit map to show all markers
        map.fitBounds(bounds);
      } else {
        alert("No events found!");
        eventsContainer.innerHTML = "<p>No events found in the selected area.</p>";
      }
    })
    .catch((error) => {
      console.error("Error fetching events:", error);
      alert("Unable to fetch events at the moment. Please try again later.");
    });
}

function updateDateTime() {
  if (!navigator.geolocation) {
    document.getElementById("current-time").innerText =
      "Geolocation not supported.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${timestamp}&key=AIzaSyDJRa9QY6RF9ooPsZ1OpVNmMO6enp4mnqA`
        );
        const data = await response.json();
        if (data.status === "OK") {
          const options = {
            timeZone: data.timeZoneId,
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          };
          const dateFormatter = new Intl.DateTimeFormat("en-US", options);
          document.getElementById("current-time").innerText = dateFormatter.format(
            new Date()
          );
        } else {
          document.getElementById("current-time").innerText =
            "Unable to fetch time zone.";
        }
      } catch (err) {
        console.error("Error fetching time zone:", err);
        document.getElementById("current-time").innerText =
          "Unable to fetch time zone.";
      }
    },
    (error) => {
      console.error("Error getting location:", error.message);
      document.getElementById("current-time").innerText =
        "Location error: can't fetch time.";
    }
  );
}

// Call updateDateTime if you want the time to show on load
updateDateTime();