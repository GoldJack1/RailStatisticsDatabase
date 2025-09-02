import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Navbar, Nav } from 'react-bootstrap';
import { collection, addDoc, GeoPoint } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function AddStation() {
  const [formData, setFormData] = useState({
    stationName: '',
    crsCode: '',
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

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
      setLoading(true);
      
      const stationData = {
        stationName: formData.stationName.trim(),
        crsCode: formData.crsCode.trim().toUpperCase(),
        uploadedAt: new Date().toISOString()
      };

      // Add location if coordinates are provided
      if (formData.latitude && formData.longitude) {
        stationData.location = new GeoPoint(
          parseFloat(formData.latitude),
          parseFloat(formData.longitude)
        );
      }

      await addDoc(collection(db, 'stations'), stationData);
      
      toast.success('Station added successfully!');
      navigate('/stations');
      
    } catch (error) {
      toast.error('Failed to add station: ' + error.message);
    } finally {
      setLoading(false);
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
              <h1>➕ Add New Station</h1>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/stations')}
              >
                ← Back to Stations
              </Button>
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={8} lg={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Station Information</h5>
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
                      onChange={handleChange}
                      isInvalid={!!errors.crsCode}
                      placeholder="e.g., PAD"
                      maxLength={3}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.crsCode}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      3-letter station code
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
                      disabled={loading}
                    >
                      {loading ? 'Adding Station...' : '➕ Add Station'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline-secondary"
                      onClick={() => navigate('/stations')}
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
                <h6 className="mb-0">ℹ️ Help</h6>
              </Card.Header>
              <Card.Body>
                <h6>Required Fields:</h6>
                <ul className="small">
                  <li><strong>Station Name:</strong> Full official name</li>
                  <li><strong>CRS Code:</strong> 3-letter station code</li>
                </ul>
                
                <h6>Optional Fields:</h6>
                <ul className="small">
                  <li><strong>Coordinates:</strong> Latitude and longitude</li>
                </ul>
                
                <Alert variant="info" className="mt-3">
                  <strong>Tip:</strong> Coordinates will be stored as GeoPoint for better geospatial queries.
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
