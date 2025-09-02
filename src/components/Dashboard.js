import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Navbar, Nav, Badge } from 'react-bootstrap';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const [stationCount, setStationCount] = useState(0);
  const [rrtCount, setRrtCount] = useState(0);
  const [recentStations, setRecentStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      
      // Load station data only (simplified)
      const stationCollection = collection(db, 'stations');
      const stationSnapshot = await getDocs(stationCollection);
      setStationCount(stationSnapshot.size);
      
      // Get recent stations
      const recentStationQuery = query(
        collection(db, 'stations'),
        orderBy('uploadedAt', 'desc'),
        limit(3)
      );
      const recentStationSnapshot = await getDocs(recentStationQuery);
      const recentStationData = recentStationSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentStations(recentStationData);
      
      // Set RRT count to 0 for now (we'll add this back later)
      setRrtCount(0);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
      
      // Set default values
      setStationCount(0);
      setRrtCount(0);
      setRecentStations([]);
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

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading dashboard data...</p>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={() => {
              setLoading(false);
              setStationCount(0);
              setRrtCount(0);
              setRecentStations([]);
            }}
          >
            Skip Loading
          </Button>
        </div>
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
            <h1>🚂 Rail Statistics Database</h1>
            <p className="lead">Welcome to your railway data management system</p>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row className="mb-4">
          <Col md={6}>
            <Card className="text-center h-100">
              <Card.Body>
                <h2 className="display-4 text-primary">🚉</h2>
                <h3 className="card-title">{stationCount}</h3>
                <p className="card-text">Total Stations</p>
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate('/stations')}
                >
                  View All Stations
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="text-center h-100">
              <Card.Body>
                <h2 className="display-4 text-success">🎫</h2>
                <h3 className="card-title">{rrtCount}</h3>
                <p className="card-text">Total RRTs</p>
                <Button 
                  variant="outline-success" 
                  onClick={() => navigate('/rrt')}
                >
                  View All RRTs
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row className="mb-4">
          <Col lg={6}>
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">🚉 Station Management</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-primary" 
                    onClick={() => navigate('/stations')}
                  >
                    📋 View All Stations
                  </Button>
                  <Button 
                    variant="outline-success" 
                    onClick={() => navigate('/add-station')}
                  >
                    ➕ Add New Station
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

          <Col lg={6}>
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">🎫 RRT Management</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-primary" 
                    onClick={() => navigate('/rrt')}
                  >
                    🎫 RRT Dashboard
                  </Button>
                  <Button 
                    variant="outline-success" 
                    onClick={() => navigate('/rrt/add')}
                  >
                    ➕ Add New RRT
                  </Button>
                  <Button 
                    variant="outline-info" 
                    onClick={() => navigate('/rrt/images')}
                  >
                    🖼️ Manage Images
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Activity */}
        <Row className="mb-4">
          <Col lg={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">🆕 Recent Stations</h5>
              </Card.Header>
              <Card.Body>
                {recentStations.length === 0 ? (
                  <p className="text-muted">No stations added yet.</p>
                ) : (
                  <div className="d-grid gap-2">
                    {recentStations.map((station) => (
                      <div key={station.id} className="d-flex justify-content-between align-items-center p-2 border rounded">
                        <div>
                          <strong>{station.stationName}</strong>
                          <div className="small text-muted">{station.crsCode}</div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          onClick={() => navigate(`/station/${station.crsCode}`)}
                        >
                          👁️ View
                        </Button>
                      </div>
                    ))}
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => navigate('/stations')}
                    >
                      View All Stations
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">🆕 Recent RRTs</h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted">RRT data loading temporarily disabled.</p>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/rrt')}
                >
                  Go to RRT Dashboard
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Access Grid */}
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">⚡ Quick Access</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <Button 
                      variant="primary" 
                      className="w-100 mb-2"
                      onClick={() => navigate('/add-station')}
                    >
                      ➕ Add Station
                    </Button>
                  </Col>
                  <Col md={3}>
                    <Button 
                      variant="success" 
                      className="w-100 mb-2"
                      onClick={() => navigate('/rrt/add')}
                    >
                      🎫 Add RRT
                    </Button>
                  </Col>
                  <Col md={3}>
                    <Button 
                      variant="info" 
                      className="w-100 mb-2"
                      onClick={() => navigate('/search')}
                    >
                      🔍 Search
                    </Button>
                  </Col>
                  <Col md={3}>
                    <Button 
                      variant="warning" 
                      className="w-100 mb-2"
                      onClick={() => navigate('/rrt/images')}
                    >
                      🖼️ Images
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

