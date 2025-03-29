const bcrypt = require('bcryptjs'); // Import bcrypt for password hashing.
const jwt = require('jsonwebtoken'); // Import jsonwebtoken for JWT operations.
const User = require('../models/User'); // Import the User model.

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key'; // JWT secret key from environment or fallback.

// ---------------------- REGISTER ----------------------
exports.register = async (req, res) => {
    try {
        // Destructure required fields from the request body.
        const { firstName, lastName, email, password, confirmPassword, dateOfBirth } = req.body;

        // Validate that all required fields are provided.
        if (!firstName || !lastName || !email || !password || !confirmPassword || !dateOfBirth) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Check if the password and confirmPassword match.
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match.' });
        }

        // Check if a user with the given email already exists.
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered.' });
        }

        // Hash the password using bcrypt.
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new user document in the database.
        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            dateOfBirth,
        });

        // Respond with success message and the newly created user's basic info.
        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                _id: newUser._id,
                email: newUser.email,
            },
        });
    } catch (error) {
        console.error('Register Error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

// ---------------------- LOGIN ----------------------
exports.login = async (req, res) => {
    try {
        // Extract email and password from the request body.
        const { email, password } = req.body;

        // Validate that both email and password are provided.
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find the user by email.
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Compare provided password with the stored hashed password.
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Generate a JWT for the authenticated user.
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
            expiresIn: '1d', // Token expires in 1 day.
        });

        // Respond with the token and basic user information.
        return res.json({
            token,
            user: {
                _id: user._id,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

// ---------------------- GET PROFILE ----------------------
exports.getProfile = async (req, res) => {
    try {
        // Retrieve the user's profile using the userId set by authentication middleware.
        const user = await User.findById(req.userId).select('-password'); // Exclude password from the result.
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        // Respond with the user profile data.
        return res.json(user);
    } catch (error) {
        console.error('Get Profile Error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

// ---------------------- UPDATE PROFILE ----------------------
exports.updateProfile = async (req, res) => {
    try {
        // Destructure fields to update from the request body.
        const { firstName, lastName, dateOfBirth, password } = req.body;

        // Find the user by their ID.
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Update the user's fields if they are provided.
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;

        // If a new password is provided, hash it and update the user's password.
        if (password) {
            const saltRounds = 10;
            user.password = await bcrypt.hash(password, saltRounds);
        }

        // Save the updated user document.
        await user.save();

        // Retrieve the updated user information (excluding the password) and respond.
        const updatedUser = await User.findById(req.userId).select('-password');
        return res.json({
            message: 'Profile updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

// ---------------------- SAVE EVENTS ----------------------
exports.saveEvent = async (req, res) => {
    try {
        // Expecting the event object to be sent from the frontend
        const { event } = req.body;
        if (!event || !event.id) {
            return res.status(400).json({ error: 'Invalid event data' });
        }

        // Find the user using req.userId (set by your auth middleware)
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the event is already saved to prevent duplicates
        if (user.savedEvents.some(e => e.eventId === event.id)) {
            return res.status(400).json({ error: 'Event already saved' });
        }

        user.savedEvents.push({
            eventId: event.id,
            name: event.name,
            date: event.date,
            time: event.time,
            description: event.description,
            address: event.address,
            city: event.city,
            stateCode: event.stateCode,
            postalcode: event.postalcode,
            tmurl: event.tmurl,
            venuename: event.venuename,
        });

        await user.save();

        return res.json({
            message: 'Event saved successfully',
            savedEvents: user.savedEvents,
        });
    } catch (error) {
        console.error('Save Event Error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
    };

// ---------------------- SAVE EVENTS ----------------------
    exports.removeEvent = async (req, res) => {
        const userId = req.user.id; // Extract user ID from the authenticated request
        const { eventId } = req.body; // Extract event ID from the request body
    
        if (!eventId) {
            return res.status(400).json({ error: 'Event ID is required.' });
        }
    
        try {
            // Remove the event from the user's saved events
            const user = await User.findByIdAndUpdate(
                userId,
                { $pull: { savedEvents: { id: eventId } } }, // Remove the event with the matching ID
                { new: true } // Return the updated user document
            );
    
            if (!user) {
                return res.status(404).json({ error: 'User not found.' });
            }
    
            res.json({ message: 'Event removed successfully.', savedEvents: user.savedEvents });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to remove event.' });
        }
    };