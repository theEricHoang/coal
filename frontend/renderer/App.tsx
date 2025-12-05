import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


import SignIn from './components/Auth/Signin';
import SignUp from './components/Auth/SignUp';
import LibraryView from './components/Library/LibraryView';
import StoreView from './components/Store/StoreView';
import Navbar from './components/Layout/Navbar';


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
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
          path="/store" 
          element={
            isAuthenticated ? <StoreView /> : <Navigate to="/signin" />
          } 
        />
        <Route path="/" element={<Navigate to="/library" />} />
      </Routes>
    </Router>
  );
};

export default App;

