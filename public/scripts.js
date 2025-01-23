let map;

function initMap() {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;

            map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: latitude, lng: longitude },
                zoom: 10,
            });

            fetch(`/api/events?location=${latitude},${longitude}`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch events');
                    }
                    return response.json();
                })
                .then((data) => {
                    console.log('Fetched events data:', data); // Debugging
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
                        alert('No events found near your location.');
                    }
                })
                .catch((error) => {
                    console.error('Error fetching events:', error.message);
                    alert('Unable to fetch events at the moment. Please try again later.');
                });
        },
        (error) => {
            console.error('Geolocation error:', error.message);
            alert('Unable to access your location.');
        }
    );
}
