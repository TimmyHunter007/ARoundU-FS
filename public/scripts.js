let map;

function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                map = new google.maps.Map(document.getElementById('map'), {
                    center: { lat: latitude, lng: longitude },
                    zoom: 10,
                });

                fetchEvents(latitude, longitude);
            },
            () => {
                alert('Geolocation failed. Default location will be used.');
                loadDefaultMap();
            }
        );
    } else {
        alert('Geolocation is not supported by this browser.');
        loadDefaultMap();
    }
}

function loadDefaultMap() {
    const defaultLocation = { lat: 37.7749, lng: -122.4194 }; // Example: San Francisco
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 10,
    });
}

function fetchEvents(latitude, longitude) {
    fetch(`/api/events?location=${latitude},${longitude}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            return response.json();
        })
        .then((data) => {
            if (data.events && data.events.length > 0) {
                data.events.forEach((event) => {
                    const marker = new google.maps.Marker({
                        position: { lat: event.latitude, lng: event.longitude },
                        map,
                        title: event.name.text,
                    });

                    const infoWindow = new google.maps.InfoWindow({
                        content: `<h3>${event.name.text}</h3><p>${event.description.text}</p>`,
                    });

                    marker.addListener('click', () => {
                        infoWindow.open(map, marker);
                    });
                });
            } else {
                console.warn('No events found in API response');
            }
        })
        .catch((error) => {
            console.error('Error fetching events:', error.message);
        });
}
