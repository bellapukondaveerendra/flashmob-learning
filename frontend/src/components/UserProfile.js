import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../UserProfile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'Engineering', 'Literature', 'History',
  'Economics', 'Psychology', 'Languages', 'Art'
];

function UserProfile({ user, token, onBack, onUpdateUser }) {
  const [profile, setProfile] = useState(null);
  const [venues, setVenues] = useState([]);
  const [formData, setFormData] = useState({
    subjects: [],
    favorite_venues: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('preferences');

  useEffect(() => {
    fetchUserProfile();
    fetchVenues();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data.user);
      setFormData({
        subjects: response.data.user.preferences?.subjects || [],
        favorite_venues: response.data.user.preferences?.favorite_venues || []
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error fetching profile:', err);
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

  const handleSubjectToggle = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleVenueToggle = (venueId) => {
    setFormData(prev => ({
      ...prev,
      favorite_venues: prev.favorite_venues.includes(venueId)
        ? prev.favorite_venues.filter(v => v !== venueId)
        : [...prev.favorite_venues, venueId]
    }));
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(
        `${API_URL}/users/preferences`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setProfile(response.data.user);
      setSuccess('Preferences saved successfully!');
      
      // Update user in parent component
      const updatedUser = {
        ...user,
        preferences: response.data.user.preferences
      };
      onUpdateUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A';
    
    // Remove country code if present
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('1') && digits.length === 11) {
      digits = digits.slice(1);
    }
    
    // Format as 000-000-0000
    if (digits.length === 10) {
      return `+1 ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    return phone;
  };

  if (!profile) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="user-profile-container">
      <div className="profile-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>My Profile</h2>
      </div>

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-avatar">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <h3>{profile.name}</h3>
            <p className="profile-email">{profile.email}</p>
            <div className="profile-stats">
              <div className="stat-item">
                <div className="stat-value">{profile.active_sessions?.length || 0}</div>
                <div className="stat-label">Active Sessions</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{profile.preferences?.subjects?.length || 0}</div>
                <div className="stat-label">Interests</div>
              </div>
            </div>
          </div>

          <div className="profile-nav">
            <button
              className={`nav-item ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              ⚙️ Preferences
            </button>
            <button
              className={`nav-item ${activeTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setActiveTab('sessions')}
            >
              📚 My Sessions
            </button>
            <button
              className={`nav-item ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              👤 Account Info
            </button>
          </div>
        </div>

        <div className="profile-main">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {activeTab === 'preferences' && (
            <div className="tab-content">
              <h3>Study Preferences</h3>
              <form onSubmit={handleSavePreferences} className="preferences-form">
                <div className="form-section">
                  <label>Subjects of Interest</label>
                  <p className="form-hint">Select the subjects you want to study</p>
                  <div className="subject-chips">
                    {SUBJECTS.map(subject => (
                      <button
                        key={subject}
                        type="button"
                        className={`chip ${formData.subjects.includes(subject) ? 'selected' : ''}`}
                        onClick={() => handleSubjectToggle(subject)}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-section">
                  <label>Favorite Venues</label>
                  <p className="form-hint">Select your preferred study locations</p>
                  <div className="venues-list">
                    {venues.map(venue => (
                      <div
                        key={venue.venue_id}
                        className={`venue-item ${formData.favorite_venues.includes(venue.venue_id) ? 'selected' : ''}`}
                        onClick={() => handleVenueToggle(venue.venue_id)}
                      >
                        <div className="venue-info">
                          <h4>{venue.name}</h4>
                          <p>{venue.address}</p>
                          <div className="venue-ratings">
                            <span>📶 WiFi: {venue.wifi_quality}/5</span>
                            <span>🔇 Noise: {venue.noise_level}/5</span>
                            <span>⭐ Rating: {venue.study_rating}/5</span>
                          </div>
                        </div>
                        {formData.favorite_venues.includes(venue.venue_id) && (
                          <div className="venue-selected-icon">✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="tab-content">
              <h3>My Active Sessions</h3>
              {profile.active_sessions && profile.active_sessions.length > 0 ? (
                <div className="active-sessions-list">
                  {profile.active_sessions.map((sessionId, index) => (
                    <div key={sessionId} className="session-item">
                      <div className="session-icon">📚</div>
                      <div className="session-info">
                        <h4>Session #{sessionId}</h4>
                        <p>Active session</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>You haven't joined any sessions yet.</p>
                  <p>Start by browsing available sessions!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'account' && (
            <div className="tab-content">
              <h3>Account Information</h3>
              <div className="account-info">
                <div className="info-row">
                  <label>Full Name</label>
                  <p>{profile.name}</p>
                </div>
                <div className="info-row">
                  <label>Email Address</label>
                  <p>{profile.email}</p>
                </div>
                <div className="info-row">
                  <label>Phone Number</label>
                  <p>{formatPhoneNumber(profile.phone)}</p>
                </div>
                <div className="info-row">
                  <label>User ID</label>
                  <p>#{profile.user_id}</p>
                </div>
                <div className="info-row">
                  <label>Member Since</label>
                  <p>{new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;