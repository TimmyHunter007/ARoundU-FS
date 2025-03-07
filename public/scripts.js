// Global variables for storing the map instance, user coordinates, and markers.
let map; // Holds the Google Map instance.
let userLat; // Stores the user's latitude.
let userLng; // Stores the user's longitude.

// Array to store all active markers on the map.
let markers = []; // Will contain all marker objects currently displayed on the map.

/**
 * Initializes the Google Map, gets the user's location, and sets up event listeners.
 */
function initMap() {
    // Get the user's current position using the Geolocation API.
    navigator.geolocation.getCurrentPosition((position) => {
        // Store the user's latitude and longitude from the position object.
        userLat = position.coords.latitude;
        userLng = position.coords.longitude;

        // Create a coordinate object for the map's center.
        const defaultCenter = { lat: userLat, lng: userLng };

        // Instantiate the Google Map centered on the user's current location.
        map = new google.maps.Map(document.getElementById("map"), {
            center: defaultCenter,
            zoom: 10, // Default zoom level.
            mapId: "5c290e9e653ba24a", // Identifier for a custom styled map.
        });

        // Initially fetch events within a 10-mile radius using the user's location.
        fetchEvents(userLat, userLng, 10, {});

        // Set up event listener for the search button to apply custom filters.
        document.getElementById("searchBtn").addEventListener("click", () => {
            // Parse the search radius, defaulting to 10 if input is invalid.
            let radius = parseFloat(document.getElementById("radius").value) || 10;
            // Ensure the radius is between 0 and 300.
            radius = Math.max(0, Math.min(radius, 300));

            // Retrieve date and time filter inputs.
            const rawStartDate = document.getElementById("single-date")?.value.trim() || "";
            const startTime = document.getElementById("startTime")?.value || "";
            // Use the start date as default end date if not provided.
            const rawEndDate = document.getElementById("end-date")?.value.trim() || rawStartDate;
            // Default end time is set to the last second of the day.
            const endTime = document.getElementById("endTime")?.value || "23:59:59";

            // Retrieve the event type filter from the input.
            const eventType = document.getElementById("event-type")?.value || "";

            // Call fetchEvents with all the provided filters.
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
 * Checks the user's login status by looking for a token in local storage and fetching the user profile.
 * Displays the appropriate header buttons based on login status.
 */
function checkUserStatus() {
    const token = localStorage.getItem('token'); // Retrieve token from local storage.
    if (token) {
        // If token exists, verify it by fetching the user's profile.
        fetch('/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                // If token is invalid or expired, show login/signup buttons.
                showLoginSignupButtons();
            } else {
                // If token is valid, show a welcome message with the user's first name.
                showWelcomeUser(data.firstName);
            }
        })
        .catch(err => {
            console.error(err);
            // On error, fallback to showing the login/signup buttons.
            showLoginSignupButtons();
        });
    } else {
        // If no token is found, display the login/signup buttons.
        showLoginSignupButtons();
    }
}

/**
 * Displays "Sign Up" and "Log In" buttons and hides the welcome message container.
 */
function showLoginSignupButtons() {
    document.getElementById('openSignupBtn').style.display = 'inline-block';
    document.getElementById('openLoginBtn').style.display = 'inline-block';
    document.getElementById('welcomeContainer').style.display = 'none';
}

/**
 * Displays a welcome message with the user's first name and hides the login/signup buttons.
 */
function showWelcomeUser(firstName) {
    document.getElementById('openSignupBtn').style.display = 'none';
    document.getElementById('openLoginBtn').style.display = 'none';
    document.getElementById('welcomeContainer').style.display = 'inline-block';
    document.getElementById('welcomeName').textContent = firstName;
}

/**
 * Sets up the sign-up modal by adding event listeners to open and close the modal.
 */
function setupSignupModal() {
    const openBtn = document.getElementById('openSignupBtn');
    const signupModal = document.getElementById('signup-modal');
    const closeSignupBtn = document.querySelector('.close-signup-btn');

    // Open the sign-up modal when the button is clicked.
    openBtn.addEventListener('click', () => {
        signupModal.style.display = 'block';
    });

    // Close the modal when the close button is clicked.
    closeSignupBtn.addEventListener('click', () => {
        signupModal.style.display = 'none';
    });

    // Close the modal if the user clicks outside of it.
    window.addEventListener('click', (event) => {
        if (event.target === signupModal) {
            signupModal.style.display = 'none';
        }
    });
}

/**
 * Sets up the sign-up form by listening for the submit event and sending registration data to the server.
 */
function setupSignupForm() {
    const form = document.getElementById('signupForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the default form submission behavior.
        const formData = new FormData(form);

        // Gather user input from the form.
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            dateOfBirth: formData.get('dateOfBirth'),
        };

        try {
            // Post the registration data to the API endpoint.
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (!response.ok) {
                // If there's an error, alert the user.
                alert(result.error || 'Error registering');
            } else {
                // On successful registration, notify the user and close the modal.
                alert('User registered successfully!');
                document.getElementById('signup-modal').style.display = 'none';
            }
        } catch (err) {
            console.error(err);
            alert('Server error');
        }
    });
}

/**
 * Sets up the login modal by adding event listeners to open and close the modal.
 */
function setupLoginModal() {
    const openLoginBtn = document.getElementById('openLoginBtn');
    const loginModal = document.getElementById('login-modal');
    const closeLoginBtn = document.querySelector('.close-login-btn');
  
    // Open the login modal when the button is clicked.
    openLoginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
    });
  
    // Close the modal when the close button is clicked.
    closeLoginBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });
  
    // Close the modal if the user clicks outside the modal area.
    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });
}
  
