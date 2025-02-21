// Global variables for storing the map instance, user coordinates, and markers.
let map;
let userLat;
let userLng;

// Array to store all active markers on the map.
let markers = [];

/**
 * Initializes the Google Map, gets the user's location, and sets up event listeners.
 */
function initMap() {
    // Get the user's current position using the Geolocation API.
    navigator.geolocation.getCurrentPosition((position) => {
        // Store the user's latitude and longitude.
        userLat = position.coords.latitude;
        userLng = position.coords.longitude;

        // Set the default center for the map using the user's coordinates.
        const defaultCenter = { lat: userLat, lng: userLng };

        // Create a new Google Map instance centered at the user's location.
        map = new google.maps.Map(document.getElementById("map"), {
            center: defaultCenter,
            zoom: 10,
            mapId: "5c290e9e653ba24a", // Custom map style identifier.
        });

        // Fetch events within a 10-mile radius of the user's location.
        fetchEvents(userLat, userLng, 10, {});

        // Set up the search button event listener for custom event filtering.
        document.getElementById("searchBtn").addEventListener("click", () => {
            // Retrieve and validate the search radius input (capped between 0 and 300).
            let radius = parseFloat(document.getElementById("radius").value) || 10;
            radius = Math.max(0, Math.min(radius, 300));

            // Get the date and time filters from the respective input fields.
            const rawStartDate = document.getElementById("single-date")?.value.trim() || "";
            const startTime = document.getElementById("startTime")?.value || "";
            const rawEndDate = document.getElementById("end-date")?.value.trim() || rawStartDate;
            const endTime = document.getElementById("endTime")?.value || "23:59:59";

            // Get the event type filter.
            const eventType = document.getElementById("event-type")?.value || "";

            // Fetch events using the provided filters.
            fetchEvents(userLat, userLng, radius, {
                startDate: rawStartDate,
                startTime,
                endDate: rawEndDate,
                endTime,
                eventType
            });
        });
    });
}

/**
 * Formats a date and time string into a human-readable format.
 *
 * @param {string} dateStr - The date string (e.g., "2025-02-16").
 * @param {string} timeStr - The time string (e.g., "14:30:00").
 * @returns {string} A formatted date/time string or a fallback message if invalid.
 */
function formatDateTime(dateStr, timeStr) {
    // If either the date or time is missing, return a default message.
    if (!dateStr || !timeStr) {
        return "Date/Time not available";
    }

    // Create a new Date object from the provided date and time.
    const dateObj = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(dateObj.getTime())) {
        return "Date/Time not available";
    }

    // Return the date in a formatted string using en-US locale.
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
 * Fetches events based on location, radius, and optional filters.
 *
 * @param {number} latitude - The latitude for the event search.
 * @param {number} longitude - The longitude for the event search.
 * @param {number} radius - The search radius.
 * @param {object} filters - Additional filters such as date/time range and event type.
 */
function fetchEvents(latitude, longitude, radius, filters = {}) {
    // Get the container element for displaying event cards.
    const eventsContainer = document.getElementById("events-container");
    // Clear previous events.
    eventsContainer.innerHTML = "";

    // Remove existing markers from the map.
    markers.forEach((m) => m.map = null);
    // Reset the markers array.
    markers = [];

    // Build the base URL for fetching events from the API.
    let url = `/api/events?location=${latitude},${longitude}&radius=${radius}&sort=date,asc`;

    // If date filters are provided, convert them to ISO strings and append to the URL.
    if (filters.startDate && filters.endDate) {
        const startISO = buildIsoDateTime(filters.startDate, filters.startTime || "00:00:00");
        const endISO = buildIsoDateTime(filters.endDate, filters.endTime || "23:59:59");

        url += `&localStartDateTime=${startISO},${endISO}`;
    }

    // Append the event type filter if provided.
    if (filters.eventType) {
        url += `&eventType=${filters.eventType}`;
    }

    // Fetch the events data from the API.
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            // Check if events exist and are returned as an array.
            if (data.events && Array.isArray(data.events) && data.events.length > 0) {
                // Create a bounds object to auto-fit the map to the markers.
                const bounds = new google.maps.LatLngBounds();

                // Loop through each event and process it.
                data.events.forEach((event) => {
                    // Create a LatLng object for the event's location.
                    const position = new google.maps.LatLng(event.latitude, event.longitude);

                    // Create a new marker using the AdvancedMarkerElement API.
                    const marker = new google.maps.marker.AdvancedMarkerElement({
                        position: position,
                        map: map,
                        title: event.name,
                    });

                    // Add the marker to the global markers array.
                    markers.push(marker);
                    // Extend the bounds to include this marker's position.
                    bounds.extend(position);

                    // Create a card element to display event details.
                    const eventCard = document.createElement("div");
                    eventCard.className = "card";

                    // Create a container for the card content.
                    const cardContent = document.createElement("div");
                    cardContent.className = "card-content";
                    cardContent.innerHTML = `
                        <h3>${event.name}</h3>
                        <hr>
                        <h4>Time of Event: ${formatDateTime(event.date, event.time)}</h4>
                        <p>${event.description}</p>
                        <p>Postal Code of Event: ${event.postalcode}</p>
                    `;

                    // Create a "Read More" button to toggle expanded details.
                    const readMoreButton = document.createElement("button");
                    readMoreButton.className = "read-more-btn";
                    readMoreButton.innerText = "Read More";
                    
                    readMoreButton.addEventListener("click", () => {
                        openModal(event);
                    });

                    // Append the content and button to the event card.
                    eventCard.appendChild(cardContent);
                    eventCard.appendChild(readMoreButton);
                    // Append the event card to the container in the DOM.
                    eventsContainer.appendChild(eventCard);
                });

                // Adjust the map view to include all markers.
                map.fitBounds(bounds);
            } else {
                // If no events are found, display an appropriate message.
                eventsContainer.innerHTML = "<p>No events found in the selected area.</p>";
            }
        })
        .catch((error) => {
            // Log errors to the console and alert the user.
            console.error("Error fetching events:", error);
            alert("Unable to fetch events. Please try again.");
        });
}

