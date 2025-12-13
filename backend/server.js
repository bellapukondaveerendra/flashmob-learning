const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const models = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flashmob_learning', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Admin Middleware - NEW
const authenticateAdmin = async (req, res, next) => {
  const user = await models.User.findOne({ user_id: req.user.user_id });
  if (!user || !user.is_admin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const convertSessionToFrontend = (session) => {
  const sessionObj = session.toObject ? session.toObject() : session;
  
  // Convert location coordinates from GeoJSON to {lat, lng}
  if (sessionObj.location && sessionObj.location.coordinates && sessionObj.location.coordinates.coordinates) {
    sessionObj.location.coordinates = {
      lat: sessionObj.location.coordinates.coordinates[1],
      lng: sessionObj.location.coordinates.coordinates[0]
    };
  }
  
  return sessionObj;
};

const generateMessageId = async () => {
  const count = await models.SessionMessage.countDocuments();
  return `MSG${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;
};

// Helper function to generate session ID
const generateSessionId = async () => {
  const year = new Date().getFullYear();
  
  // Find the highest session_id for the current year
  const lastSession = await models.Session.findOne({
    session_id: new RegExp(`^S${year}`)
  }).sort({ session_id: -1 });

  let nextNumber = 1;
  if (lastSession) {
    // Extract the number part and increment
    const lastNumber = parseInt(lastSession.session_id.substring(5));
    nextNumber = lastNumber + 1;
  }

  return `S${year}${String(nextNumber).padStart(4, '0')}`;
};

// Helper function to generate user ID
const generateUserId = async () => {
  const lastUser = await models.User.findOne().sort({ user_id: -1 });
  return lastUser ? lastUser.user_id + 1 : 101;
};

// Helper function to generate join request ID
const generateJoinRequestId = async () => {
  const count = await models.JoinRequest.countDocuments();
  return `JR${new Date().getFullYear()}${String(count + 1).padStart(5, '0')}`;
};

// ==================== AUTH ROUTES ====================

// Register - UPDATED to store coordinates in GeoJSON format
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, phone, password, name, address, preferences } = req.body;

    const existingUser = await models.User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user_id = await generateUserId();

    // Geocode the address to get coordinates
    const coords = await geocodeAddress(address);

    const newUser = new models.User({
      user_id,
      email,
      phone,
      password: hashedPassword,
      name,
      address,
      coordinates: {
        type: 'Point',
        coordinates: [coords.lng, coords.lat] // [longitude, latitude] - GeoJSON format
      },
      is_admin: false,
      preferences: preferences || { subjects: [], max_distance: 10, favorite_venues: [] }
    });

    await newUser.save();

    const token = jwt.sign({ user_id, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { 
        user_id, 
        email,
        phone,
        name,
        address,
        coordinates: coords, // Return as {lat, lng} for frontend
        is_admin: false,
        preferences: newUser.preferences 
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Login - UPDATED to return is_admin flag
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await models.User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ user_id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin,  // IMPORTANT: Return admin flag
        preferences: user.preferences,
        active_sessions: user.active_sessions
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/sessions/:session_id/messages', authenticateToken, async (req, res) => {
  try {
    const session = await models.Session.findOne({ session_id: req.params.session_id });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Only participants can see messages
    if (!session.participants.includes(req.user.user_id)) {
      return res.status(403).json({ message: 'Only participants can view messages' });
    }

    const messages = await models.SessionMessage.find({
      session_id: req.params.session_id
    }).sort({ created_at: 1 }); // Oldest first

    // Get user names for each message
    const messagesWithNames = await Promise.all(
      messages.map(async (msg) => {
        const user = await models.User.findOne({ user_id: msg.user_id }).select('name');
        return {
          message_id: msg.message_id,
          session_id: msg.session_id,
          user_id: msg.user_id,
          user_name: user ? user.name : null,
          message: msg.message,
          created_at: msg.created_at
        };
      })
    );

    res.json({ messages: messagesWithNames });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a message to a session
app.post('/api/sessions/:session_id/messages', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    if (message.length > 500) {
      return res.status(400).json({ message: 'Message cannot exceed 500 characters' });
    }

    const session = await models.Session.findOne({ session_id: req.params.session_id });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Only participants can send messages
    if (!session.participants.includes(req.user.user_id)) {
      return res.status(403).json({ message: 'Only participants can send messages' });
    }

    const message_id = await generateMessageId();

    const newMessage = new models.SessionMessage({
      message_id,
      session_id: req.params.session_id,
      user_id: req.user.user_id,
      message: message.trim()
    });

    await newMessage.save();

    res.status(201).json({ 
      message: 'Message sent successfully',
      sessionMessage: newMessage
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/sessions/my-sessions', authenticateToken, async (req, res) => {
  try {
    // Find all sessions where user is a participant
    const sessions = await models.Session.find({
      participants: req.user.user_id
    }).sort({ start_time: 1 });

    // Also find sessions where user has pending join requests
    const pendingRequests = await models.JoinRequest.find({
      user_id: req.user.user_id,
      status: 'pending'
    });

    // Get sessions for pending requests
    const pendingSessionIds = pendingRequests.map(req => req.session_id);
    const pendingSessions = await models.Session.find({
      session_id: { $in: pendingSessionIds }
    });

    // Combine and remove duplicates
    const allSessions = [...sessions];
    pendingSessions.forEach(ps => {
      if (!allSessions.find(s => s.session_id === ps.session_id)) {
        allSessions.push(ps);
      }
    });

    // Sort by start time
    allSessions.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    // Convert coordinates for frontend
    const convertedSessions = allSessions.map(convertSessionToFrontend);

    res.json({ sessions: convertedSessions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== SESSION ROUTES ====================

// Create Session - UPDATED to set pending_admin_approval status
app.post('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const { subject, topic, location, start_time, duration, max_participants } = req.body;

    const session_id = await generateSessionId();

    // Convert location coordinates from {lat, lng} to GeoJSON format
    const geoJsonLocation = {
      venue_id: location.venue_id,
      venue_name: location.venue_name,
      coordinates: {
        type: 'Point',
        coordinates: [location.coordinates.lng, location.coordinates.lat] // [lng, lat]
      },
      meeting_spot: location.meeting_spot
    };

    const newSession = new models.Session({
      session_id,
      creator_id: req.user.user_id,
      subject,
      topic,
      location: geoJsonLocation, // Use GeoJSON format
      start_time,
      duration,
      max_participants,
      participants: [req.user.user_id],
      status: 'pending_admin_approval',
      admin_approved: false
    });

    await newSession.save();

    // Create participant entry for creator as session admin
    const participant = new models.Participant({
      user_id: req.user.user_id,
      session_id,
      role: 'session_admin',
      is_session_admin: true
    });

    await participant.save();

    // Update user's active sessions
    await models.User.findOneAndUpdate(
      { user_id: req.user.user_id },
      { $push: { active_sessions: session_id } }
    );

    res.status(201).json({ 
      message: 'Session created successfully. Waiting for admin approval.', 
      session: newSession 
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Get All Sessions - UPDATED to only show active sessions to non-admins
app.get('/api/sessions/all', authenticateToken, async (req, res) => {
  try {
    const user = await models.User.findOne({ user_id: req.user.user_id });
    
    let query = {};
    // Non-admins only see active, in_progress, or completed sessions
    if (!user.is_admin) {
      query.status = { $in: ['active', 'in_progress', 'completed'] };
    }
    
    const sessions = await models.Session.find(query).sort({ start_time: 1 });
    
    // Convert coordinates for frontend
    const convertedSessions = sessions.map(convertSessionToFrontend);
    
    res.json({ sessions: convertedSessions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Nearby Sessions - UPDATED to only show active sessions
app.get('/api/sessions/nearby', authenticateToken, async (req, res) => {
  try {
    const { lat, lng, maxDistance = 5000, subject } = req.query;

    const query = {
      status: 'active',
      start_time: { $gte: new Date() },
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    };

    if (subject) {
      query.subject = subject;
    }

    const sessions = await models.Session.find(query).limit(20);

    // Convert coordinates for frontend
    const convertedSessions = sessions.map(convertSessionToFrontend);

    res.json({ sessions: convertedSessions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Session Details
app.get('/api/sessions/:session_id', authenticateToken, async (req, res) => {
  try {
    const session = await models.Session.findOne({ session_id: req.params.session_id });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const participants = await models.Participant.find({ session_id: req.params.session_id });

    // Get user details for each participant
    const participantsWithDetails = await Promise.all(
      participants.map(async (participant) => {
        const user = await models.User.findOne({ user_id: participant.user_id }).select('name email');
        return {
          ...participant.toObject(),
          name: user ? user.name : null,
          email: user ? user.email : null
        };
      })
    );

    // Convert coordinates for frontend
    const convertedSession = convertSessionToFrontend(session);

    res.json({ session: convertedSession, participants: participantsWithDetails });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Join Session - UPDATED to create join request instead of immediate join
app.post('/api/sessions/:session_id/join', authenticateToken, async (req, res) => {
  try {
    const session = await models.Session.findOne({ session_id: req.params.session_id });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ message: 'Session is not active' });
    }

    if (session.participants.length >= session.max_participants) {
      return res.status(400).json({ message: 'Session is full' });
    }

    if (session.participants.includes(req.user.user_id)) {
      return res.status(400).json({ message: 'Already joined this session' });
    }

    // Check if already has a pending request
    const existingRequest = await models.JoinRequest.findOne({
      session_id: req.params.session_id,
      user_id: req.user.user_id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Join request already pending' });
    }

    // Create join request instead of joining directly
    const request_id = await generateJoinRequestId();
    const joinRequest = new models.JoinRequest({
      request_id,
      session_id: req.params.session_id,
      user_id: req.user.user_id,
      status: 'pending'
    });

    await joinRequest.save();

    res.json({ 
      message: 'Join request sent. Waiting for session creator approval.', 
      joinRequest 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Pending Join Requests for a Session - NEW
app.get('/api/sessions/:session_id/join-requests', authenticateToken, async (req, res) => {
  try {
    const session = await models.Session.findOne({ session_id: req.params.session_id });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Only session creator can see join requests
    if (session.creator_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Only session creator can view join requests' });
    }

    const requests = await models.JoinRequest.find({
      session_id: req.params.session_id,
      status: 'pending'
    });

    // Get user details for each request
    const requestsWithUserDetails = await Promise.all(
      requests.map(async (request) => {
        const user = await models.User.findOne({ user_id: request.user_id }).select('-password');
        return {
          ...request.toObject(),
          user: user ? { user_id: user.user_id, name: user.name, email: user.email } : null
        };
      })
    );

    res.json({ requests: requestsWithUserDetails });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve Join Request - NEW
app.post('/api/sessions/:session_id/approve-join/:request_id', authenticateToken, async (req, res) => {
  try {
    const session = await models.Session.findOne({ session_id: req.params.session_id });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Only session creator can approve
    if (session.creator_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Only session creator can approve join requests' });
    }

    const joinRequest = await models.JoinRequest.findOne({ 
      request_id: req.params.request_id 
    });

    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Check if session is full
    if (session.participants.length >= session.max_participants) {
      return res.status(400).json({ message: 'Session is full' });
    }

    // Approve the request
    joinRequest.status = 'approved';
    joinRequest.reviewed_at = new Date();
    joinRequest.reviewed_by = req.user.user_id;
    await joinRequest.save();

    // Add user to session
    session.participants.push(joinRequest.user_id);
    await session.save();

    // Create participant entry
    const participant = new models.Participant({
      user_id: joinRequest.user_id,
      session_id: req.params.session_id,
      role: 'participant',
      is_session_admin: false
    });
    await participant.save();

    // Update user's active sessions
    await models.User.findOneAndUpdate(
      { user_id: joinRequest.user_id },
      { $push: { active_sessions: req.params.session_id } }
    );

    res.json({ message: 'Join request approved successfully', session });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject Join Request - NEW
app.post('/api/sessions/:session_id/reject-join/:request_id', authenticateToken, async (req, res) => {
  try {
    const session = await models.Session.findOne({ session_id: req.params.session_id });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Only session creator can reject
    if (session.creator_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Only session creator can reject join requests' });
    }

    const joinRequest = await models.JoinRequest.findOne({ 
      request_id: req.params.request_id 
    });

    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Reject the request
    joinRequest.status = 'rejected';
    joinRequest.reviewed_at = new Date();
    joinRequest.reviewed_by = req.user.user_id;
    await joinRequest.save();

    res.json({ message: 'Join request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check-in to Session
app.post('/api/sessions/:session_id/checkin', authenticateToken, async (req, res) => {
  try {
    const participant = await models.Participant.findOne({
      user_id: req.user.user_id,
      session_id: req.params.session_id
    });

    if (!participant) {
      return res.status(404).json({ message: 'Not a participant of this session' });
    }

    participant.checked_in = true;
    participant.check_in_time = new Date();
    await participant.save();

    res.json({ message: 'Checked in successfully', participant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel Session (Session Admin only)
app.delete('/api/sessions/:session_id', authenticateToken, async (req, res) => {
  try {
    const session = await models.Session.findOne({ session_id: req.params.session_id });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.creator_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Only session creator can cancel' });
    }

    session.status = 'cancelled';
    await session.save();

    res.json({ message: 'Session cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove Participant from Session (Session Admin only)
app.post('/api/sessions/:session_id/remove-participant', authenticateToken, async (req, res) => {
  try {
    const { participant_id } = req.body;
    const session = await models.Session.findOne({ session_id: req.params.session_id });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.creator_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Only session creator can remove participants' });
    }

    session.participants = session.participants.filter(id => id !== participant_id);
    await session.save();

    await models.Participant.deleteOne({
      user_id: participant_id,
      session_id: req.params.session_id
    });

    await models.User.findOneAndUpdate(
      { user_id: participant_id },
      { $pull: { active_sessions: req.params.session_id } }
    );

    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== VENUE ROUTES ====================

// Get All Venues
app.get('/api/venues', authenticateToken, async (req, res) => {
  try {
    const venues = await models.Venue.find();
    
    // Convert GeoJSON coordinates to {lat, lng} format for frontend
    const formattedVenues = venues.map(venue => ({
      venue_id: venue.venue_id,
      name: venue.name,
      address: venue.address,
      coordinates: {
        lat: venue.coordinates.coordinates[1],
        lng: venue.coordinates.coordinates[0]
      },
      type: venue.type,
      wifi_quality: venue.wifi_quality,
      noise_level: venue.noise_level,
      study_rating: venue.study_rating
    }));
    
    res.json({ venues: formattedVenues });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Venue by ID
// app.get('/api/venues/:venue_id', authenticateToken, async (req, res) => {
//   try {
//     const venue = await models.Venue.findOne({ venue_id: req.params.venue_id });
    
//     if (!venue) {
//       return res.status(404).json({ message: 'Venue not found' });
//     }

//     res.json({ venue });
//   } catch (error) {
    // res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });



app.put('/api/users/address', authenticateToken, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address || !address.trim()) {
      return res.status(400).json({ message: 'Address is required' });
    }

    // Geocode the new address
    const coords = await geocodeAddress(address);

    const user = await models.User.findOneAndUpdate(
      { user_id: req.user.user_id },
      { 
        address: address.trim(),
        coordinates: {
          type: 'Point',
          coordinates: [coords.lng, coords.lat] // [longitude, latitude] - GeoJSON format
        }
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Address updated successfully', 
      user: {
        ...user.toObject(),
        coordinates: coords // Return as {lat, lng} for frontend
      }
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== USER ROUTES ====================

// Get User Profile
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await models.User.findOne({ user_id: req.user.user_id }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update User Preferences - UPDATED to include max_distance
app.put('/api/users/preferences', authenticateToken, async (req, res) => {
  try {
    const { subjects, max_distance, favorite_venues } = req.body;

    const user = await models.User.findOneAndUpdate(
      { user_id: req.user.user_id },
      { 
        preferences: {
          subjects: subjects || [],
          max_distance: max_distance || 10,
          favorite_venues: favorite_venues || []
        }
      },
      { new: true }
    ).select('-password');

    res.json({ message: 'Preferences updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Venues within User's Distance - UPDATED to handle GeoJSON coordinates
// Add this EXACT route to your backend/server.js file
// Replace the existing /api/venues/nearby route with this:

// Get Venues within User's Distance - FIXED VERSION
app.get('/api/venues/nearby', authenticateToken, async (req, res) => {
  try {
    const user = await models.User.findOne({ user_id: req.user.user_id });
    
    if (!user || !user.coordinates || !user.coordinates.coordinates) {
      return res.status(400).json({ message: 'User location not found' });
    }

    const allVenues = await models.Venue.find();
    const maxDistance = user.preferences?.max_distance || 10;

    // Extract lat/lng from GeoJSON format
    const userLng = user.coordinates.coordinates[0];
    const userLat = user.coordinates.coordinates[1];

    console.log(`User Location: [${userLat}, ${userLng}]`);
    console.log(`Max Distance: ${maxDistance} miles`);
    console.log(`Total venues in DB: ${allVenues.length}`);

    // Calculate distance helper function
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in miles
    };

    // Filter and map venues
    const nearbyVenues = allVenues
      .map(venue => {
        // Extract venue coordinates from GeoJSON
        const venueLng = venue.coordinates.coordinates[0];
        const venueLat = venue.coordinates.coordinates[1];
        
        const distance = calculateDistance(
          userLat,
          userLng,
          venueLat,
          venueLng
        );
        
        return {
          venue_id: venue.venue_id,
          name: venue.name,
          address: venue.address,
          coordinates: { lat: venueLat, lng: venueLng },
          type: venue.type,
          wifi_quality: venue.wifi_quality,
          noise_level: venue.noise_level,
          study_rating: venue.study_rating,
          distance: Math.round(distance * 10) / 10
        };
      })
      .filter(venue => venue.distance <= maxDistance) // IMPORTANT: Filter by distance
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    console.log(`Venues within ${maxDistance} miles: ${nearbyVenues.length}`);

    res.json({ venues: nearbyVenues });
  } catch (error) {
    console.error('Error in /api/venues/nearby:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== COURSE ROUTES ====================

// Get All Courses
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const courses = await models.Course.find();
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Course by ID
app.get('/api/courses/:course_id', authenticateToken, async (req, res) => {
  try {
    const course = await models.Course.findOne({ course_id: req.params.course_id });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ course });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Course (Admin only - simplified for now)
app.post('/api/courses', authenticateToken, async (req, res) => {
  try {
    const { course_id, course_name, description, subject, credits } = req.body;

    const newCourse = new models.Course({
      course_id,
      course_name,
      description,
      subject,
      credits
    });

    await newCourse.save();
    res.status(201).json({ message: 'Course created successfully', course: newCourse });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== SECTION ROUTES ====================

// Get All Sections
app.get('/api/sections', authenticateToken, async (req, res) => {
  try {
    const { course_id } = req.query;
    const query = course_id ? { course_id } : {};
    const sections = await models.Section.find(query);
    res.json({ sections });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Section by ID
app.get('/api/sections/:section_id', authenticateToken, async (req, res) => {
  try {
    const section = await models.Section.findOne({ section_id: req.params.section_id });
    
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.json({ section });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== ENROLLMENT ROUTES ====================

// Get User Enrollments
app.get('/api/enrollments/my', authenticateToken, async (req, res) => {
  try {
    const enrollments = await models.Enrollment.find({ 
      participant_id: req.user.user_id 
    });
    res.json({ enrollments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Enrollment
app.post('/api/enrollments', authenticateToken, async (req, res) => {
  try {
    const { section_id } = req.body;

    const section = await models.Section.findOne({ section_id });
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const existingEnrollment = await models.Enrollment.findOne({
      participant_id: req.user.user_id,
      section_id
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this section' });
    }

    const enrollCount = await models.Enrollment.countDocuments();
    const enroll_id = `E${String(enrollCount + 1).padStart(6, '0')}`;

    const newEnrollment = new models.Enrollment({
      enroll_id,
      participant_id: req.user.user_id,
      section_id,
      status: 'active'
    });

    await newEnrollment.save();
    res.status(201).json({ 
      message: 'Enrolled successfully', 
      enrollment: newEnrollment 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Drop Enrollment
app.delete('/api/enrollments/:enroll_id', authenticateToken, async (req, res) => {
  try {
    const enrollment = await models.Enrollment.findOne({ 
      enroll_id: req.params.enroll_id,
      participant_id: req.user.user_id 
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    enrollment.status = 'dropped';
    await enrollment.save();

    res.json({ message: 'Enrollment dropped successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== PAYMENT ROUTES ====================

// Get User Payments
app.get('/api/payments/my', authenticateToken, async (req, res) => {
  try {
    const enrollments = await models.Enrollment.find({ 
      participant_id: req.user.user_id 
    });
    
    const enrollIds = enrollments.map(e => e.enroll_id);
    const payments = await models.Payment.find({ 
      enroll_id: { $in: enrollIds } 
    });

    res.json({ payments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Payment
app.post('/api/payments', authenticateToken, async (req, res) => {
  try {
    const { enroll_id, amount, payment_method } = req.body;

    const enrollment = await models.Enrollment.findOne({ enroll_id });
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (enrollment.participant_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const paymentCount = await models.Payment.countDocuments();
    const payment_id = `PAY${String(paymentCount + 1).padStart(6, '0')}`;

    const newPayment = new models.Payment({
      payment_id,
      enroll_id,
      amount,
      payment_method,
      status: 'completed'
    });

    await newPayment.save();
    res.status(201).json({ 
      message: 'Payment processed successfully', 
      payment: newPayment 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== INSTRUCTOR ROUTES ====================

// Get All Instructors
app.get('/api/instructors', authenticateToken, async (req, res) => {
  try {
    const instructors = await models.Instructor.find();
    res.json({ instructors });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Instructor by ID
app.get('/api/instructors/:instructor_id', authenticateToken, async (req, res) => {
  try {
    const instructor = await models.Instructor.findOne({ 
      instructor_id: req.params.instructor_id 
    });
    
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    res.json({ instructor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== PLATFORM ADMIN ROUTES ====================

// Get All Users (Admin only)
app.get('/api/admin/users', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const users = await models.User.find().select('-password');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Suspend User (Admin only)
app.post('/api/admin/users/:user_id/suspend', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const user = await models.User.findOneAndUpdate(
      { user_id: parseInt(req.params.user_id) },
      { suspended: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User suspended successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// Get Pending Sessions (Admin only) - NEW
app.get('/api/admin/sessions/pending', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const pendingSessions = await models.Session.find({ 
      status: 'pending_admin_approval' 
    }).sort({ created_at: -1 });

    // Get creator details for each session
    const sessionsWithCreator = await Promise.all(
      pendingSessions.map(async (session) => {
        const creator = await models.User.findOne({ user_id: session.creator_id }).select('-password');
        const convertedSession = convertSessionToFrontend(session);
        return {
          ...convertedSession,
          creator: creator ? { user_id: creator.user_id, name: creator.name, email: creator.email } : null
        };
      })
    );

    res.json({ sessions: sessionsWithCreator });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve Session (Admin only) - NEW
app.post('/api/admin/sessions/:session_id/approve', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const session = await models.Session.findOne({ session_id: req.params.session_id });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.status !== 'pending_admin_approval') {
      return res.status(400).json({ message: 'Session is not pending approval' });
    }

    session.status = 'active';
    session.admin_approved = true;
    session.admin_approved_by = req.user.user_id;
    session.admin_approved_at = new Date();
    await session.save();

    res.json({ message: 'Session approved successfully', session });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject Session (Admin only) - NEW
app.post('/api/admin/sessions/:session_id/reject', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const session = await models.Session.findOne({ session_id: req.params.session_id });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.status !== 'pending_admin_approval') {
      return res.status(400).json({ message: 'Session is not pending approval' });
    }

    session.status = 'rejected';
    session.admin_approved = false;
    session.admin_approved_by = req.user.user_id;
    session.admin_approved_at = new Date();
    await session.save();

    // Remove from creator's active sessions
    await models.User.findOneAndUpdate(
      { user_id: session.creator_id },
      { $pull: { active_sessions: session.session_id } }
    );

    res.json({ message: 'Session rejected', session });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete Any Session (Admin only)
app.delete('/api/admin/sessions/:session_id', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const session = await models.Session.findOneAndDelete({ 
      session_id: req.params.session_id 
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    await models.Participant.deleteMany({ session_id: req.params.session_id });

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


const geocodeAddress = async (address) => {
  // This is a simplified geocoding function
  // In production, integrate with Google Maps Geocoding API or similar
  
  // For now, return approximate coordinates based on common cities
  const cityCoordinates = {
    'warrensburg': { lat: 38.7625, lng: -93.7344 },
    'kansas': { lat: 39.0473, lng: -95.6752 },
    'kansas city': { lat: 39.0997, lng: -94.5786 },
    'olathe': { lat: 38.8831, lng: -94.8191 },
    'overland park': { lat: 38.9822, lng: -94.6708 },
    'new york': { lat: 40.7128, lng: -74.0060 },
    'los angeles': { lat: 34.0522, lng: -118.2437 },
    'chicago': { lat: 41.8781, lng: -87.6298 },
    'houston': { lat: 29.7604, lng: -95.3698 },
    'phoenix': { lat: 33.4484, lng: -112.0740 },
    'philadelphia': { lat: 39.9526, lng: -75.1652 },
    'san antonio': { lat: 29.4241, lng: -98.4936 },
    'san diego': { lat: 32.7157, lng: -117.1611 },
    'dallas': { lat: 32.7767, lng: -96.7970 },
    'san jose': { lat: 37.3382, lng: -121.8863 },
    'austin': { lat: 30.2672, lng: -97.7431 },
    'jacksonville': { lat: 30.3322, lng: -81.6557 },
    'san francisco': { lat: 37.7749, lng: -122.4194 },
    'columbus': { lat: 39.9612, lng: -82.9988 },
    'seattle': { lat: 47.6062, lng: -122.3321 },
    'denver': { lat: 39.7392, lng: -104.9903 },
    'boston': { lat: 42.3601, lng: -71.0589 },
    'miami': { lat: 25.7617, lng: -80.1918 }
  };
  
  const addressLower = address.toLowerCase();
  
  // Try to find a matching city
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (addressLower.includes(city)) {
      return coords;
    }
  }
  
  // Default to Warrensburg coordinates if no match found
  return { lat: 38.7625, lng: -93.7344 };
};


// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
};

// Get Platform Statistics (Admin only) - UPDATED
app.get('/api/admin/stats', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const stats = {
      totalUsers: await models.User.countDocuments(),
      totalSessions: await models.Session.countDocuments(),
      activeSessions: await models.Session.countDocuments({ status: 'active' }),
      pendingSessions: await models.Session.countDocuments({ status: 'pending_admin_approval' }),
      totalVenues: await models.Venue.countDocuments(),
      totalCourses: await models.Course.countDocuments(),
      totalEnrollments: await models.Enrollment.countDocuments()
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FlashMob Learning API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});