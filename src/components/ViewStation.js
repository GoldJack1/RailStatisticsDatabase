import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';

export default function ViewStation() {
  const { crsCode } = useParams();
  const navigate = useNavigate();
  const { } = useAuth();
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStation = useCallback(async function() {
    try {
      setLoading(true);
      setError('');
      
      const q = query(
        collection(db, 'stations'),
        where('crsCode', '==', crsCode.toUpperCase())
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setError('Station not found');
        return;
      }
      
      const stationData = snapshot.docs[0].data();
      setStation({
        id: snapshot.docs[0].id,
        ...stationData
      });
      
    } catch (error) {
      setError('Failed to load station: ' + error.message);
      toast.error('Failed to load station');
    } finally {
      setLoading(false);
    }
  }, [crsCode]);

  useEffect(() => {
    if (crsCode) {
      loadStation();
    }
  }, [crsCode, loadStation]);



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

  if (error) {
    return (
      <Container>
        <Alert variant="danger">
          <h4>Error</h4>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate('/stations')}>
            ← Back to Stations
          </Button>
        </Alert>
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
      <Header />

      <Container>
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h1>🚂 {station.stationName}</h1>
              <div>
                <Button 
                  variant="outline-warning" 
                  className="me-2"
                  onClick={() => navigate(`/edit-station/${station.crsCode}`)}
                >
                  ✏️ Edit Station
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
          <Col md={8}>
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Station Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p><strong>Station Name:</strong></p>
                    <p className="mb-3">{station.stationName}</p>
                    
                    <p><strong>CRS Code:</strong></p>
                    <p className="mb-3">
                      <Badge bg="primary" className="fs-6">{station.crsCode}</Badge>
                      {station.stnCrsId && station.stnCrsId !== station.crsCode && (
                        <div className="mt-1">
                          <small className="text-muted">Station CRS ID: </small>
                          <Badge bg="secondary">{station.stnCrsId}</Badge>
                        </div>
                      )}
                    </p>

                    <p><strong>TIPLOC:</strong></p>
                    <p className="mb-3">
                      {station.tiploc ? (
                        <Badge bg="info">{station.tiploc}</Badge>
                      ) : (
                        <span className="text-muted">Not available</span>
                      )}
                    </p>

                    <p><strong>Train Operating Company (TOC):</strong></p>
                    <p className="mb-3">
                      {station.toc ? (
                        <Badge bg="success">{station.toc}</Badge>
                      ) : (
                        <span className="text-muted">Not available</span>
                      )}
                    </p>
                  </Col>
                  
                  <Col md={6}>
                    <p><strong>Country:</strong></p>
                    <p className="mb-3">{station.country || <span className="text-muted">Not specified</span>}</p>

                    <p><strong>County:</strong></p>
                    <p className="mb-3">{station.county || <span className="text-muted">Not specified</span>}</p>

                    {station.location && (
                      <>
                        <p><strong>Coordinates:</strong></p>
                        <p className="mb-3">
                          <small>
                            {station.location.latitude?.toFixed(6)}, {station.location.longitude?.toFixed(6)}
                          </small>
                        </p>
                      </>
                    )}
                    
                    {station.uploadedAt && (
                      <>
                        <p><strong>Added:</strong></p>
                        <p className="mb-3">
                          <small>{new Date(station.uploadedAt).toLocaleDateString()}</small>
                        </p>
                      </>
                    )}

                    {station.source && (
                      <>
                        <p><strong>Data Source:</strong></p>
                        <p className="mb-3">
                          <small className="text-muted">{station.source}</small>
                        </p>
                      </>
                    )}
                  </Col>
                </Row>
                
                {station.yearlyPassengers && (
                  <>
                    <hr />
                    <p><strong>Yearly Passenger Numbers:</strong></p>
                    <Row>
                      {Object.entries(station.yearlyPassengers).map(([year, passengers]) => (
                        <Col md={3} key={year} className="mb-2">
                          <div className="text-center">
                            <Badge bg="info" className="d-block mb-1">{year}</Badge>
                            <div className="fw-bold">
                              {passengers ? passengers.toLocaleString() : 'N/A'}
                            </div>
                            <small className="text-muted">passengers</small>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </>
                )}

                {station.notes && (
                  <>
                    <hr />
                    <p><strong>Notes:</strong></p>
                    <p className="mb-0">{station.notes}</p>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">📍 Location</h6>
              </Card.Header>
              <Card.Body>
                {station.location ? (
                  <div>
                    <p><strong>Latitude:</strong> {station.location.latitude?.toFixed(4)}</p>
                    <p><strong>Longitude:</strong> {station.location.longitude?.toFixed(4)}</p>
                    <Button 
                      variant="outline-info" 
                      size="sm" 
                      className="w-100"
                      onClick={() => {
                        const url = `https://www.google.com/maps?q=${station.location.latitude},${station.location.longitude}`;
                        window.open(url, '_blank');
                      }}
                    >
                      🗺️ View on Google Maps
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted">No coordinates available</p>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h6 className="mb-0">⚡ Quick Actions</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="warning" 
                    onClick={() => navigate(`/edit-station/${station.crsCode}`)}
                  >
                    ✏️ Edit Station
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => navigate('/stations')}
                  >
                    📋 All Stations
                  </Button>
                  <Button 
                    variant="outline-info" 
                    onClick={() => navigate('/search')}
                  >
                    🔍 Search Stations
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
