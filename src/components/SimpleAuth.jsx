import React, { useState } from 'react';
import './SimpleAuth.css';

const SimpleAuth = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // The secret password to access the app
  const CORRECT_PASSWORD = 'markgoat'; // Change this to your desired password

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (password === CORRECT_PASSWORD) {
      // Create a simple user object
      const user = {
        isAuthenticated: true,
        loginTime: new Date().toISOString()
      };
      onLogin(user);
      localStorage.setItem('motionAppAuth', JSON.stringify(user));
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Bridget's Wedge</h1>
        <p>Enter password to access Mark's tasks</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
          <button type="submit">Sign In</button>
        </form>
        
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default SimpleAuth; 