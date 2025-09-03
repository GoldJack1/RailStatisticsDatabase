import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { collection, addDoc, GeoPoint } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';

export default function AddStation() {
  const [formData, setFormData] = useState({
    stationName: '',
    crsCode: '',
    stnCrsId: '',
    country: '',
    county: '',
    tiploc: '',
    toc: '',
    source: '',
    latitude: '',
    longitude: '',
    yearlyPassengers: {}
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [newPassengerYear, setNewPassengerYear] = useState('');
  const [newPassengerCount, setNewPassengerCount] = useState('');
  const navigate = useNavigate();
  const { } = useAuth();

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

  function addPassengerData() {
    if (!newPassengerYear || !newPassengerCount) return;
    
    setFormData(prev => ({
      ...prev,
      yearlyPassengers: {
        ...prev.yearlyPassengers,
        [newPassengerYear]: parseInt(newPassengerCount)
      }
    }));
    
    setNewPassengerYear('');
    setNewPassengerCount('');
  }

  function removePassengerData(year) {
    setFormData(prev => {
      const newYearlyPassengers = { ...prev.yearlyPassengers };
      delete newYearlyPassengers[year];
      return {
        ...prev,
        yearlyPassengers: newYearlyPassengers
      };
    });
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
        stnCrsId: formData.stnCrsId.trim() || formData.crsCode.trim().toUpperCase(),
        country: formData.country.trim(),
        county: formData.county.trim(),
        tiploc: formData.tiploc.trim(),
        toc: formData.toc.trim(),
        source: formData.source.trim(),
        yearlyPassengers: formData.yearlyPassengers,
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

  return (
    <>
      <Header />

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

                  <Form.Group className="mb-3">
                    <Form.Label>Station CRS ID</Form.Label>
                    <Form.Control
                      type="text"
                      name="stnCrsId"
                      value={formData.stnCrsId}
                      onChange={handleChange}
                      placeholder="e.g., AAP (defaults to CRS code if empty)"
                    />
                    <Form.Text className="text-muted">
                      Alternative station identifier
                    </Form.Text>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Country</Form.Label>
                        <Form.Control
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          placeholder="e.g., England"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>County</Form.Label>
                        <Form.Control
                          type="text"
                          name="county"
                          value={formData.county}
                          onChange={handleChange}
                          placeholder="e.g., London (City Of)"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>TIPLOC</Form.Label>
                        <Form.Control
                          type="text"
                          name="tiploc"
                          value={formData.tiploc}
                          onChange={handleChange}
                          placeholder="e.g., ALEXNDP"
                        />
                        <Form.Text className="text-muted">
                          Timing Point Location Code
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>TOC</Form.Label>
                        <Form.Control
                          type="text"
                          name="toc"
                          value={formData.toc}
                          onChange={handleChange}
                          placeholder="e.g., GTR"
                        />
                        <Form.Text className="text-muted">
                          Train Operating Company
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Data Source</Form.Label>
                    <Form.Control
                      type="text"
                      name="source"
                      value={formData.source}
                      onChange={handleChange}
                      placeholder="e.g., NEWSTNARRAY.csv"
                    />
                    <Form.Text className="text-muted">
                      Original data source file or system
                    </Form.Text>
                  </Form.Group>

                  <Card className="mb-3">
                    <Card.Header>
                      <h6 className="mb-0">Yearly Passenger Numbers</h6>
                    </Card.Header>
                    <Card.Body>
                      {Object.keys(formData.yearlyPassengers).length > 0 && (
                        <div className="mb-3">
                          {Object.entries(formData.yearlyPassengers).map(([year, passengers]) => (
                            <div key={year} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                              <div>
                                <strong>{year}:</strong> {passengers ? passengers.toLocaleString() : 'N/A'} passengers
                              </div>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => removePassengerData(year)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <Row>
                        <Col md={4}>
                          <Form.Control
                            type="number"
                            placeholder="Year (e.g., 1998)"
                            value={newPassengerYear}
                            onChange={(e) => setNewPassengerYear(e.target.value)}
                            min="1900"
                            max="2030"
                          />
                        </Col>
                        <Col md={6}>
                          <Form.Control
                            type="number"
                            placeholder="Passenger count"
                            value={newPassengerCount}
                            onChange={(e) => setNewPassengerCount(e.target.value)}
                            min="0"
                          />
                        </Col>
                        <Col md={2}>
                          <Button
                            variant="outline-primary"
                            onClick={addPassengerData}
                            disabled={!newPassengerYear || !newPassengerCount}
                            className="w-100"
                          >
                            Add
                          </Button>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

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