/**
 * Sets up the login form to handle user login.
 */
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent form from submitting normally.
        const formData = new FormData(loginForm);

        // Prepare login credentials.
        const data = {
            email: formData.get('email'),
            password: formData.get('password'),
        };

        try {
            // Send login credentials to the login API endpoint.
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (!response.ok) {
                // Alert the user if login fails.
                alert(result.error || 'Error logging in');
            } else {
                // Notify user of successful login.
                alert('Login successful!');
                // Save token to local storage if provided.
                if (result.token) {
                    localStorage.setItem('token', result.token);
                }
                // Close the login modal.
                document.getElementById('login-modal').style.display = 'none';
                // Redirect the user to the profile page.
                window.location.href = '/profile.html';
            }
        } catch (err) {
            console.error(err);
            alert('Server error');
        }
    });
}

/**
 * Sets up logout and profile button functionality on the index page.
 * Removes token on logout and redirects to appropriate pages.
 */
function setupLogoutFromIndex() {
    const logoutBtn = document.getElementById('logoutBtnIndex');
    const profileBtn = document.getElementById('profileBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Remove the stored token to log out the user.
            localStorage.removeItem('token');
            // Redirect back to the index page.
            window.location.href = 'index.html';
        });
    }
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            // Redirect to the user's profile page.
            window.location.href = 'profile.html';
        });
    }
}

// Wait for the document to load before running setup functions.
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check user's login status to show/hide header buttons.
    checkUserStatus();

    // 2. Initialize modals and forms for signup and login.
    setupSignupModal();
    setupSignupForm();
    setupLoginModal();
    setupLoginForm();

    // 3. Set up logout and profile button functionality.
    setupLogoutFromIndex();

    // 4. Update and display the current date/time based on user's time zone.
    updateDateTime();
});

/**
 * Formats a date and time into a human-readable string.
 * If date or time is invalid, returns an error message.
 */
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

/**
 * Fetch events from the server based on location, radius, and optional filters.
 * Updates the map markers and displays event cards.
 */
