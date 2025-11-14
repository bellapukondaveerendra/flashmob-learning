import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../SessionDetails.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SessionDetails({ session: initialSession, user, token, onBack }) {
  const [session, setSession] = useState(initialSession);
  const [participants, setParticipants] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (initialSession) {
      fetchSessionDetails();
      if (initialSession.creator_id === user.user_id) {
        fetchPendingRequests();
      }
    }
  }, [initialSession]);

  const fetchSessionDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/sessions/${initialSession.session_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSession(response.data.session);
      setParticipants(response.data.participants);
    } catch (err) {
      setError('Failed to load session details');
      console.error('Error fetching session details:', err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/sessions/${initialSession.session_id}/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRequests(response.data.requests);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  };

  const handleApproveRequest = async (userId) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(
        `${API_URL}/sessions/${session.session_id}/approve/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Join request approved!');
      fetchSessionDetails();
      fetchPendingRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (userId) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(
        `${API_URL}/sessions/${session.session_id}/reject/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Join request rejected');
      fetchPendingRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_URL}/sessions/${session.session_id}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSession(response.data.session);
      setSuccess('Successfully joined the session!');
      fetchSessionDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(
        `${API_URL}/sessions/${session.session_id}/checkin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Checked in successfully!');
      fetchSessionDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (!window.confirm('Are you sure you want to cancel this session?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.delete(`${API_URL}/sessions/${session.session_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Session cancelled successfully. Redirecting...');
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel session');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (participantUserId) => {
    if (!window.confirm('Are you sure you want to remove this participant?')) {
      return;
    }

    try {
      await axios.post(
        `${API_URL}/sessions/${session.session_id}/remove-participant`,
        { participant_id: participantUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Participant removed successfully');
      fetchSessionDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove participant');
    }
  };

  if (!session) {
    return <div className="loading">Loading session details...</div>;
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
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
    
    if (diffMins < 0) return 'Session has started';
    if (diffMins < 60) return `Starts in ${diffMins} minutes`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `Starts in ${hours}h ${mins}m`;
  };

  const isCreator = session.creator_id === user.user_id;
  const isParticipant = session.participants.includes(user.user_id);
  const isFull = session.participants.length >= session.max_participants;
  const canJoin = !isParticipant && !isFull && session.status === 'active';
  const canCheckIn = isParticipant && session.status === 'active';
  
  const currentParticipant = participants.find(p => p.user_id === user.user_id);
  const isCheckedIn = currentParticipant?.checked_in || false;

  return (
    <div className="session-details-container">
      <div className="session-details-header">
        <button onClick={onBack} className="back-btn">← Back to Sessions</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="session-details-content">
        <div className="session-main-info">
          <div className="session-title-section">
            <h1>{session.subject}</h1>
            <div className="status-badges">
              <span className={`status-badge status-${session.status}`}>
                {session.status.replace('_', ' ').toUpperCase()}
              </span>
              {isCreator && <span className="creator-badge">YOU'RE THE HOST</span>}
              {isParticipant && !isCreator && <span className="participant-badge">JOINED</span>}
            </div>
          </div>

          <h2 className="session-topic">{session.topic}</h2>

          <div className="session-info-grid">
            <div className="info-card">
              <div className="info-icon">📍</div>
              <div className="info-content">
                <h4>Location</h4>
                <p>{session.location.venue_name}</p>
                {session.location.meeting_spot && (
                  <p className="meeting-spot">📌 {session.location.meeting_spot}</p>
                )}
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">⏰</div>
              <div className="info-content">
                <h4>Start Time</h4>
                <p>{formatDateTime(session.start_time)}</p>
                <p className="time-until">{getTimeUntilStart(session.start_time)}</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">⏱️</div>
              <div className="info-content">
                <h4>Duration</h4>
                <p>{session.duration} minutes</p>
                <p className="end-time">
                  Ends at {new Date(new Date(session.start_time).getTime() + session.duration * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">👥</div>
              <div className="info-content">
                <h4>Participants</h4>
                <p>{session.participants.length} / {session.max_participants}</p>
                {isFull && <p className="full-text">Session is full!</p>}
              </div>
            </div>
          </div>

          <div className="action-buttons">
            {canJoin && (
              <button 
                onClick={handleJoinSession} 
                className="join-btn"
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Join This Session'}
              </button>
            )}

            {canCheckIn && !isCheckedIn && (
              <button 
                onClick={handleCheckIn} 
                className="checkin-btn"
                disabled={loading}
              >
                {loading ? 'Checking in...' : 'Check In'}
              </button>
            )}

            {isCheckedIn && (
              <div className="checked-in-badge">✅ You're checked in!</div>
            )}

            {isCreator && session.status === 'active' && (
              <button 
                onClick={handleCancelSession} 
                className="cancel-btn"
                disabled={loading}
              >
                {loading ? 'Cancelling...' : 'Cancel Session'}
              </button>
            )}
          </div>
        </div>

        <div className="participants-section">
          <h3>Participants ({participants.length})</h3>
          <div className="participants-list">
            {participants.length === 0 ? (
              <p className="no-participants">No participants yet</p>
            ) : (
              participants.map(participant => (
                <div key={participant.user_id} className="participant-item">
                  <div className="participant-info">
                    <div className="participant-avatar">
                      {participant.is_session_admin ? '👑' : '👤'}
                    </div>
                    <div className="participant-details">
                      <p className="participant-name">
                        User #{participant.user_id}
                        {participant.is_session_admin && <span className="admin-tag">HOST</span>}
                        {participant.user_id === user.user_id && <span className="you-tag">YOU</span>}
                      </p>
                      <p className="participant-meta">
                        Joined {new Date(participant.joined_at).toLocaleDateString()}
                        {participant.checked_in && ' • ✅ Checked In'}
                      </p>
                    </div>
                  </div>
                  {isCreator && participant.user_id !== user.user_id && (
                    <button
                      onClick={() => handleRemoveParticipant(participant.user_id)}
                      className="remove-participant-btn"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionDetails;