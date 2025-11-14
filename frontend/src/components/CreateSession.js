import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../CreateSession.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'Engineering', 'Literature', 'History',
  'Economics', 'Psychology', 'Languages', 'Art'
];

function CreateSession({ user, token, onBack }) {
  const [venues, setVenues] = useState([]);
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    venue_id: '',
    venue_name: '',
    meeting_spot: '',
    start_time: '',
    duration: 60,
    max_participants: 5
  });
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchVenues();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const fetchVenues = async () => {
    try {
      const response = await axios.get(`${API_URL}/venues`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVenues(response.data.venues);
    } catch (err) {
      console.error('Error fetching venues:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleVenueSelect = (e) => {
    const venueId = e.target.value;
    const selectedVenue = venues.find(v => v.venue_id === venueId);
    
    if (selectedVenue) {
      setFormData(prev => ({
        ...prev,
        venue_id: venueId,
        venue_name: selectedVenue.name
      }));
    }
  };

  const getMinStartTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    return now.toISOString().slice(0, 16);
  };

  const getMaxStartTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    return now.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.subject || !formData.topic || !formData.venue_id) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    const selectedVenue = venues.find(v => v.venue_id === formData.venue_id);

    const sessionData = {
      subject: formData.subject,
      topic: formData.topic,
      location: {
        venue_id: formData.venue_id,
        venue_name: formData.venue_name,
        coordinates: selectedVenue ? selectedVenue.coordinates : userLocation,
        meeting_spot: formData.meeting_spot
      },
      start_time: new Date(formData.start_time).toISOString(),
      duration: parseInt(formData.duration),
      max_participants: parseInt(formData.max_participants)
    };

    try {
      await axios.post(`${API_URL}/sessions`, sessionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="create-session-container">
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h2>Session Created Successfully!</h2>
          <p>Redirecting you back to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-session-container">
      <div className="create-session-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>Create Study Session</h2>
      </div>

      <form onSubmit={handleSubmit} className="create-session-form">
        <div className="form-section">
          <h3>What are you studying?</h3>
          
          <div className="form-group">
            <label htmlFor="subject">Subject *</label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            >
              <option value="">Select a subject</option>
              {SUBJECTS.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="topic">Topic *</label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              required
              placeholder="e.g., Calculus II - Integration by parts"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Where will you meet?</h3>
          
          <div className="form-group">
            <label htmlFor="venue_id">Venue *</label>
            <select
              id="venue_id"
              name="venue_id"
              value={formData.venue_id}
              onChange={handleVenueSelect}
              required
            >
              <option value="">Select a venue</option>
              {venues.map(venue => (
                <option key={venue.venue_id} value={venue.venue_id}>
                  {venue.name} - {venue.address}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="meeting_spot">Specific Meeting Spot</label>
            <input
              type="text"
              id="meeting_spot"
              name="meeting_spot"
              value={formData.meeting_spot}
              onChange={handleChange}
              placeholder="e.g., 3rd floor, study room B"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Session Details</h3>
          
          <div className="form-group">
            <label htmlFor="start_time">Start Time *</label>
            <input
              type="datetime-local"
              id="start_time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              min={getMinStartTime()}
              max={getMaxStartTime()}
              required
            />
            <small>Sessions must start between 15-60 minutes from now</small>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (minutes) *</label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
              <option value="150">2.5 hours</option>
              <option value="180">3 hours</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="max_participants">Maximum Participants *</label>
            <input
              type="number"
              id="max_participants"
              name="max_participants"
              value={formData.max_participants}
              onChange={handleChange}
              min="3"
              max="8"
              required
            />
            <small>Between 3 and 8 participants</small>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button type="button" onClick={onBack} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating Session...' : 'Create Session'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateSession;