const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  user_id: { type: Number, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  is_admin: { type: Boolean, default: false },
  preferences: {
    subjects: [String],
    max_distance: { type: Number, default: 5 },
    favorite_venues: [String]
  },
  active_sessions: [String],
  created_at: { type: Date, default: Date.now }
});

// Session Schema
const sessionSchema = new mongoose.Schema({
  session_id: { type: String, required: true, unique: true },
  creator_id: { type: Number, required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  location: {
    venue_id: String,
    venue_name: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    meeting_spot: String
  },
  start_time: { type: Date, required: true },
  duration: { type: Number, required: true, min: 30, max: 180 },
  max_participants: { type: Number, required: true, min: 3, max: 8 },
  participants: [Number],
  status: { 
    type: String, 
    enum: ['active', 'in_progress', 'completed', 'cancelled'],
    default: 'active'
  },
  created_at: { type: Date, default: Date.now }
});

// Venue Schema
const venueSchema = new mongoose.Schema({
  venue_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  type: { type: String, required: true },
  wifi_quality: { type: Number, min: 1, max: 5 },
  noise_level: { type: Number, min: 1, max: 5 },
  study_rating: { type: Number, min: 0, max: 5 }
});

// Participant Schema
const participantSchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  session_id: { type: String, required: true },
  role: { type: String, enum: ['session_admin', 'participant'], default: 'participant' },
  is_session_admin: { type: Boolean, default: false },
  joined_at: { type: Date, default: Date.now },
  checked_in: { type: Boolean, default: false },
  check_in_time: Date
});

// Platform Admin Schema
const platformAdminSchema = new mongoose.Schema({
  admin_id: { type: Number, required: true, unique: true },
  user_id: { type: Number, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin'], default: 'admin' },
  permissions: {
    manage_users: { type: Boolean, default: true },
    manage_venues: { type: Boolean, default: true },
    delete_sessions: { type: Boolean, default: true }
  }
});

// Instructor Schema
const instructorSchema = new mongoose.Schema({
  instructor_id: { type: String, required: true, unique: true },
  user_id: { type: Number, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  specialization: [String],
  bio: String,
  created_at: { type: Date, default: Date.now }
});

// Course Schema
const courseSchema = new mongoose.Schema({
  course_id: { type: String, required: true, unique: true },
  course_name: { type: String, required: true },
  description: String,
  subject: { type: String, required: true },
  credits: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

// Section Schema
const sectionSchema = new mongoose.Schema({
  section_id: { type: String, required: true, unique: true },
  course_id: { type: String, required: true },
  instructor_id: { type: String, required: true },
  location_id: { type: String, required: true },
  capacity: { type: Number, required: true },
  meeting_days: [String],
  meeting_time: String,
  semester: String,
  created_at: { type: Date, default: Date.now }
});

// Location Schema
const locationSchema = new mongoose.Schema({
  location_id: { type: String, required: true, unique: true },
  building: { type: String, required: true },
  room: { type: String, required: true },
  city: { type: String, required: true },
  capacity: Number,
  equipment: [String]
});

// Enrollment Schema
const enrollmentSchema = new mongoose.Schema({
  enroll_id: { type: String, required: true, unique: true },
  participant_id: { type: Number, required: true },
  section_id: { type: String, required: true },
  enrollment_date: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['active', 'dropped', 'completed'],
    default: 'active'
  },
  grade: String
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  payment_id: { type: String, required: true, unique: true },
  enroll_id: { type: String, required: true },
  amount: { type: Number, required: true },
  payment_method: { 
    type: String, 
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  payment_date: { type: Date, default: Date.now }
});

// Create indexes for better query performance
sessionSchema.index({ 'location.coordinates': '2dsphere' });
sessionSchema.index({ start_time: 1, status: 1 });
venueSchema.index({ coordinates: '2dsphere' });
participantSchema.index({ user_id: 1, session_id: 1 });

// Export models
module.exports = {
  User: mongoose.model('User', userSchema),
  Session: mongoose.model('Session', sessionSchema),
  Venue: mongoose.model('Venue', venueSchema),
  Participant: mongoose.model('Participant', participantSchema),
  PlatformAdmin: mongoose.model('PlatformAdmin', platformAdminSchema),
  Instructor: mongoose.model('Instructor', instructorSchema),
  Course: mongoose.model('Course', courseSchema),
  Section: mongoose.model('Section', sectionSchema),
  Location: mongoose.model('Location', locationSchema),
  Enrollment: mongoose.model('Enrollment', enrollmentSchema),
  Payment: mongoose.model('Payment', paymentSchema)
};