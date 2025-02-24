const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// e.g., JWT_SECRET="someSuperSecretKey"
const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';

// ---------------------- REGISTER ----------------------
exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword, dateOfBirth } = req.body;

        // 1. Check if all fields are present
        if (!firstName || !lastName || !email || !password || !confirmPassword || !dateOfBirth) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // 2. Check if password and confirmPassword match
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match.' });
        }

        // 3. Check if user with this email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered.' });
        }

        // 4. Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 5. Create user
        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            dateOfBirth,
        });

        // 6. Return success (optionally create a token and log them in)
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
        const { email, password } = req.body;

        // 1. Check for fields
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // 2. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // 3. Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // 4. Generate JWT
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
            expiresIn: '1d', // e.g., 1 day
        });

        // 5. Return token
        return res.json({
            message: 'Logged in successfully',
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
        // By the time we get here, req.userId should be set by middleware
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        return res.json(user);
        } catch (error) {
            console.error('Get Profile Error:', error);
            return res.status(500).json({ error: 'Server error' });
    }
};

// ---------------------- UPDATE PROFILE ----------------------
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, dateOfBirth, password } = req.body;

        // Find user
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Update fields if provided
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;

        // If user wants to update password
        if (password) {
            const saltRounds = 10;
            user.password = await bcrypt.hash(password, saltRounds);
        }

        await user.save();

        // Return updated info (excluding password)
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
