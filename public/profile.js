// Wait until the entire DOM content has loaded before executing the code.
document.addEventListener('DOMContentLoaded', () => {
    // Retrieve the token from local storage.
    const token = localStorage.getItem('token');
    if (!token) {
        // If no token is found, redirect the user to the home page to log in.
        window.location.href = 'index.html';
        return;
    }

    // If a token exists, fetch and display the user's profile details.
    fetchProfile(token);

    // Add an event listener to handle profile form submission for updating profile details.
    document.getElementById('profileForm').addEventListener('submit', updateProfile);

    // Add an event listener to the "Home" button to redirect to the home page.
    document.getElementById('homeBtn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // Add an event listener to the "Logout" button to remove the token and redirect to the home page.
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
});

/**
 * Fetch profile details using the provided token and display them on the page.
 */
function fetchProfile(token) {
    fetch('/api/auth/profile', {
        method: 'GET',
        headers: {
            // Send the token as a Bearer token in the Authorization header.
            Authorization: `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            // If an error occurs (e.g., token expired), alert the user and redirect to home.
            alert(data.error);
            window.location.href = 'index.html';
            return;
        }
        // Display profile details in a read-only format.
        displayProfileDetails(data);

        // Populate the profile form fields with the fetched data.
        document.getElementById('firstName').value = data.firstName;
        document.getElementById('lastName').value = data.lastName;
        document.getElementById('email').value = data.email;

        // Format the date of birth into YYYY-MM-DD format for the date input.
        const dob = new Date(data.dateOfBirth);
        const month = String(dob.getMonth() + 1).padStart(2, '0');
        const day = String(dob.getDate()).padStart(2, '0');
        const year = dob.getFullYear();
        document.getElementById('dateOfBirth').value = `${year}-${month}-${day}`;
    })
    .catch(err => {
        // Log any error and alert the user if profile fetching fails.
        console.error(err);
        alert('Error fetching profile');
    });
}

/**
 * Display profile details in the "Your Profile Details" area.
 */
function displayProfileDetails(user) {
    const detailsDiv = document.getElementById('profile-details');
    // Create HTML content for profile details.
    detailsDiv.innerHTML = `
        <p><strong>First Name:</strong> ${user.firstName}</p>
        <p><strong>Last Name:</strong> ${user.lastName}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Date of Birth:</strong> ${new Date(user.dateOfBirth).toLocaleDateString()}</p>
    `;
}

/**
 * Handle updating the user profile when the profile form is submitted.
 */
function updateProfile(e) {
    // Prevent the default form submission behavior.
    e.preventDefault();
    // Retrieve the token from local storage.
    const token = localStorage.getItem('token');
    if (!token) return;

    // Get the updated input values from the form fields.
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const dateOfBirth = document.getElementById('dateOfBirth').value;
    const password = document.getElementById('password').value.trim();

    // Build the updated data object with the profile details.
    const updatedData = { firstName, lastName, dateOfBirth };
    // If a new password is provided, include it in the update.
    if (password) {
        updatedData.password = password;
    }

    // Send a PUT request to update the profile.
    fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            // Include the token in the Authorization header.
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
    })
    .then(res => res.json())
    .then(result => {
        if (result.error) {
            // Alert the user if an error occurred during the update.
            alert(result.error);
        } else {
            // Notify the user that the profile was updated successfully.
            alert(result.message || 'Profile updated!');
            // Refresh the displayed profile details with updated data.
            displayProfileDetails(result.user);
            // Clear the password field after update.
            document.getElementById('password').value = '';
        }
    })
    .catch(err => {
        // Log any errors and alert the user if the update fails.
        console.error(err);
        alert('Error updating profile');
    });
}
