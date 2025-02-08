let map;
let userLat;
let userLng;

/**
 * Initialize the Google Map, get user location, and set up event listeners.
 */
function initMap() {
    navigator.geolocation.getCurrentPosition((position) => {
        // Store user coordinates in global vars so we can re-use them later
        userLat = position.coords.latitude;
        userLng = position.coords.longitude;

        const defaultCenter = { lat: userLat, lng: userLng };

        map = new google.maps.Map(document.getElementById('map'), {
            center: defaultCenter,
            zoom: 10,
        });

        // Fetch events for the default location with no filters
        fetchEvents(userLat, userLng, 10, {});

        // When the user clicks "Search," use their geolocation + any filters
        document.getElementById('searchBtn').addEventListener('click', () => {
            // Clamp radius to [0, 300]
            let radius = parseFloat(document.getElementById('radius').value) || 10;
            if (radius < 0) radius = 0;
            if (radius > 300) radius = 300;

            // Gather filter options
            const startDate = document.getElementById('start-date')?.value || '';
            const endDate = document.getElementById('end-date')?.value || '';
            const eventType = document.getElementById('event-type')?.value || '';
            const timeOfDay = document.getElementById('time-of-day')?.value || '';

            // Simply call fetchEvents with the user's stored coords
            fetchEvents(userLat, userLng, radius, {
                startDate,
                endDate,
                eventType,
                timeOfDay,
            });
        });
    });
}

/**
 * Fetches events from our server with optional filters, then displays them.
 */
function fetchEvents(latitude, longitude, radius, filters = {}) {
    const eventsContainer = document.getElementById('events-container');
    eventsContainer.innerHTML = ''; // Clear any existing events

    // Build the query string
    let url = `/api/events?location=${latitude},${longitude}&radius=${radius}`;
    if (filters.startDate)  url += `&startDate=${filters.startDate}`;
    if (filters.endDate)    url += `&endDate=${filters.endDate}`;
    if (filters.eventType)  url += `&eventType=${filters.eventType}`;
    if (filters.timeOfDay)  url += `&timeOfDay=${filters.timeOfDay}`;

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            if (data.events && data.events.length > 0) {
                data.events.forEach((event) => {
                    // Create marker
                    const marker = new google.maps.Marker({
                        position: { lat: event.latitude, lng: event.longitude },
                        map,
                        title: event.name,
                    });

                    // Info Window
                    const infoWindow = new google.maps.InfoWindow({
                        content: `<h3>${event.name}</h3><p>${event.description}</p>`,
                    });

                    marker.addListener('click', () => {
                        infoWindow.open(map, marker);
                    });

                    // Build card
                    const eventCard = document.createElement('div');
                    eventCard.className = "card";

                    //const eventDate = event.date || "Date not available";
                    //const eventTime = event.time || "Time not available";
                    //<h4>${eventDate} ${eventTime}</h4>
                    const formattedDateTime = formateDateTime(event.date, event.time);

                    eventCard.innerHTML = `
                        <h3>${event.name}</h3>
                        <hr>
                        <h4>${formattedDateTime}</h4>
                        <p>${event.description}</p>
                    `;

                    eventsContainer.appendChild(eventCard);
                });
            } else {
                alert('No events found!');
                eventsContainer.innerHTML = "<p>No events found in the selected area.</p>";
            }
        })
        .catch((error) => {
            console.error('Error fetching events:', error);
            alert('Unable to fetch events at the moment. Please try again later.');
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
                        document.getElementById("current-time").innerText = dateFormatter.format(new Date());
                    } else {
                        document.getElementById("current-time").innerText = "Unable to fetch time zone.";
                    }
                } catch (error) {
                    console.error("Error fetching time zone information:", error);
                    document.getElementById("current-time").innerText = "Unable to fetch time zone.";
                }
            },
            (error) => {
                console.error("Error getting location:", error.message);
                document.getElementById("current-time").innerText = "Location error: can't fetch time.";
            }
        );
    } else {
        document.getElementById("current-time").innerText = "Geolocation not supported.";
    }
}

// Call updateDateTime if you want the time to show on load
updateDateTime();
