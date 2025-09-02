import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Navbar, Nav } from 'react-bootstrap';
import { collection, getDocs, query, where, doc, updateDoc, GeoPoint } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function EditStation() {
  const { crsCode } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [station, setStation] = useState(null);
  const [formData, setFormData] = useState({
    stationName: '',
    crsCode: '',
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (crsCode) {
      loadStation();
    }
  }, [crsCode]);

  async function loadStation() {
    try {
      setLoading(true);
      
      const q = query(
        collection(db, 'stations'),
        where('crsCode', '==', crsCode.toUpperCase())
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast.error('Station not found');
        navigate('/stations');
        return;
      }
      
      const stationData = snapshot.docs[0].data();
      const stationId = snapshot.docs[0].id;
      
      setStation({
        id: stationId,
        ...stationData
      });
      
      // Populate form with existing data
      setFormData({
        stationName: stationData.stationName || '',
        crsCode: stationData.crsCode || '',
        latitude: stationData.location?.latitude?.toString() || '',
        longitude: stationData.location?.longitude?.toString() || ''
      });
      
    } catch (error) {
      toast.error('Failed to load station: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }

  function validateForm() {
    const newErrors = {};
    
    if (!formData.stationName.trim()) {
      newErrors.stationName = 'Station name is required';
    }
    
    if (!formData.crsCode.trim()) {
      newErrors.crsCode = 'CRS code is required';
    } else if (formData.crsCode.length !== 3) {
      newErrors.crsCode = 'CRS code must be exactly 3 characters';
    }
    
    if (formData.latitude && (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'Latitude must be a number between -90 and 90';
    }
    
    if (formData.longitude && (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'Longitude must be a number between -180 and 180';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        stationName: formData.stationName.trim(),
        updatedAt: new Date().toISOString()
      };

      // Add location if coordinates are provided
      if (formData.latitude && formData.longitude) {
        updateData.location = new GeoPoint(
          parseFloat(formData.latitude),
          parseFloat(formData.longitude)
        );
      } else {
        updateData.location = null;
      }

      await updateDoc(doc(db, 'stations', station.id), updateData);
      
      toast.success('Station updated successfully!');
      navigate(`/station/${station.crsCode}`);
      
    } catch (error) {
      toast.error('Failed to update station: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out: ' + error.message);
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading station details...</p>
        </div>
      </Container>
    );
  }

  if (!station) {
    return (
      <Container>
        <Alert variant="warning">
          <h4>Station Not Found</h4>
          <p>No station found with CRS code: {crsCode}</p>
          <Button variant="outline-warning" onClick={() => navigate('/stations')}>
            ← Back to Stations
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand 
            onClick={() => navigate('/dashboard')} 
            style={{ cursor: 'pointer' }}
            className="d-flex align-items-center"
          >
            🚂 Rail Statistics Database
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link onClick={() => navigate('/stations')}>All Stations</Nav.Link>
              <Nav.Link onClick={() => navigate('/add-station')}>Add Station</Nav.Link>
              <Nav.Link onClick={() => navigate('/search')}>Search</Nav.Link>
              <Nav.Link onClick={() => navigate('/rrt')}>RRT Management</Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link disabled>
                👤 {currentUser?.email}
              </Nav.Link>
              <Nav.Link onClick={handleLogout}>
                🚪 Logout
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h1>✏️ Edit Station: {station.stationName}</h1>
              <div>
                <Button 
                  variant="outline-primary" 
                  className="me-2"
                  onClick={() => navigate(`/station/${station.crsCode}`)}
                >
                  👁️ View Station
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/stations')}
                >
                  ← Back to Stations
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={8} lg={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Edit Station Information</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Station Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="stationName"
                      value={formData.stationName}
                      onChange={handleChange}
                      isInvalid={!!errors.stationName}
                      placeholder="e.g., London Paddington"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.stationName}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>CRS Code *</Form.Label>
                    <Form.Control
                      type="text"
                      name="crsCode"
                      value={formData.crsCode}
                      disabled
                      className="bg-light"
                    />
                    <Form.Text className="text-muted">
                      CRS code cannot be changed
                    </Form.Text>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Latitude</Form.Label>
                        <Form.Control
                          type="number"
                          name="latitude"
                          value={formData.latitude}
                          onChange={handleChange}
                          isInvalid={!!errors.latitude}
                          placeholder="e.g., 51.5154"
                          step="0.0001"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.latitude}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Longitude</Form.Label>
                        <Form.Control
                          type="number"
                          name="longitude"
                          value={formData.longitude}
                          onChange={handleChange}
                          isInvalid={!!errors.longitude}
                          placeholder="e.g., -0.1755"
                          step="0.0001"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.longitude}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-grid gap-2">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      size="lg"
                      disabled={saving}
                    >
                      {saving ? 'Saving Changes...' : '💾 Save Changes'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline-secondary"
                      onClick={() => navigate(`/station/${station.crsCode}`)}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4} lg={6}>
            <Card>
              <Card.Header>
                <h6 className="mb-0">ℹ️ Edit Information</h6>
              </Card.Header>
              <Card.Body>
                <h6>What You Can Edit:</h6>
                <ul className="small">
                  <li><strong>Station Name:</strong> Update the official name</li>
                  <li><strong>Coordinates:</strong> Update latitude/longitude</li>
                </ul>
                
                <h6>What You Cannot Edit:</h6>
                <ul className="small">
                  <li><strong>CRS Code:</strong> This is a unique identifier</li>
                  <li><strong>Document ID:</strong> Internal Firebase ID</li>
                </ul>
                
                <Alert variant="info" className="mt-3">
                  <strong>Note:</strong> Changes are saved immediately to Firebase.
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
