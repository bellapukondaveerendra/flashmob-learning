import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Dashboard({ user, token, onViewChange }) {
  const [mySessions, setMySessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMySessions();
  }, []);

  const fetchMySessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/sessions/my-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMySessions(response.data.sessions);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load your sessions');
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

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending_admin_approval': { text: 'Pending Admin Approval', class: 'status-pending' },
      'active': { text: 'Active', class: 'status-active' },
      'in_progress': { text: 'In Progress', class: 'status-progress' },
      'completed': { text: 'Completed', class: 'status-completed' },
      'cancelled': { text: 'Cancelled', class: 'status-cancelled' }
    };
    return statusMap[status] || { text: status, class: 'status-default' };
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome back, {user.name}! 👋</h2>
        <p>Manage your study sessions and find new ones</p>
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
          <h3>My Sessions</h3>
          <button onClick={fetchMySessions} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading ? (
          <div className="loading">Loading sessions...</div>
        ) : mySessions.length === 0 ? (
          <div className="empty-state">
            <p>You haven't joined any sessions yet.</p>
            <p>Create a session or browse available ones!</p>
          </div>
        ) : (
          <div className="sessions-grid">
            {mySessions.map(session => {
              const statusBadge = getStatusBadge(session.status);
              return (
                <div 
                  key={session.session_id} 
                  className="session-card"
                  onClick={() => onViewChange('session-details', session)}
                >
                  <div className="session-header">
                    <h4>{session.subject}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <span className={`status-badge ${statusBadge.class}`}>{statusBadge.text}</span>
                      {session.status === 'active' && (
                        <span className="time-badge">{getTimeUntilStart(session.start_time)}</span>
                      )}
                    </div>
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
              );
            })}
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