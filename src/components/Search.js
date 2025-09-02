import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Table, Alert, Spinner, Badge, Navbar, Nav } from 'react-bootstrap';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  async function handleSearch(e) {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      
      // Search by CRS code first (exact match)
      let q = query(
        collection(db, 'stations'),
        where('crsCode', '==', searchTerm.trim().toUpperCase())
      );
      
      let snapshot = await getDocs(q);
      let results = [];
      
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });

      // If no exact CRS match, search by station name (contains)
      if (results.length === 0) {
        q = query(
          collection(db, 'stations'),
          orderBy('stationName')
        );
        
        snapshot = await getDocs(q);
        
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.stationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              data.stationNameAlt?.toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({ id: doc.id, ...data });
          }
        });
      }

      setSearchResults(results);
      
      if (results.length === 0) {
        toast.info('No stations found matching your search');
      } else {
        toast.success(`Found ${results.length} station(s)`);
      }
      
    } catch (error) {
      toast.error('Search failed: ' + error.message);
    } finally {
      setLoading(false);
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
              <h1>🔍 Search Stations</h1>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/dashboard')}
              >
                ← Back to Dashboard
              </Button>
            </div>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={8} lg={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Search Options</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSearch}>
                  <Form.Group className="mb-3">
                    <Form.Label>Search Term</Form.Label>
                    <Form.Control
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Enter station name or CRS code..."
                      disabled={loading}
                    />
                    <Form.Text className="text-muted">
                      Search by station name or 3-letter CRS code
                    </Form.Text>
                  </Form.Group>
                  
                  <div className="d-grid">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={loading || !searchTerm.trim()}
                    >
                      {loading ? 'Searching...' : '🔍 Search'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4} lg={6}>
            <Card>
              <Card.Header>
                <h6 className="mb-0">ℹ️ Search Tips</h6>
              </Card.Header>
              <Card.Body>
                <ul className="small">
                  <li><strong>CRS Code:</strong> Use exact 3-letter codes (e.g., PAD, EUS)</li>
                  <li><strong>Station Name:</strong> Partial names work (e.g., "Paddington", "London")</li>
                  <li><strong>Case Insensitive:</strong> Search works regardless of capitalization</li>
                </ul>
                
                <Alert variant="info" className="mt-3">
                  <strong>Tip:</strong> CRS codes give exact matches, station names give partial matches.
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {hasSearched && (
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    Search Results ({searchResults.length})
                    {searchTerm && (
                      <span className="text-muted ms-2">
                        for "{searchTerm}"
                      </span>
                    )}
                  </h5>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" role="status">
                        <span className="visually-hidden">Searching...</span>
                      </Spinner>
                      <p className="mt-2">Searching stations...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <Alert variant="info">
                      No stations found matching "{searchTerm}". Try a different search term.
                    </Alert>
                  ) : (
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
                        {searchResults.map((station) => (
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
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </>
  );
}
