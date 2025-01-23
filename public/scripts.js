let map;

function initMap() 
{
    navigator.geolocation.getCurrentPosition((position) => 
    {
        const { latitude, longitude } = position.coords;

        map = new google.maps.Map(document.getElementById('map'), 
        {
            center: { lat: latitude, lng: longitude },
            zoom: 10,
        });

        fetch(`/api/events?location=${latitude},${longitude}`)
        .then((response) => response.json())
        .then((data) => 
        {
            data.events.forEach((event) => 
            {
                const marker = new google.maps.Marker(
                {
                    position: { lat: event.latitude, lng: event.longitude },
                    map,
                    title: event.name.text,
                });

                const infoWindow = new google.maps.InfoWindow(
                {
                    content: `<h3>${event.name.text}</h3><p>${event.description.text}</p>`,
                });

                marker.addListener('click', () => 
                {
                    infoWindow.open(map, marker);
                });
            });
        });
    });
}
