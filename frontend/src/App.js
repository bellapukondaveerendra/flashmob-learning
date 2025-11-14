import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login.js';
import Register from './components/Register.js';
import Dashboard from './components/Dashboard.js';
import CreateSession from './components/CreateSession.js';
import SessionList from './components/SessionList.js';
import SessionDetails from './components/SessionDetails.js';
import UserProfile from './components/UserProfile.js';
import AdminDashboard from './components/AdminDashboard.js';
import Notifications from './components/Notifications.js';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setCurrentView('dashboard');
    }
  }, []);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentView('login');
  };

  const handleViewChange = (view, data = null) => {
    setCurrentView(view);
    if (data) {
      setSelectedSession(data);
    }
  };

  const renderView = () => {
    if (!token) {
      switch (currentView) {
        case 'register':
          return <Register onRegister={handleLogin} onSwitchToLogin={() => setCurrentView('login')} />;
        default:
          return <Login onLogin={handleLogin} onSwitchToRegister={() => setCurrentView('register')} />;
      }
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={user} token={token} onViewChange={handleViewChange} />;
      case 'create-session':
        return <CreateSession user={user} token={token} onBack={() => setCurrentView('dashboard')} />;
      case 'sessions':
        return <SessionList user={user} token={token} onViewSession={(session) => handleViewChange('session-details', session)} onBack={() => setCurrentView('dashboard')} />;
      case 'session-details':
        return <SessionDetails session={selectedSession} user={user} token={token} onBack={() => setCurrentView('sessions')} />;
      case 'profile':
        return <UserProfile user={user} token={token} onBack={() => setCurrentView('dashboard')} onUpdateUser={setUser} />;
      case 'admin':
        return <AdminDashboard user={user} token={token} onBack={() => setCurrentView('dashboard')} />;
      default:
        return <Dashboard user={user} token={token} onViewChange={handleViewChange} />;
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>⚡ FlashMob Learning</h1>
          {token && (
            <div className="header-actions">
              <span className="user-greeting">Hello, {user?.name}!</span>
              <button onClick={() => setCurrentView('dashboard')} className="nav-btn">Dashboard</button>
              <button onClick={() => setCurrentView('profile')} className="nav-btn">Profile</button>
              {user?.is_admin && (
                <button onClick={() => setCurrentView('admin')} className="nav-btn">Admin</button>
              )}
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          )}
        </div>
      </header>
      <main className="app-main">
        {renderView()}
      </main>
    </div>
  );
}

export default App;