function fetchEvents(latitude, longitude, radius, filters = {}) {
    const eventsContainer = document.getElementById("events-container");
    eventsContainer.innerHTML = ""; // Clear previous event cards.

    // Remove any existing markers from the map.
    markers.forEach((m) => m.map = null);
    markers = [];

    // Build the base URL for the API request.
    let url = `/api/events?location=${latitude},${longitude}&radius=${radius}&sort=date,asc`;

    // If date filters are provided, format and append them to the URL.
    if (filters.startDate && filters.endDate) {
        const startISO = buildIsoDateTime(filters.startDate, filters.startTime || "00:00:00");
        const endISO = buildIsoDateTime(filters.endDate, filters.endTime || "23:59:59");
        url += `&localStartDateTime=${startISO},${endISO}`;
    }

    // Append event type filter if provided.
    if (filters.eventType) {
        url += `&eventType=${filters.eventType}`;
    }

    // Fetch events from the API.
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
          if (data.events && Array.isArray(data.events) && data.events.length > 0) {
              const bounds = new google.maps.LatLngBounds();
              data.events.forEach((event) => {
                  // Create a new marker for each event.
                  const position = new google.maps.LatLng(event.latitude, event.longitude);
                  const marker = new google.maps.marker.AdvancedMarkerElement({
                      position,
                      map,
                      title: event.name,
                  });
                  markers.push(marker);
                  // Extend map bounds to include the marker's position.
                  bounds.extend(position);

                  // Create a card element to display event details.
                  const eventCard = document.createElement("div");
                  eventCard.className = "card";

                  // Set up the content of the event card.
                  const cardContent = document.createElement("div");
                  cardContent.className = "card-content";
                  cardContent.innerHTML = `
                      <h3>${event.name}</h3>
                      <hr>
                      <h4>Time of Event: ${formatDateTime(event.date, event.time)}</h4>
                      <p>${event.description}</p>
                      <p>Location: ${event.address} ${event.city}, ${event.stateCode} - ${event.postalcode}</p>
                  `;
                  // Create a "Read More" button to open a detailed modal.
                  const readMoreButton = document.createElement("button");
                  readMoreButton.className = "read-more-btn";
                  readMoreButton.innerText = "Read More";
                  readMoreButton.addEventListener("click", () => {
                      openModal(event);
                  });

                  // Append the content and button to the event card.
                  eventCard.appendChild(cardContent);
                  eventCard.appendChild(readMoreButton);
                  eventsContainer.appendChild(eventCard);
              });
              // Adjust the map view to include all markers.
              map.fitBounds(bounds);
          } else {
              // Inform the user if no events were found.
              eventsContainer.innerHTML = "<p>No events found in the selected area.</p>";
          }
      })
      .catch((error) => {
          console.error("Error fetching events:", error);
          alert("Unable to fetch events. Please try again.");
      });
}

/**
 * Constructs an ISO-formatted date-time string from separate date and time inputs.
 */
function buildIsoDateTime(dateStr, timeStr) {
    let safeTime = timeStr;
    // If time is in HH:MM format, append seconds.
    if (timeStr && timeStr.match(/^\d{2}:\d{2}$/)) {
        safeTime += ":00";
    }
    // Return the combined date and time in ISO format (with a trailing "Z" for UTC).
    return `${dateStr}T${safeTime}Z`;
}

/**
 * Updates the displayed current date and time using the user's time zone information.
 */
function updateDateTime() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const timestamp = Math.floor(Date.now() / 1000);
                    // Fetch time zone details from the Google Time Zone API.
                    const response = await fetch(
                        `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${timestamp}&key=AIzaSyDJRa9QY6RF9ooPsZ1OpVNmMO6enp4mnqA`
                    );
                    const data = await response.json();
                    if (data.status === "OK") {
                        // Set formatting options based on the retrieved time zone.
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
                        // Display the formatted current date and time.
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

/**
 * Opens a modal window displaying detailed information about a specific event.
 */
function openModal(event) {
    const modal = document.getElementById("event-modal");
    const modalDetails = document.getElementById("modal-details");

    // Populate the modal with event details.
    modalDetails.innerHTML = `
        <h2>${event.name}</h2>
        <h3 style="text-align: center;">${formatDateTime(event.date, event.time)}</h3>
        <a class="ticket-button" href="${event.tmurl}" target="_blank">Buy Ticket</a>
        <hr>
        <h3>Event Details</h3>
        <p>${event.description}</p>
        <h3>Location</h3>
        <p>${event.venuename}<br>${event.address} ${event.city}, ${event.stateCode} ${event.postalcode}</p>
    `;
    
    // Display the modal.
    modal.style.display = "block";

    // Set up the close button functionality.
    const closeModalBtn = document.querySelector(".close-btn");
    closeModalBtn.onclick = function() {
        modal.style.display = "none";
    };

    // Also close the modal if the user clicks outside its content area.
    window.onclick = function(e) {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    };
}
