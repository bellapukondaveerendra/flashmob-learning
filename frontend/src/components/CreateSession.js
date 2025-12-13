import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../CreateSession.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loadingVenues, setLoadingVenues] = useState(true);

  // Get user's subjects from preferences
  const userSubjects = user?.preferences?.subjects || [];
  const userMaxDistance = user?.preferences?.max_distance || 10;

  useEffect(() => {
    fetchNearbyVenues();
  }, []);

  const fetchNearbyVenues = async () => {
    setLoadingVenues(true);
    try {
      const response = await axios.get(`${API_URL}/venues/nearby`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVenues(response.data.venues);
    } catch (err) {
      console.error('Error fetching nearby venues:', err);
      setError('Failed to load venues within your distance preference');
      // Fallback to all venues if nearby fails
      try {
        const fallbackResponse = await axios.get(`${API_URL}/venues`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVenues(fallbackResponse.data.venues);
      } catch (fallbackErr) {
        console.error('Error fetching fallback venues:', fallbackErr);
      }
    } finally {
      setLoadingVenues(false);
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
    // Allow sessions to be created from now onwards
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getMaxStartTime = () => {
    const now = new Date();
    // Allow sessions up to 30 days in the future
    now.setDate(now.getDate() + 30);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(23).padStart(2, '0');
    const minutes = String(59).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

    // Validate start time
    const now = new Date();
    const selectedTime = new Date(formData.start_time);

    if (selectedTime <= now) {
      setError('Session must start in the future');
      setLoading(false);
      return;
    }

    const diffDays = (selectedTime - now) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      setError('Session cannot be scheduled more than 30 days in advance');
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
        coordinates: selectedVenue ? selectedVenue.coordinates : { lat: 0, lng: 0 },
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
          <p>Your session is pending admin approval. You'll be notified once it's approved.</p>
        </div>
      </div>
    );
  }

  // Check if user has selected subjects
  if (userSubjects.length === 0) {
    return (
      <div className="create-session-container">
        <div className="create-session-header">
          <button onClick={onBack} className="back-btn">← Back</button>
          <h2>Create Study Session</h2>
        </div>
        <div className="error-message" style={{ marginTop: '2rem' }}>
          <p>You need to select your subjects of interest before creating a session.</p>
          <p>Please go to your Profile and select at least one subject.</p>
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
              {userSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <small>Only showing subjects from your interests</small>
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
            {loadingVenues ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                Loading nearby venues...
              </div>
            ) : venues.length === 0 ? (
              <div>
                <select disabled>
                  <option>No venues available</option>
                </select>
                <small style={{ color: '#c33', display: 'block', marginTop: '0.5rem' }}>
                  No venues found within {userMaxDistance} miles. Please update your distance preference in Profile settings.
                </small>
              </div>
            ) : (
              <>
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
                      {venue.distance !== undefined && ` (${venue.distance} mi)`}
                    </option>
                  ))}
                </select>
                <small>
                  Showing {venues.length} venue{venues.length !== 1 ? 's' : ''} within {userMaxDistance} miles of your address
                </small>
              </>
            )}
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
            <small>Schedule sessions anytime within the next 30 days</small>
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
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading || venues.length === 0}
          >
            {loading ? 'Creating Session...' : 'Create Session'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateSession;