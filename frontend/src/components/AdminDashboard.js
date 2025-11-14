import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../AdminDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AdminDashboard({ user, token, onBack }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [pendingSessions, setPendingSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'sessions') fetchSessions();
    if (activeTab === 'pending') fetchPendingSessions();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (err) {
      setError('Failed to load statistics');
      console.error('Error fetching stats:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
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

  const fetchPendingSessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/sessions/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingSessions(response.data.sessions);
    } catch (err) {
      setError('Failed to load pending sessions');
      console.error('Error fetching pending sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to approve this session?')) {
      return;
    }

    try {
      await axios.post(
        `${API_URL}/admin/sessions/${sessionId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Session approved successfully');
      fetchPendingSessions();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve session');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRejectSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to reject this session?')) {
      return;
    }

    try {
      await axios.post(
        `${API_URL}/admin/sessions/${sessionId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Session rejected');
      fetchPendingSessions();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject session');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSuspendUser = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) {
      return;
    }

    try {
      await axios.post(
        `${API_URL}/admin/users/${userId}/suspend`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('User suspended successfully');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to suspend user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session? This cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/admin/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Session deleted successfully');
      fetchSessions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete session');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>Platform Admin Dashboard</h2>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Pending Approvals
          {stats && stats.pendingSessions > 0 && (
            <span className="badge">{stats.pendingSessions}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          📚 Sessions
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h3>Platform Statistics</h3>
            {stats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalUsers}</div>
                    <div className="stat-label">Total Users</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalSessions}</div>
                    <div className="stat-label">Total Sessions</div>
                  </div>
                </div>
                <div className="stat-card active">
                  <div className="stat-icon">⚡</div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.activeSessions}</div>
                    <div className="stat-label">Active Sessions</div>
                  </div>
                </div>
                <div className="stat-card" style={{ borderColor: stats.pendingSessions > 0 ? '#ff9800' : 'transparent' }}>
                  <div className="stat-icon">⏳</div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.pendingSessions}</div>
                    <div className="stat-label">Pending Approval</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📍</div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalVenues}</div>
                    <div className="stat-label">Venues</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎓</div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalCourses}</div>
                    <div className="stat-label">Courses</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="loading">Loading statistics...</div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="pending-tab">
            <h3>Session Approval Requests</h3>
            {loading ? (
              <div className="loading">Loading pending sessions...</div>
            ) : pendingSessions.length === 0 ? (
              <div className="empty-state">
                <p>No pending session approval requests</p>
              </div>
            ) : (
              <div className="pending-sessions-list">
                {pendingSessions.map(session => (
                  <div key={session.session_id} className="pending-session-card">
                    <div className="session-header">
                      <div className="session-main-info">
                        <h4>{session.subject}</h4>
                        <p className="session-topic">{session.topic}</p>
                      </div>
                      <span className="pending-badge">Pending Approval</span>
                    </div>
                    
                    <div className="session-details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Created by:</span>
                        <span className="detail-value">
                          {session.creator?.name || `User #${session.creator_id}`}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value">{session.location.venue_name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Start Time:</span>
                        <span className="detail-value">{formatDateTime(session.start_time)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Duration:</span>
                        <span className="detail-value">{session.duration} minutes</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Max Participants:</span>
                        <span className="detail-value">{session.max_participants}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Requested:</span>
                        <span className="detail-value">{formatDateTime(session.created_at)}</span>
                      </div>
                    </div>

                    <div className="session-actions">
                      <button
                        onClick={() => handleApproveSession(session.session_id)}
                        className="approve-btn"
                      >
                        ✓ Approve Session
                      </button>
                      <button
                        onClick={() => handleRejectSession(session.session_id)}
                        className="reject-btn"
                      >
                        ✗ Reject Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-tab">
            <h3>User Management</h3>
            {loading ? (
              <div className="loading">Loading users...</div>
            ) : (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Active Sessions</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.user_id}>
                        <td>#{user.user_id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.active_sessions?.length || 0}</td>
                        <td>{formatDateTime(user.created_at)}</td>
                        <td>
                          <button
                            onClick={() => handleSuspendUser(user.user_id)}
                            className="action-btn suspend-btn"
                            disabled={user.suspended}
                          >
                            {user.suspended ? 'Suspended' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="sessions-tab">
            <h3>Session Management</h3>
            {loading ? (
              <div className="loading">Loading sessions...</div>
            ) : (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Session ID</th>
                      <th>Subject</th>
                      <th>Topic</th>
                      <th>Status</th>
                      <th>Participants</th>
                      <th>Start Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(session => (
                      <tr key={session.session_id}>
                        <td>{session.session_id}</td>
                        <td>{session.subject}</td>
                        <td>{session.topic}</td>
                        <td>
                          <span className={`status-badge status-${session.status}`}>
                            {session.status}
                          </span>
                        </td>
                        <td>{session.participants.length}/{session.max_participants}</td>
                        <td>{formatDateTime(session.start_time)}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteSession(session.session_id)}
                            className="action-btn delete-btn"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;