/**
 * Constructs an ISO-formatted date-time string from separate date and time inputs.
 *
 * @param {string} dateStr - The date string.
 * @param {string} timeStr - The time string.
 * @returns {string} ISO date-time string.
 */
function buildIsoDateTime(dateStr, timeStr) {
    let safeTime = timeStr;
    // If the time is in HH:MM format, append seconds.
    if (timeStr && timeStr.match(/^\d{2}:\d{2}$/)) {
        safeTime += ":00";
    }

    // Return the ISO string (with 'Z' indicating UTC time).
    return `${dateStr}T${safeTime}Z`;
}

/**
 * Updates the displayed current date and time using the user's time zone.
 */
function updateDateTime() {
    // Check if Geolocation is supported.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Get the current timestamp in seconds.
                    const timestamp = Math.floor(Date.now() / 1000);
                    // Fetch time zone information from the Google Maps Time Zone API.
                    const response = await fetch(
                        `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${timestamp}&key=AIzaSyDJRa9QY6RF9ooPsZ1OpVNmMO6enp4mnqA`
                    );
                    const data = await response.json();
                    if (data.status === "OK") {
                        // Define formatting options based on the retrieved time zone.
                        const options = {
                            timeZone: data.timeZoneId,
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                        };
                        // Create a formatter and update the DOM with the current date/time.
                        const dateFormatter = new Intl.DateTimeFormat("en-US", options);
                        document.getElementById("current-time").innerText = dateFormatter.format(new Date());
                    } else {
                        // Display an error message if time zone data is not retrieved.
                        document.getElementById("current-time").innerText = "Unable to fetch time zone.";
                    }
                } catch (error) {
                    // Log and display error if the API request fails.
                    console.error("Error fetching time zone information:", error);
                    document.getElementById("current-time").innerText = "Unable to fetch time zone.";
                }
            },
            (error) => {
                // Handle errors from the Geolocation API.
                console.error("Error getting location:", error.message);
                document.getElementById("current-time").innerText = "Location error: can't fetch time.";
            }
        );
    } else {
        // If Geolocation is not supported, notify the user.
        document.getElementById("current-time").innerText = "Geolocation not supported.";
    }
}

// Update the displayed date and time immediately on load.
updateDateTime();

/**
 * Opens a modal window displaying detailed information about a specific event.
 *
 * @param {object} event - The event data object.
 */
function openModal(event) {
    // Get the modal and modal details container elements.
    const modal = document.getElementById("event-modal");
    const modalDetails = document.getElementById("modal-details");
    
    // Populate the modal with event details.
    modalDetails.innerHTML = `
        <h2>${event.name}</h2>
        <p>${formatDateTime(event.date, event.time)}</p>
        <p>${event.description}</p>
        <p>${event.postalcode}</p>
    `;
    
    // Display the modal.
    modal.style.display = "block";

    // Set up the close button functionality.
    const closeModalBtn = document.querySelector(".close-btn");
    closeModalBtn.onclick = function() {
        modal.style.display = "none";
    };

    // Close the modal if the user clicks outside of it.
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
}
