import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


import SignIn from './components/Auth/Signin';
import SignUp from './components/Auth/SignUp';
import LibraryView from './components/Library/LibraryView';
import PublishView from './components/Publish/PublishView';
import StoreView from './components/Store/StoreView';
import Navbar from './components/Layout/Navbar';


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('role') || '';
    setIsAuthenticated(!!token);
    setUserRole(role);
  }, []);

  
  const getDefaultRoute = () => {
    return userRole === 'studio' ? '/publish' : '/library';
  };

  return (
    <Router>
      
      {isAuthenticated && <Navbar onLogout={() => setIsAuthenticated(false)} />}
      <Routes>
        <Route 
          path="/signin" 
          element={
            isAuthenticated ? <Navigate to={getDefaultRoute()} /> : <SignIn onSignIn={() => setIsAuthenticated(true)} />
          } 
        />
        <Route 
          path="/signup" 
          element={
            isAuthenticated ? <Navigate to={getDefaultRoute()} /> : <SignUp />
          } 
        />
        <Route 
          path="/library" 
          element={
            isAuthenticated ? <LibraryView /> : <Navigate to="/signin" />
          } 
        />
        <Route 
          path="/publish" 
          element={
            isAuthenticated ? <PublishView /> : <Navigate to="/signin" />
          } 
        />
        <Route 
          path="/store" 
          element={
            isAuthenticated ? <StoreView /> : <Navigate to="/signin" />
          } 
        />
        <Route path="/" element={<Navigate to={getDefaultRoute()} />} />
      </Routes>
    </Router>
  );
};

export default App;

