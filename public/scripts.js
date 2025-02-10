let map;
let userLat;
let userLng;

// We'll store active markers in this array
let markers = [];

/**
 * Initialize the Google Map, get user location, and set up event listeners.
 */
function initMap() {
    navigator.geolocation.getCurrentPosition((position) => {
        // Store user coordinates in global vars so we can re-use them later
        userLat = position.coords.latitude;
        userLng = position.coords.longitude;

        const defaultCenter = { lat: userLat, lng: userLng };

        map = new google.maps.Map(document.getElementById("map"), {
            center: defaultCenter,
            zoom: 10,
        });

        // Fetch events for the default location with no filters
        fetchEvents(userLat, userLng, 10, {});

        // When the user clicks "Search," use their geolocation + any filters
        document.getElementById("searchBtn").addEventListener("click", () => {
            // Clamp radius to [0, 300]
            let radius = parseFloat(document.getElementById("radius").value) || 10;
            if (radius < 0) radius = 0;
            if (radius > 300) radius = 300;

            let rawDate = document.getElementById("single-date")?.value.trim() || "";
            if (rawDate) {
                const parsed = new Date(rawDate);
                if (!isNaN(parsed.getTime())) {
                    const year = parsed.getFullYear();
                    const month = String(parsed.getMonth() + 1).padStart(2, "0");
                    const day = String(parsed.getDate()).padStart(2, "0");
                } else {
                    rawDate = "";
                }
            }

            // Gather filter options
            const eventType = document.getElementById("event-type")?.value || "";
            const timeOfDay = document.getElementById("time-of-day")?.value || "";

            // Fetch events with the user's stored coords + filters
            fetchEvents(userLat, userLng, radius, {
                startDateTime: rawDate,
                endDateTime,
                eventType,
                timeOfDay,
            });
        });
    });
}

/**
 * Convert the Ticketmaster date & time into a friendly string (e.g. "February 16, 2025, 7:00 PM").
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
        month: "long",   // e.g. "February"
        day: "numeric",  // e.g. "16"
        year: "numeric", // e.g. "2025"
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

/**
 * Fetch events from our server with optional filters, then display them.
 */
function fetchEvents(latitude, longitude, radius, filters = {}) {
    const eventsContainer = document.getElementById("events-container");
    eventsContainer.innerHTML = ""; // Clear any existing events

    // 1) Clear old markers from the map
    markers.forEach((m) => m.setMap(null));
    markers = [];

    // Build the query string
    let url = `/api/events?location=${latitude},${longitude}&radius=${radius}`;
    if (filters.startDateTime) {
        let ScombinedDateTime = `${filters.startDateTime}`;
        if (filters.timeOfDay) {
            ScombinedDateTime += `${filters.timeOfDay}`;
        }
        url += `&startDateTime=${ScombinedDateTime}`;
    }
    if (filters.endDateTime) {
        let EcombinedDateTime = `${filters.endDateTime}`;
        if (filters.timeOfDay) {
            EcombinedDateTime += `${filters.timeOfDay}`;
        }
        url += `&endDateTime=${EcombinedDateTime}`;
    }
    if (filters.eventType) url += `&eventType=${filters.eventType}`;

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            console.log("Fetched events data:", data); // Debug log
            if (data.events && data.events.length > 0) {
                const bounds = new google.maps.LatLngBounds();

                data.events.forEach((event) => {
                    const marker = new google.maps.Marker({
                        position: { lat: event.latitude, lng: event.longitude },
                        map,
                        title: event.name,
                    });

                    markers.push(marker);
                    bounds.extend(marker.getPosition());

                    const infoWindow = new google.maps.InfoWindow({
                        content: `<h3>${event.name}</h3><p>${event.description}</p>`,
                    });

                    marker.addListener("click", () => {
                        infoWindow.open(map, marker);
                    });

                    const eventCard = document.createElement("div");
                    eventCard.className = "card";
                    const formattedDateTime = formatDateTime(event.date, event.time);
                    eventCard.innerHTML = `
                        <h3>${event.name}</h3>
                        <hr>
                        <h4>${formattedDateTime}</h4>
                        <p>${event.description}</p>
                        <p>${event.postalcode}</p>
                    `;
                    eventsContainer.appendChild(eventCard);
                });

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

/**
 * Updates the current date and time based on user’s geolocation.
 */
function updateDateTime() {
    if (navigator.geolocation) {
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
                } catch (error) {
                    console.error("Error fetching time zone information:", error);
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
    } else {
        document.getElementById("current-time").innerText =
        "Geolocation not supported.";
    }
}

// Call updateDateTime if you want the time to show on load
updateDateTime();
