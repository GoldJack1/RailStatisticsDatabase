import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Table, Alert, Spinner, Badge, Navbar, Nav } from 'react-bootstrap';
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function AllStations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const stationsPerPage = 20;

  useEffect(() => {
    loadStations();
  }, []);

  async function loadStations() {
    try {
      setLoading(true);
      
      let q = query(
        collection(db, 'stations'),
        orderBy('stationName'),
        limit(stationsPerPage)
      );

      if (lastDoc) {
        q = query(
          collection(db, 'stations'),
          orderBy('stationName'),
          startAfter(lastDoc),
          limit(stationsPerPage)
        );
      }

      const snapshot = await getDocs(q);
      const newStations = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        newStations.push({
          id: doc.id,
          ...data
        });
      });

      if (lastDoc) {
        setStations(prev => [...prev, ...newStations]);
      } else {
        setStations(newStations);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === stationsPerPage);
      
    } catch (error) {
      toast.error('Failed to load stations: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    // For now, just filter existing stations
    // In a real app, you'd implement server-side search
  }

  function filteredStations() {
    if (!searchTerm) return stations;
    
    return stations.filter(station => 
      station.stationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.crsCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  function loadMore() {
    if (hasMore && !loading) {
      loadStations();
    }
  }

  function viewStation(crsCode) {
    navigate(`/station/${crsCode}`);
  }

  function editStation(crsCode) {
    navigate(`/edit-station/${crsCode}`);
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
              <h1>🚂 All Stations</h1>
              <Button variant="primary" onClick={() => navigate('/add-station')}>
                ➕ Add New Station
              </Button>
            </div>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Body>
                <Form onSubmit={handleSearch}>
                  <Row>
                    <Col md={8}>
                      <Form.Control
                        type="text"
                        placeholder="Search by station name or CRS code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </Col>
                    <Col md={4}>
                      <Button type="submit" variant="outline-primary" className="w-100">
                        🔍 Search
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col>
            <Card>
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Stations ({filteredStations().length})</h5>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                  >
                    ← Back to Dashboard
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {loading && stations.length === 0 ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="mt-2">Loading stations...</p>
                  </div>
                ) : filteredStations().length === 0 ? (
                  <Alert variant="info">
                    No stations found. {searchTerm && 'Try adjusting your search terms.'}
                  </Alert>
                ) : (
                  <>
                    <Table responsive striped hover>
                      <thead>
                        <tr>
                          <th>Station Name</th>
                          <th>CRS Code</th>
                          <th>Location</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStations().map((station) => (
                          <tr key={station.id}>
                            <td>
                              <strong>{station.stationName}</strong>
                            </td>
                            <td>
                              <Badge bg="secondary">{station.crsCode}</Badge>
                            </td>
                            <td>
                              {station.location ? (
                                <small>
                                  {station.location.latitude?.toFixed(4)}, {station.location.longitude?.toFixed(4)}
                                </small>
                              ) : (
                                <small className="text-muted">No coordinates</small>
                              )}
                            </td>
                            <td>
                              <Button 
                                size="sm" 
                                variant="outline-primary" 
                                className="me-2"
                                onClick={() => viewStation(station.crsCode)}
                              >
                                👁️ View
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline-warning"
                                onClick={() => editStation(station.crsCode)}
                              >
                                ✏️ Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    {hasMore && (
                      <div className="text-center mt-3">
                        <Button 
                          variant="outline-primary" 
                          onClick={loadMore}
                          disabled={loading}
                        >
                          {loading ? 'Loading...' : 'Load More Stations'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
