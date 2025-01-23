let map;

function initMap() {
    // Default user location
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            initializeMap(latitude, longitude);
        },
        () => {
            // Default location if geolocation fails
            initializeMap(37.7749, -122.4194); // San Francisco
        }
    );
}

function initializeMap(lat, lng) {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat, lng },
        zoom: 10,
    });

    // Initial fetch of events based on default location
    fetchEvents(lat, lng, 10);
}

function fetchEvents(lat, lng, radius) {
    fetch(`/api/events?location=${lat},${lng}&radius=${radius}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.events && data.events.length > 0) {
                data.events.forEach((event) => {
                    const marker = new google.maps.marker.AdvancedMarkerElement({
                        position: { lat: event.latitude, lng: event.longitude },
                        map,
                        title: event.name,
                    });

                    const infoWindow = new google.maps.InfoWindow({
                        content: `<h3>${event.name}</h3><p>${event.description}</p>`,
                    });

                    marker.addEventListener('click', () => {
                        infoWindow.open(map, marker);
                    });
                });
            } else {
                alert('No events found for this location!');
            }
        })
        .catch((error) => {
            console.error('Error fetching events:', error.message);
            alert('Unable to fetch events at the moment. Please try again later.');
        });
}

document.getElementById('searchButton').addEventListener('click', () => {
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value.trim();
    const radius = document.getElementById('radius').value || 10;

    if (city && state) {
        // Use Google Maps Geocoding API to get lat/lng for the city/state
        fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${city},${state}&key=AIzaSyDJRa9QY6RF9ooPsZ1OpVNmMO6enp4mnqA`
        )
            .then((response) => response.json())
            .then((data) => {
                if (data.results && data.results.length > 0) {
                    const location = data.results[0].geometry.location;
                    map.setCenter(location);
                    fetchEvents(location.lat, location.lng, radius);
                } else {
                    alert('Location not found!');
                }
            })
            .catch((error) => {
                console.error('Error fetching location:', error.message);
                alert('Unable to find the location. Please check your input and try again.');
            });
    } else {
        alert('Please enter both city and state.');
    }
});
