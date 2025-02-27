import React, { useState, useEffect } from 'react';
import KanbanBoard from './components/KanbanBoard';
import SimpleAuth from './components/SimpleAuth';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  
  // Check if user is already authenticated
  useEffect(() => {
    const savedAuth = localStorage.getItem('motionAppAuth');
    if (savedAuth) {
      try {
        setUser(JSON.parse(savedAuth));
      } catch (e) {
        localStorage.removeItem('motionAppAuth');
      }
    }
  }, []);
  
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('motionAppAuth');
  };
  
  return (
    <div className="app">
      {user ? (
        <KanbanBoard onLogout={handleLogout} />
      ) : (
        <SimpleAuth onLogin={setUser} />
      )}
    </div>
  );
}

export default App; 