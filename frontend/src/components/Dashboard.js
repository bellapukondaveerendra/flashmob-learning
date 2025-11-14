import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Dashboard({ user, token, onViewChange }) {
  const [nearbySessions, setNearbySessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          fetchNearbySessions(location);
        },
        (error) => {
          setError('Unable to get your location. Please enable location services.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const fetchNearbySessions = async (location) => {
    setLoading(true);
    try {
      const maxDistance = (user.preferences?.max_distance || 5) * 1000; // Convert km to meters
      const response = await axios.get(`${API_URL}/sessions/nearby`, {
        params: {
          lat: location.lat,
          lng: location.lng,
          maxDistance
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setNearbySessions(response.data.sessions);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load nearby sessions');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeUntilStart = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start - now;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 0) return 'Started';
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    return `${hours}h ${diffMins % 60}m`;
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome back, {user.name}! 👋</h2>
        <p>Find study sessions happening near you right now</p>
      </div>

      <div className="action-cards">
        <div className="action-card primary" onClick={() => onViewChange('create-session')}>
          <div className="action-icon">➕</div>
          <h3>Create Session</h3>
          <p>Start a study session and invite others to join</p>
        </div>

        <div className="action-card" onClick={() => onViewChange('sessions')}>
          <div className="action-icon">🔍</div>
          <h3>Find Sessions</h3>
          <p>Browse all available study sessions</p>
        </div>

        <div className="action-card" onClick={() => onViewChange('profile')}>
          <div className="action-icon">⚙️</div>
          <h3>My Profile</h3>
          <p>Update your preferences and settings</p>
        </div>
      </div>

      <div className="nearby-sessions-section">
        <div className="section-header">
          <h3>Nearby Sessions</h3>
          {userLocation && (
            <button onClick={() => fetchNearbySessions(userLocation)} className="refresh-btn">
              🔄 Refresh
            </button>
          )}
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading ? (
          <div className="loading">Loading sessions...</div>
        ) : nearbySessions.length === 0 ? (
          <div className="empty-state">
            <p>No sessions found nearby at the moment.</p>
            <p>Be the first to create one!</p>
          </div>
        ) : (
          <div className="sessions-grid">
            {nearbySessions.map(session => (
              <div 
                key={session.session_id} 
                className="session-card"
                onClick={() => onViewChange('session-details', session)}
              >
                <div className="session-header">
                  <h4>{session.subject}</h4>
                  <span className="time-badge">{getTimeUntilStart(session.start_time)}</span>
                </div>
                <p className="session-topic">{session.topic}</p>
                <div className="session-meta">
                  <div className="meta-item">
                    📍 {session.location.venue_name}
                  </div>
                  <div className="meta-item">
                    ⏰ {formatDateTime(session.start_time)}
                  </div>
                  <div className="meta-item">
                    👥 {session.participants.length}/{session.max_participants} participants
                  </div>
                  <div className="meta-item">
                    ⏱️ {session.duration} min
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {user.preferences?.subjects && user.preferences.subjects.length > 0 && (
        <div className="preferences-summary">
          <h4>Your Interests</h4>
          <div className="subject-tags">
            {user.preferences.subjects.map(subject => (
              <span key={subject} className="subject-tag">{subject}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;