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
        userLat = position.coords.latitude;
        userLng = position.coords.longitude;

        const defaultCenter = { lat: userLat, lng: userLng };

        map = new google.maps.Map(document.getElementById("map"), {
            center: defaultCenter,
            zoom: 10,
            mapId: "5c290e9e653ba24a",
        });

        fetchEvents(userLat, userLng, 10, {});

        document.getElementById("searchBtn").addEventListener("click", () => {
            let radius = parseFloat(document.getElementById("radius").value) || 10;
            radius = Math.max(0, Math.min(radius, 300));

            let rawDate = document.getElementById("single-date")?.value.trim() || "";
            const startTime = document.getElementById("startTime")?.value || "";
            const endTime = document.getElementById("startTime")?.value || "";
            const eventType = document.getElementById("event-type")?.value || "";

            fetchEvents(userLat, userLng, radius, {
                startDateTime: rawDate,
                endDateTime: rawDate,
                startTime,
                endTime,
                eventType,
            });
        });
    });
}

function formatDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) {
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

function fetchEvents(latitude, longitude, radius, filters = {}) {
    const eventsContainer = document.getElementById("events-container");
    eventsContainer.innerHTML = "";

    markers.forEach((m) => m.map = null);
    markers = [];

    // Build the query string
    let url = `/api/events?location=${latitude},${longitude}&radius=${radius}`;
    if (filters.startDateTime) {
        let ScombinedDateTime = `${filters.startDateTime}`;
        if (filters.startTime) {
            ScombinedDateTime += `${filters.startTime}`;
        }
        url += `&startDateTime=${ScombinedDateTime}`;
    }
    /*
    if (filters.endDateTime) {
        let EcombinedDateTime = `${filters.endDateTime}`;
        if (filters.startTime) {
            EcombinedDateTime += `${filters.startTime}`;
        }
        url += `&endDateTime=${ScombinedDateTime}T23:59:59Z`;
    }
    */
    url += `&endDateTime=${filters.endDateTime}T23:59:59Z`;
    if (filters.eventType) {
        url += `&eventType=${filters.eventType}`;
    }

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            if (data.events && Array.isArray(data.events) && data.events.length > 0) {
                const bounds = new google.maps.LatLngBounds();

                data.events.forEach((event) => {
                    const position = new google.maps.LatLng(event.latitude, event.longitude);

                    const marker = new google.maps.marker.AdvancedMarkerElement({
                        position: position,
                        map: map,
                        title: event.name,
                    });

                    markers.push(marker);
                    bounds.extend(position);

                    const eventCard = document.createElement("div");
                    eventCard.className = "card";

                    const cardContent = document.createElement("div");
                    cardContent.className = "card-content";
                    cardContent.innerHTML = `
                        <h3>${event.name}</h3>
                        <hr>
                        <h4>Time of Event: ${formatDateTime(event.date, event.time)}</h4>
                        <p>${event.description}</p>
                        <p>Postal Code of Event: ${event.postalcode}</p>
                    `;

                    const readMoreButton = document.createElement("button");
                    readMoreButton.className = "read-more-btn";
                    readMoreButton.innerText = "Read More";
                    readMoreButton.addEventListener("click", () => openModal(event));

                    eventCard.appendChild(cardContent);
                    eventCard.appendChild(readMoreButton);
                    eventsContainer.appendChild(eventCard);
                });

                map.fitBounds(bounds);
            } else {
                eventsContainer.innerHTML = "<p>No events found in the selected area.</p>";
            }
        })
        .catch((error) => {
            console.error("Error fetching events:", error);
            alert("Unable to fetch events. Please try again.");
        });
}

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

updateDateTime();

function openModal(event) {
    const modal = document.getElementById("event-modal");
    const modalDetails = document.getElementById("modal-details");
    modalDetails.innerHTML = `
        <h2>${event.name}</h2>
        <p>${formatDateTime(event.date, event.time)}</p>
        <p>${event.description}</p>
        <p>${event.postalcode}</p>
    `;
    modal.style.display = "block";

    const closeModalBtn = document.querySelector(".close-btn");
    closeModalBtn.onclick = function() {
        modal.style.display = "none";
    };

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
}
