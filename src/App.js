import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import AllStations from './components/AllStations';
import AddStation from './components/AddStation';
import Search from './components/Search';
import ViewStation from './components/ViewStation';
import EditStation from './components/EditStation';
import RRTDashboard from './components/RRTDashboard';
import RRTList from './components/RRTList';
import RRTForm from './components/RRTForm';
import DynamicRRTForm from './components/DynamicRRTForm';
import RRTImageManager from './components/RRTImageManager';
import ErrorBoundary from './components/ErrorBoundary';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/stations" element={
              <PrivateRoute>
                <AllStations />
              </PrivateRoute>
            } />
            <Route path="/add-station" element={
              <PrivateRoute>
                <AddStation />
              </PrivateRoute>
            } />
            <Route path="/search" element={
              <PrivateRoute>
                <Search />
              </PrivateRoute>
            } />
            <Route path="/station/:crsCode" element={
              <PrivateRoute>
                <ViewStation />
              </PrivateRoute>
            } />
            <Route path="/edit-station/:crsCode" element={
              <PrivateRoute>
                <EditStation />
              </PrivateRoute>
            } />
            <Route path="/rrt" element={
              <PrivateRoute>
                <RRTDashboard />
              </PrivateRoute>
            } />
            <Route path="/rrt/list" element={
              <PrivateRoute>
                <ErrorBoundary>
                  <RRTList />
                </ErrorBoundary>
              </PrivateRoute>
            } />
            <Route path="/rrt-form" element={
              <PrivateRoute>
                <DynamicRRTForm />
              </PrivateRoute>
            } />
            <Route path="/rrt-form/:rrtId" element={
              <PrivateRoute>
                <DynamicRRTForm />
              </PrivateRoute>
            } />
            <Route path="/rrt/images" element={
              <PrivateRoute>
                <ErrorBoundary>
                  <RRTImageManager />
                </ErrorBoundary>
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

