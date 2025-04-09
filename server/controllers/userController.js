// backend/controllers/userController.js
const User = require('../models/userModel');

const googleAuthService = require('../services/googleAuthService');
const mongoose = require('mongoose');


exports.signup = async (req, res) => {
    console.log('hit signup');
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const newUser = new User({
            name,
            email,
            password
        });

        const savedUser = await newUser.save(); // Save user and get saved user object

        // Generate Google Auth URL after successful signup, passing the new user's ID
        const googleAuthUrl = googleAuthService.generateAuthUrl(savedUser._id.toString());

        res.status(201).json({ message: 'Signup successful! Redirecting to Google Auth...', googleAuthUrl }); // Include googleAuthUrl in response

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Signup failed', error: error });
    }
};

exports.googleCallback = async (req, res) => {
    console.log('Google callback hit');
    const { code, state } = req.query;

    if (!code || !state) {
        return res.status(400).send('Authorization code and state are required.');
    }

    try {
        const { userId } = JSON.parse(state);
        const tokens = await googleAuthService.getGoogleTokens(code);

        console.log('tokens',tokens);

        console.log('refreshtokens',tokens.refresh_token)
        console.log('googleAccessToken:', tokens.access_token)

        // Store tokens in the user document
        await User.findByIdAndUpdate(userId, {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
        });

        // Redirect user to login page (or dashboard if you have one)
        res.redirect('http://localhost:5173/login'); // Or '/dashboard'

    } catch (error) {
        console.error('Google callback error:', error);
        res.status(500).send('Google authentication failed.');
    }
};



// exports.signup = async (req, res) => {
//     console.log('hit signup')
//     const { name, email, password } = req.body;

//     console.log(name, email, password)

//     if (!name || !email || !password) {
//         return res.status(400).json({ message: 'All fields are required' });
//     }

//     try {
//         // Check if email already exists
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(409).json({ message: 'Email already exists' }); // 409 Conflict
//         }

//         // Create new user
//         const newUser = new User({
//             name,
//             email,
//             password // Storing password in plain text (for simplicity as requested, DO NOT DO IN PRODUCTION)
//         });

//         await newUser.save();

//         res.status(201).json({ message: 'Signup successful!' }); // 201 Created
//     } catch (error) {
//         console.error('Signup error:', error);
//         res.status(500).json({ message: 'Signup failed', error: error });
//     }
// };

exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log('login hit');

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' }); // 401 Unauthorized
        }

        // **Plain text password comparison (INSECURE, for development only)**
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' }); // 401 Unauthorized
        }

        // Login successful
        res.status(200).json({ message: 'Login successful!', userId: user._id }); // 200 OK, send userId
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', error: error });
    }
};


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'name email _id'); // Fetch users, selecting specific fields
    const userList = users.map(user => ({
      id: user._id.toString(), // Format _id as string and use as 'id'
      name: user.name,         // Use user's name
      email: user.email        // Use user's email
    }));
    res.status(200).json(userList); // Send 200 OK with the formatted user list
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users", error: error.message }); // Send 500 error on failure
  }
};

exports.storeFcmDeviceToken = async (req, res) => {
    console.log('hit');
    const { fcmDeviceToken } = req.body; // Still expect fcmDeviceToken in body
    const { email } = req.query;
    console.log(email);
    console.log(fcmDeviceToken) // Expect email in request parameters (URL path)

    if (!email || !fcmDeviceToken) { // Changed validation to check for email instead of userId
        return res.status(400).json({ message: 'User email and FCM device token are required.' });
    }

    try {
        // Find user by email instead of userId
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ message: 'User not found with the provided email.' });
        }

        // Update fcmDeviceToken for the found user
        user.fcmDeviceToken = fcmDeviceToken;
        await user.save(); // Use save() after modifying user document

        res.status(200).json({ message: 'FCM device token saved successfully for email.', email: email }); // Include email in success response
    } catch (error) {
        console.error('Error saving FCM device token for email:', email, error); // Include email in error log
        res.status(500).json({ message: 'Failed to save FCM device token for email.', error: error.message, email: email }); // Include email in error response
    }
};

exports.getUsersDetails = async (req, res) => {
    try {
        const { userIds } = req.body;

        if (!Array.isArray(userIds)) {
            return res.status(400).json({ message: "userIds must be an array in the request body" });
        }

        if (userIds.length === 0) {
            return res.status(200).json(); // Return empty array if no userIds provided
        }

        const users = await User.find({ _id: { $in: userIds } });

        if (!users) {
            return res.status(404).json({ message: "No users found with the provided IDs." });
        }

        const userDetails = users.map(user => ({
            _id: user._id.toString(),
            name: user.name, // Or user.username, adjust based on your User model
            email: user.email,
            // Add any other relevant user details you want to send to the frontend
        }));

        res.status(200).json(userDetails);

    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ message: "Error fetching user details", error: error.message });
    }
};

exports.getUsersDetails = async (req, res) => {
    try {
        const { userIds } = req.body;
        
        console.log('Received UIDs for lookup:', userIds); // Debug log
        
        const users = await User.find(
            { _id: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) } },
            'name _id' // Explicit projection
        );

        console.log('Found users:', users.map(u => u._id)); // Debug log
        
        res.status(200).json(
            users.map(user => ({
                _id: user._id.toString(),
                name: user.name
            }))
        );
    } catch (error) {
        console.error("User detail fetch error:", error);
        res.status(500).json({ 
            message: "Error retrieving participant details",
            error: error.message 
        });
    }
};