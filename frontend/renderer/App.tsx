import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './components/Auth/SignIn';
import SignUp from './components/Auth/SignUp';
import LibraryView from './components/Library/LibraryView';
import GameUpload from './components/Upload/GameUpload';
import Navbar from './components/Layout/Navbar';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated (check token in localStorage)
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Router>
      {isAuthenticated && <Navbar onLogout={() => setIsAuthenticated(false)} />}
      <Routes>
        <Route 
          path="/signin" 
          element={
            isAuthenticated ? <Navigate to="/library" /> : <SignIn onSignIn={() => setIsAuthenticated(true)} />
          } 
        />
        <Route 
          path="/signup" 
          element={
            isAuthenticated ? <Navigate to="/library" /> : <SignUp />
          } 
        />
        <Route 
          path="/library" 
          element={
            isAuthenticated ? <LibraryView /> : <Navigate to="/signin" />
          } 
        />
        <Route 
          path="/upload" 
          element={
            isAuthenticated ? <GameUpload /> : <Navigate to="/signin" />
          } 
        />
        <Route path="/" element={<Navigate to="/library" />} />
      </Routes>
    </Router>
  );
};

export default App;