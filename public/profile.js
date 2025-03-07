document.addEventListener('DOMContentLoaded', () => {
    // Get the JWT token from localStorage (set during login)
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in first.');
      window.location.href = 'index.html'; // Redirect to home or login page
      return;
    }
    
    // Fetch and display profile details on page load.
    fetchProfile(token);
    
    // Set up the form submission to update the profile.
    document.getElementById('profileForm').addEventListener('submit', updateProfile);
  });
  
  /**
   * Fetch and display the user's profile via the protected endpoint.
   */
  function fetchProfile(token) {
    fetch('/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          return;
        }
        // Populate the form fields.
        document.getElementById('firstName').value = data.firstName;
        document.getElementById('lastName').value = data.lastName;
        document.getElementById('email').value = data.email;
        
        // Format date of birth (assuming data.dateOfBirth is an ISO string).
        const dob = new Date(data.dateOfBirth);
        const month = String(dob.getMonth() + 1).padStart(2, '0');
        const day = String(dob.getDate()).padStart(2, '0');
        document.getElementById('dateOfBirth').value = `${dob.getFullYear()}-${month}-${day}`;
        
        // Also display the details in a read-only section
        displayProfileDetails(data);
      })
      .catch(err => {
        console.error(err);
        alert('Error fetching profile.');
      });
  }
  
  /**
   * Display profile details in a read-only area on the page.
   */
  function displayProfileDetails(data) {
    const detailsDiv = document.getElementById('profile-details');
    detailsDiv.innerHTML = `
      <p><strong>First Name:</strong> ${data.firstName}</p>
      <p><strong>Last Name:</strong> ${data.lastName}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Date of Birth:</strong> ${new Date(data.dateOfBirth).toLocaleDateString()}</p>
    `;
  }
  
  /**
   * Handle form submission to update the user profile.
   */
  function updateProfile(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in first.');
      return;
    }
    
    // Gather updated values from the form
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const dateOfBirth = document.getElementById('dateOfBirth').value;
    const password = document.getElementById('password').value.trim();
    
    // Build the data object. Only include password if provided.
    const updatedData = { firstName, lastName, dateOfBirth };
    if (password) {
      updatedData.password = password;
    }
    
    fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedData)
    })
      .then(response => response.json())
      .then(result => {
        if (result.error) {
          alert(result.error);
        } else {
          alert(result.message || 'Profile updated successfully!');
          // Update the displayed details
          displayProfileDetails(result.user);
          // Clear the password field
          document.getElementById('password').value = '';
        }
      })
      .catch(err => {
        console.error(err);
        alert('Error updating profile.');
      });
  }
  