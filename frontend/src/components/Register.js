import React, { useState } from 'react';
import axios from 'axios';
import '../Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'Engineering', 'Literature', 'History',
  'Economics', 'Psychology', 'Languages', 'Art'
];

function Register({ onRegister, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    subjects: [],
    max_distance: 10
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove all non-digits
    
    // Limit to 10 digits
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    
    // Format as 000-000-0000
    let formattedPhone = value;
    if (value.length > 3 && value.length <= 6) {
      formattedPhone = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else if (value.length > 6) {
      formattedPhone = `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6)}`;
    }
    
    setFormData({
      ...formData,
      phone: formattedPhone
    });
    setError('');
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Phone number validation (must be exactly 10 digits when formatted)
    const digitsOnly = formData.phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!formData.address.trim()) {
      setError('Please enter your address');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: `+1${digitsOnly}`,
        address: formData.address,
        password: formData.password,
        preferences: {
          subjects: formData.subjects,
          max_distance: formData.max_distance,
          favorite_venues: []
        }
      };

      const response = await axios.post(`${API_URL}/auth/register`, payload);
      onRegister(response.data.user, response.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h2>Join FlashMob Learning</h2>
        <p className="auth-subtitle">Connect with students and study together</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@university.edu"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ 
                padding: '0.9rem', 
                background: '#f0f0f0', 
                borderRadius: '8px',
                fontWeight: '600',
                color: '#666'
              }}>+1</span>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                required
                placeholder="000-000-0000"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="City, State (e.g., Kansas City, KS)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="At least 6 characters"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Repeat your password"
            />
          </div>

          <div className="form-group">
            <label>Subjects of Interest</label>
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

          <div className="form-group">
            <label htmlFor="max_distance">
              Maximum Distance for Venues: {formData.max_distance} miles
            </label>
            <input
              type="range"
              id="max_distance"
              name="max_distance"
              min="5"
              max="50"
              value={formData.max_distance}
              onChange={handleChange}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666', marginTop: '0.3rem' }}>
              <span>5 miles</span>
              <span>50 miles</span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="link-button">
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;