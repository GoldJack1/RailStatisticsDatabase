import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import AllStations from './components/AllStations';
import AddStation from './components/AddStation';
import AllOperators from './components/AllOperators';
import AddOperator from './components/AddOperator';
import ViewOperator from './components/ViewOperator';
import EditOperator from './components/EditOperator';
import Search from './components/Search';
import ViewStation from './components/ViewStation';
import EditStation from './components/EditStation';
import RRTDashboard from './components/RRTDashboard';
import RRTList from './components/RRTList';

import DynamicRRTForm from './components/DynamicRRTForm';
import RRTImageManager from './components/RRTImageManager';
import ErrorBoundary from './components/ErrorBoundary';
import FirebaseDebug from './components/FirebaseDebug';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
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
            <Route path="/operators" element={
              <PrivateRoute>
                <AllOperators />
              </PrivateRoute>
            } />
            <Route path="/add-operator" element={
              <PrivateRoute>
                <AddOperator />
              </PrivateRoute>
            } />
            <Route path="/operator/:operatorId" element={
              <PrivateRoute>
                <ViewOperator />
              </PrivateRoute>
            } />
            <Route path="/edit-operator/:operatorId" element={
              <PrivateRoute>
                <EditOperator />
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
            <Route path="/debug" element={
              <PrivateRoute>
                <FirebaseDebug />
              </PrivateRoute>
            } />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

