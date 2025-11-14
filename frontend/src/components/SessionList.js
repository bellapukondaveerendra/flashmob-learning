import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../SessionList.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SessionList({ user, token, onViewSession, onBack }) {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    status: 'active',
    sortBy: 'start_time'
  });
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    getUserLocation();
    fetchAllSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, filters]);

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

  const fetchAllSessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/sessions/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data.sessions);
    } catch (err) {
      setError('Failed to load sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...sessions];

    // Filter by subject
    if (filters.subject) {
      result = result.filter(s => s.subject === filters.subject);
    }

    // Filter by status
    if (filters.status) {
      result = result.filter(s => s.status === filters.status);
    }

    // Sort
    result.sort((a, b) => {
      if (filters.sortBy === 'start_time') {
        return new Date(a.start_time) - new Date(b.start_time);
      } else if (filters.sortBy === 'participants') {
        return b.participants.length - a.participants.length;
      }
      return 0;
    });

    setFilteredSessions(result);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
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
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'Active', class: 'status-active' },
      in_progress: { text: 'In Progress', class: 'status-progress' },
      completed: { text: 'Completed', class: 'status-completed' },
      cancelled: { text: 'Cancelled', class: 'status-cancelled' }
    };
    return badges[status] || badges.active;
  };

  const uniqueSubjects = [...new Set(sessions.map(s => s.subject))];

  return (
    <div className="session-list-container">
      <div className="session-list-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>Browse Study Sessions</h2>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="subject">Subject</label>
          <select
            id="subject"
            name="subject"
            value={filters.subject}
            onChange={handleFilterChange}
          >
            <option value="">All Subjects</option>
            {uniqueSubjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sortBy">Sort By</label>
          <select
            id="sortBy"
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
          >
            <option value="start_time">Start Time</option>
            <option value="participants">Participants</option>
          </select>
        </div>

        <button onClick={fetchAllSessions} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading sessions...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="empty-state">
          <p>No sessions found matching your filters.</p>
          <p>Try adjusting your filter settings.</p>
        </div>
      ) : (
        <div className="session-list-content">
          <div className="results-count">
            Found {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
          </div>
          
          <div className="sessions-list">
            {filteredSessions.map(session => {
              const statusBadge = getStatusBadge(session.status);
              const isFull = session.participants.length >= session.max_participants;
              const isParticipant = session.participants.includes(user.user_id);

              return (
                <div 
                  key={session.session_id} 
                  className="session-list-item"
                  onClick={() => onViewSession(session)}
                >
                  <div className="session-item-header">
                    <div className="session-item-left">
                      <h3>{session.subject}</h3>
                      <p className="session-item-topic">{session.topic}</p>
                    </div>
                    <div className="session-item-right">
                      <span className={`status-badge ${statusBadge.class}`}>
                        {statusBadge.text}
                      </span>
                      {session.status === 'active' && (
                        <span className="time-badge">{getTimeUntilStart(session.start_time)}</span>
                      )}
                    </div>
                  </div>

                  <div className="session-item-details">
                    <div className="detail-row">
                      <span className="detail-icon">📍</span>
                      <span>{session.location.venue_name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-icon">⏰</span>
                      <span>{formatDateTime(session.start_time)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-icon">⏱️</span>
                      <span>{session.duration} minutes</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-icon">👥</span>
                      <span>
                        {session.participants.length}/{session.max_participants} participants
                        {isFull && <span className="full-badge">FULL</span>}
                        {isParticipant && <span className="joined-badge">JOINED</span>}
                      </span>
                    </div>
                  </div>

                  <div className="session-item-footer">
                    <button className="view-details-btn">View Details →</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionList;