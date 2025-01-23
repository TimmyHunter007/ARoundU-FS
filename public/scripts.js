let map;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
        zoom: 10,
    });
}

async function updateMap() {
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const radius = document.getElementById('radius').value;

    if (!city || !state) {
        alert('Please enter both city and state!');
        return;
    }

    try {
        // Fetch coordinates for the entered city and state
        const geocodeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${city},${state}&key=YOUR_GOOGLE_MAPS_API_KEY`
        );
        const geocodeData = await geocodeResponse.json();

        if (!geocodeData.results.length) {
            alert('Location not found!');
            return;
        }

        const { lat, lng } = geocodeData.results[0].geometry.location;

        // Update map center
        map.setCenter({ lat, lng });
        map.setZoom(10);

        // Fetch events for the new location
        const eventsResponse = await fetch(
            `/api/events?location=${lat},${lng}&radius=${radius}`
        );
        const eventsData = await eventsResponse.json();

        if (eventsData.events && eventsData.events.length) {
            eventsData.events.forEach((event) => {
                const marker = new google.maps.Marker({
                    position: { lat: event.latitude, lng: event.longitude },
                    map,
                    title: event.name,
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: `<h3>${event.name}</h3><p>${event.description}</p>`,
                });

                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });
            });
        } else {
            alert('No events found in this area!');
        }
    } catch (error) {
        console.error('Error updating map:', error);
        alert('Failed to update the map. Please try again later.');
    }
}
