import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { collection, getDocs, connectFirestoreEmulator } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function FirebaseDebug() {
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const runDiagnostics = async () => {
    setLoading(true);
    const info = {};

    try {
      // Check Firebase config
      info.firebaseConfig = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
      };

      // Check authentication
      info.authentication = {
        isLoggedIn: currentUser ? '✅ Yes' : '❌ No',
        userEmail: currentUser?.email || 'Not logged in',
        uid: currentUser?.uid || 'N/A'
      };

      // Check Firestore connection
      try {
        const stationsRef = collection(db, 'stations');
        const snapshot = await getDocs(stationsRef);
        info.firestore = {
          connected: '✅ Connected',
          stationsCollection: '✅ Accessible',
          stationCount: snapshot.size,
          sampleStations: snapshot.docs.slice(0, 3).map(doc => ({
            id: doc.id,
            name: doc.data().stationName || 'No name',
            crs: doc.data().crsCode || 'No CRS'
          }))
        };
      } catch (firestoreError) {
        info.firestore = {
          connected: '❌ Error',
          error: firestoreError.message,
          code: firestoreError.code
        };
      }

      // Check database URL and project
      info.project = {
        projectId: db.app.options.projectId,
        databaseURL: db.app.options.databaseURL || 'Not set'
      };

    } catch (error) {
      info.generalError = error.message;
    }

    setDebugInfo(info);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, [currentUser]);

  return (
    <Container className="py-4">
      <Card>
        <Card.Header>
          <h5>🔧 Firebase Debug Information</h5>
        </Card.Header>
        <Card.Body>
          <Button onClick={runDiagnostics} disabled={loading} className="mb-3">
            {loading ? 'Running Diagnostics...' : '🔄 Refresh Diagnostics'}
          </Button>

          {debugInfo.firebaseConfig && (
            <Alert variant="info">
              <h6>📋 Environment Variables</h6>
              <ul>
                <li>API Key: {debugInfo.firebaseConfig.apiKey}</li>
                <li>Auth Domain: {debugInfo.firebaseConfig.authDomain}</li>
                <li>Project ID: {debugInfo.firebaseConfig.projectId}</li>
                <li>Storage Bucket: {debugInfo.firebaseConfig.storageBucket}</li>
              </ul>
            </Alert>
          )}

          {debugInfo.authentication && (
            <Alert variant={currentUser ? "success" : "warning"}>
              <h6>🔐 Authentication Status</h6>
              <ul>
                <li>Logged In: {debugInfo.authentication.isLoggedIn}</li>
                <li>Email: {debugInfo.authentication.userEmail}</li>
                <li>UID: {debugInfo.authentication.uid}</li>
              </ul>
            </Alert>
          )}

          {debugInfo.project && (
            <Alert variant="info">
              <h6>🏗️ Project Configuration</h6>
              <ul>
                <li>Project ID: {debugInfo.project.projectId}</li>
                <li>Database URL: {debugInfo.project.databaseURL}</li>
              </ul>
            </Alert>
          )}

          {debugInfo.firestore && (
            <Alert variant={debugInfo.firestore.connected === '✅ Connected' ? "success" : "danger"}>
              <h6>🗄️ Firestore Database</h6>
              <ul>
                <li>Connection: {debugInfo.firestore.connected}</li>
                <li>Stations Collection: {debugInfo.firestore.stationsCollection}</li>
                {debugInfo.firestore.stationCount !== undefined && (
                  <li>Station Count: {debugInfo.firestore.stationCount}</li>
                )}
                {debugInfo.firestore.error && (
                  <li>Error: {debugInfo.firestore.error}</li>
                )}
                {debugInfo.firestore.code && (
                  <li>Error Code: {debugInfo.firestore.code}</li>
                )}
              </ul>

              {debugInfo.firestore.sampleStations && (
                <div>
                  <strong>Sample Stations:</strong>
                  <ul>
                    {debugInfo.firestore.sampleStations.map((station, idx) => (
                      <li key={idx}>{station.crs}: {station.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Alert>
          )}

          {debugInfo.generalError && (
            <Alert variant="danger">
              <h6>❌ General Error</h6>
              <p>{debugInfo.generalError}</p>
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
