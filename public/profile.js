// Wait until the DOM content has loaded before executing the code.
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check login status to show/hide the correct dropdown.
    checkUserStatus();

    // 2. If a token exists, fetch the user profile.
    const token = localStorage.getItem('token');
    if (!token) {
        // If no token, user is definitely not logged in, so do not fetch profile.
        return;
    }
    fetchProfile(token);

    // 3. Profile form submission for updating user details.
    document.getElementById('profileForm').addEventListener('submit', updateProfile);

    // 4. Home & Logout inside the "Profile" dropdown.
    setupHomeAndLogoutDropdown();
});

/**
 * Checks the user's login status by looking for a token and verifying with /api/auth/profile.
 */
function checkUserStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        // No token => show "Account" dropdown
        showLoginSignupDropdown();
        return;
    }

    // If token exists, verify it by fetching the user's profile.
    fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            // Token invalid => show "Account" dropdown
            showLoginSignupDropdown();
        } else {
            // Valid => show "Profile" dropdown
            showProfileDropdown(data.firstName);
        }
    })
    .catch(err => {
        console.error(err);
        showLoginSignupDropdown();
    });
}

/** Show the "authDropdown" for not-logged-in users */
function showLoginSignupDropdown() {
    document.getElementById('authDropdown').style.display = 'inline-block';
    document.getElementById('profileDropdown').style.display = 'none';
}

/** Show the "profileDropdown" for logged-in users and set welcome name */
function showProfileDropdown(firstName) {
    document.getElementById('authDropdown').style.display = 'none';
    document.getElementById('profileDropdown').style.display = 'inline-block';
    document.getElementById('welcomeName').textContent = firstName;
}

/**
 * Fetches the user profile details if a valid token exists.
 */
function fetchProfile(token) {
    fetch('/api/auth/profile', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            // If token invalid, go back to home (or show "Account" dropdown).
            alert(data.error);
            window.location.href = 'index.html';
            return;
        }
        // Display the profile details in read-only format
        displayProfileDetails(data);
        // Populate form fields
        document.getElementById('firstName').value = data.firstName;
        document.getElementById('lastName').value = data.lastName;
        document.getElementById('email').value = data.email;
        const dob = new Date(data.dateOfBirth);
        const month = String(dob.getMonth() + 1).padStart(2, '0');
        const day = String(dob.getDate()).padStart(2, '0');
        const year = dob.getFullYear();
        document.getElementById('dateOfBirth').value = `${year}-${month}-${day}`;
    })
    .catch(err => {
        console.error(err);
        alert('Error fetching profile');
    });
}

/**
 * Displays the user's current profile info in the #profile-details div.
 */
function displayProfileDetails(user) {
    const detailsDiv = document.getElementById('profile-details');
    detailsDiv.innerHTML = `
        <p><strong>First Name:</strong> ${user.firstName}</p>
        <p><strong>Last Name:</strong> ${user.lastName}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Date of Birth:</strong> ${new Date(user.dateOfBirth).toLocaleDateString()}</p>
    `;
}

/**
 * Handles the profile update form submission.
 */
function updateProfile(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const dateOfBirth = document.getElementById('dateOfBirth').value;
    const password = document.getElementById('password').value.trim();

    const updatedData = { firstName, lastName, dateOfBirth };
    if (password) {
        updatedData.password = password;
    }

    fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
    })
    .then(res => res.json())
    .then(result => {
        if (result.error) {
            alert(result.error);
        } else {
            alert(result.message || 'Profile updated!');
            // Refresh read-only details
            displayProfileDetails(result.user);
            // Clear password field
            document.getElementById('password').value = '';
        }
    })
    .catch(err => {
        console.error(err);
        alert('Error updating profile');
    });
}

/**
 * Sets up the "Home" and "Logout" buttons inside the Profile dropdown.
 */
function setupHomeAndLogoutDropdown() {
    // "Home" button → go to index.html
    document.getElementById('homeBtnDropdown').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    // "Logout" button → remove token, redirect to home
    document.getElementById('logoutBtnDropdown').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
}

/**
 * Load saved events for the logged-in user.
 */
async function loadSavedEvents() {
    const token = localStorage.getItem('token');
    if (!token) {
        document.getElementById('saved-events').innerHTML = '<p>Please log in to view saved events.</p>';
        return;
    }
    
    try {
        // Assuming you add an endpoint to get the full profile with saved events.
        const response = await fetch('/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const user = await response.json();
        if (user.savedEvents && user.savedEvents.length > 0) {
            const container = document.getElementById('saved-events');
            container.innerHTML = ''; // Clear any existing content.
            user.savedEvents.forEach((event) => {
                // Create event card similar to the ones in events-container.
                const eventCard = document.createElement("div");
                eventCard.className = "event-card-profile";
                eventCard.innerHTML = `
                    <div class="card-content-profile">
                        <h3><a href="${event.tmurl}" target="_blank" class="profile-event-card-a">${event.name}</a></h3>
                        <h4 style="text-align: center;">${formatDateTime(event.date, event.time)}</h4>
                        <hr>
                        <h4>Event Details</h4>
                        <p>${event.description}</p>
                        <h4>Location</h4>
                        <p>${event.venuename}<br>${event.address} ${event.city}, ${event.stateCode} ${event.postalcode}</p>
                        <button class="remove-event-btn" data-event-id="${event.eventId}">Remove</button>
                    </div>
                `;
                container.appendChild(eventCard);
            });

            // Add event listeners to all "Remove" buttons
            const removeButtons = document.querySelectorAll('.remove-event-btn');
            removeButtons.forEach((button) => {
                button.addEventListener('click', async (e) => {
                    const eventId = e.target.getAttribute('data-event-id');
                    await removeSavedEvent(eventId);
                    loadSavedEvents(); // Reload events after removal
                });
            });
        } else {
            document.getElementById('saved-events').innerHTML = '<p>No events saved yet.</p>';
        }
    } catch (err) {
        console.error(err);
        document.getElementById('saved-events').innerHTML = '<p>Error loading saved events.</p>';
    }
}

/**
 * Delete saved events for the logged-in user.
 */

async function removeSavedEvent(eventId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You must be logged in to remove events.');
        return;
    }

    try {
        const response = await fetch(`/api/auth/remove-event`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ eventId })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message || 'Event removed successfully.');
        } else {
            alert(result.error || 'Failed to remove event.');
        }
    } catch (err) {
        console.error(err);
        alert('Error removing event.');
    }
}

// Call this function on page load (for example, at the end of your DOMContentLoaded event)
document.addEventListener('DOMContentLoaded', () => {
    loadSavedEvents();
});
