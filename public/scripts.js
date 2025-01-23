let map;

function initMap() {
    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const defaultCenter = { lat: latitude, lng: longitude };
        map = new google.maps.Map(document.getElementById('map'), {
            center: defaultCenter,
            zoom: 10,
        });

        // Fetch events for the default location
        fetchEvents(defaultCenter.lat, defaultCenter.lng, 10);

        document.getElementById('searchBtn').addEventListener('click', () => {
            const city = document.getElementById('city').value.trim();
            const state = document.getElementById('state').value.trim();
            const radius = document.getElementById('radius').value || 10;

            if (city && state) {
                // Use Google Maps Geocoding API to get coordinates
                const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${city},${state}&key=AIzaSyDJRa9QY6RF9ooPsZ1OpVNmMO6enp4mnqA`;
                fetch(geocodeUrl)
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
                        console.error('Error fetching location:', error);
                        alert('Error fetching location. Please try again.');
                    });
            } else {
                // Use current location if no city/state provided
                fetchEvents(defaultCenter.lat, defaultCenter.lng, radius);
            }
        });
    });
}

function fetchEvents(latitude, longitude, radius) {
    fetch(`/api/events?location=${latitude},${longitude}&radius=${radius}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.events && data.events.length > 0) {
                data.events.forEach((event) => {
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
                alert('No events found!');
            }
        })
        .catch((error) => {
            console.error('Error fetching events:', error);
            alert('Unable to fetch events at the moment. Please try again later.');
        });
}
