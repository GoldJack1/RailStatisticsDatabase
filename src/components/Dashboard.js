import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { ref, listAll, getBytes } from 'firebase/storage';
import { db, storage } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';

export default function Dashboard() {
  const [stationCount, setStationCount] = useState(0);
  const [operatorCount, setOperatorCount] = useState(0);
  const [rrtCount, setRrtCount] = useState(0);
  const [recentStations, setRecentStations] = useState([]);
  const [recentOperators, setRecentOperators] = useState([]);
  const [recentRRTs, setRecentRRTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      
      // Load station data
      const stationCollection = collection(db, 'stations');
      const stationSnapshot = await getDocs(stationCollection);
      setStationCount(stationSnapshot.size);
      
      // Load operator data
      const operatorCollection = collection(db, 'toc_operators');
      const operatorSnapshot = await getDocs(operatorCollection);
      setOperatorCount(operatorSnapshot.size);
      
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
      
      // Get recent operators
      const recentOperatorQuery = query(
        collection(db, 'toc_operators'),
        orderBy('uploadedAt', 'desc'),
        limit(3)
      );
      const recentOperatorSnapshot = await getDocs(recentOperatorQuery);
      const recentOperatorData = recentOperatorSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentOperators(recentOperatorData);
      
      // Load RRT data from Firebase Storage (same method as RRT pages)
      await loadRRTData();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
      
      // Set default values
      setStationCount(0);
      setOperatorCount(0);
      setRrtCount(0);
      setRecentStations([]);
      setRecentOperators([]);
      setRecentRRTs([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadRRTData() {
    try {
      // Read from Firebase Storage - RRT JSON files (same logic as RRTList and RRTDashboard)
      const rrtStorageRef = ref(storage, 'RRT-JSONS');
      const result = await listAll(rrtStorageRef);
      
      const rrtFiles = await Promise.all(
        result.items.map(async (item) => {
          try {
            // Get the JSON content
            const bytes = await getBytes(item);
            const jsonText = new TextDecoder().decode(bytes);
            const jsonData = JSON.parse(jsonText);
            
            return {
              name: item.name,
              path: item.fullPath,
              data: jsonData,
              size: item.size || 0,
              updated: item.updated || new Date()
            };
          } catch (error) {
            console.error(`Error parsing JSON from ${item.name}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any failed parses and set the data
      const validRRTs = rrtFiles.filter(rrt => rrt !== null);
      setRrtCount(validRRTs.length);
      
      // Get the 3 most recent RRTs for display
      const sortedRRTs = validRRTs
        .sort((a, b) => new Date(b.updated) - new Date(a.updated))
        .slice(0, 3);
      setRecentRRTs(sortedRRTs);
      
    } catch (error) {
      console.error('Error loading RRT data from Storage:', error);
      
      // Try root storage as fallback (same as RRT pages)
      try {
        const rootRef = ref(storage);
        const result = await listAll(rootRef);
        
        // Look for JSON files in root
        const jsonFiles = result.items.filter(item => 
          item.name.endsWith('.json') && 
          !item.name.includes('firebase') && 
          !item.name.includes('config')
        );
        
        const rrtFiles = await Promise.all(
          jsonFiles.map(async (item) => {
            try {
              const bytes = await getBytes(item);
              const jsonText = new TextDecoder().decode(bytes);
              const jsonData = JSON.parse(jsonText);
              
              return {
                name: item.name,
                path: item.fullPath,
                data: jsonData,
                size: item.size || 0,
                updated: item.updated || new Date()
              };
            } catch (error) {
              console.error(`Error parsing JSON from ${item.name}:`, error);
              return null;
            }
          })
        );
        
        const validRRTs = rrtFiles.filter(rrt => rrt !== null);
        setRrtCount(validRRTs.length);
        
        // Get the 3 most recent RRTs for display
        const sortedRRTs = validRRTs
          .sort((a, b) => new Date(b.updated) - new Date(a.updated))
          .slice(0, 3);
        setRecentRRTs(sortedRRTs);
        
      } catch (rootError) {
        console.error('Error loading from root storage:', rootError);
        setRrtCount(0);
        setRecentRRTs([]);
      }
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
              setOperatorCount(0);
              setRrtCount(0);
              setRecentStations([]);
              setRecentOperators([]);
              setRecentRRTs([]);
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
      <Header activeSection="dashboard" />

      <Container>
        <Row className="mb-5">
          <Col>
            <div className="text-center">
              <h1 className="display-4 mb-3 fw-light">🚂 Rail Statistics Database</h1>
              <p className="lead text-muted mb-4">Comprehensive railway data management system</p>
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <Button variant="outline-dark" size="lg" className="px-4" onClick={() => navigate('/add-station')}>
                  ➕ Add Station
                </Button>
                <Button variant="outline-dark" size="lg" className="px-4" onClick={() => navigate('/add-operator')}>
                  🚄 Add Operator
                </Button>
                <Button variant="outline-dark" size="lg" className="px-4" onClick={() => navigate('/rrt-form')}>
                  🎫 Add RRT
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row className="mb-5">
          <Col md={4} className="mb-4">
            <Card className="text-center h-100 shadow-sm">
              <Card.Body className="py-5">
                <div className="mb-4">
                  <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center border" 
                       style={{width: '80px', height: '80px'}}>
                    <span className="display-5">🚉</span>
                  </div>
                </div>
                <h2 className="display-6 fw-bold mb-2">{stationCount}</h2>
                <p className="text-muted mb-4">Railway Stations</p>
                <Button 
                  variant="outline-dark" 
                  className="px-4"
                  onClick={() => navigate('/stations')}
                >
                  View Stations
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="text-center h-100 shadow-sm">
              <Card.Body className="py-5">
                <div className="mb-4">
                  <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center border" 
                       style={{width: '80px', height: '80px'}}>
                    <span className="display-5">🚄</span>
                  </div>
                </div>
                <h2 className="display-6 fw-bold mb-2">{operatorCount}</h2>
                <p className="text-muted mb-4">Train Operators</p>
                <Button 
                  variant="outline-dark" 
                  className="px-4"
                  onClick={() => navigate('/operators')}
                >
                  View Operators
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="text-center h-100 shadow-sm">
              <Card.Body className="py-5">
                <div className="mb-4">
                  <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center border" 
                       style={{width: '80px', height: '80px'}}>
                    <span className="display-5">🎫</span>
                  </div>
                </div>
                <h2 className="display-6 fw-bold mb-2">{rrtCount}</h2>
                <p className="text-muted mb-4">RRT Travelcards</p>
                <Button 
                  variant="outline-dark" 
                  className="px-4"
                  onClick={() => navigate('/rrt')}
                >
                  View RRTs
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Management Sections */}
        <Row className="mb-5">
          <Col>
            <h3 className="mb-4 text-center fw-light">📊 Management Overview</h3>
          </Col>
        </Row>
        
        <Row className="mb-5">
          <Col lg={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-light border-bottom">
                <h5 className="mb-0 text-dark">🚉 Station Management</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-dark" 
                    onClick={() => navigate('/stations')}
                  >
                    📋 View All Stations
                  </Button>
                  <Button 
                    variant="outline-dark" 
                    onClick={() => navigate('/add-station')}
                  >
                    ➕ Add New Station
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/search')}
                  >
                    🔍 Search Database
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-light border-bottom">
                <h5 className="mb-0 text-dark">🚄 Operator Management</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-dark" 
                    onClick={() => navigate('/operators')}
                  >
                    📋 View All Operators
                  </Button>
                  <Button 
                    variant="outline-dark" 
                    onClick={() => navigate('/add-operator')}
                  >
                    ➕ Add New Operator
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/search')}
                  >
                    🔍 Search Database
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-light border-bottom">
                <h5 className="mb-0 text-dark">🎫 RRT Management</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-dark" 
                    onClick={() => navigate('/rrt')}
                  >
                    🎫 RRT Dashboard
                  </Button>
                  <Button 
                    variant="outline-dark" 
                    onClick={() => navigate('/rrt-form')}
                  >
                    ➕ Add New RRT
                  </Button>
                  <Button 
                    variant="outline-secondary" 
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
        <Row className="mb-5">
          <Col>
            <h3 className="mb-4 text-center fw-light">🕒 Recent Activity</h3>
          </Col>
        </Row>
        
        <Row className="mb-5">
          <Col lg={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-light border-bottom">
                <h5 className="mb-0 text-dark">🆕 Recent Stations</h5>
              </Card.Header>
              <Card.Body>
                {recentStations.length === 0 ? (
                  <div className="text-center py-3">
                    <div className="text-muted mb-2">No stations added yet</div>
                    <Button variant="outline-dark" size="sm" onClick={() => navigate('/add-station')}>
                      Add First Station
                    </Button>
                  </div>
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
                          variant="outline-dark"
                          onClick={() => navigate(`/station/${station.crsCode}`)}
                        >
                          👁️ View
                        </Button>
                      </div>
                    ))}
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => navigate('/stations')}
                    >
                      View All Stations
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-light border-bottom">
                <h5 className="mb-0 text-dark">🆕 Recent Operators</h5>
              </Card.Header>
              <Card.Body>
                {recentOperators.length === 0 ? (
                  <div className="text-center py-3">
                    <div className="text-muted mb-2">No operators added yet</div>
                    <Button variant="outline-dark" size="sm" onClick={() => navigate('/add-operator')}>
                      Add First Operator
                    </Button>
                  </div>
                ) : (
                  <div className="d-grid gap-2">
                    {recentOperators.map((operator) => (
                      <div key={operator.id} className="d-flex justify-content-between align-items-center p-2 border rounded">
                        <div className="d-flex align-items-center">
                          {operator.colorHex && (
                            <div 
                              style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: operator.colorHex,
                                border: '1px solid #ddd',
                                borderRadius: '50%',
                                marginRight: '8px'
                              }}
                            ></div>
                          )}
                          <div>
                            <strong>{operator.name}</strong>
                            <div className="small text-muted">{operator.operatorregion}</div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline-dark"
                          onClick={() => navigate(`/operator/${operator.id}`)}
                        >
                          👁️ View
                        </Button>
                      </div>
                    ))}
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => navigate('/operators')}
                    >
                      View All Operators
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-light border-bottom">
                <h5 className="mb-0 text-dark">🆕 Recent RRTs</h5>
              </Card.Header>
              <Card.Body>
                {recentRRTs.length === 0 ? (
                  <div className="text-center py-3">
                    <div className="text-muted mb-2">No RRT files found</div>
                    <Button variant="outline-dark" size="sm" onClick={() => navigate('/rrt-form')}>
                      Add First RRT
                    </Button>
                  </div>
                ) : (
                  <div className="d-grid gap-2">
                    {recentRRTs.map((rrt) => (
                      <div key={rrt.name} className="d-flex justify-content-between align-items-center p-2 border rounded">
                        <div>
                          <strong>{rrt.data.name || rrt.data.title || 'Unnamed RRT'}</strong>
                          <div className="small text-muted">
                            {rrt.data.area && <span className="badge bg-secondary me-1">{rrt.data.area}</span>}
                            {rrt.data.price && <span className="text-muted">£{rrt.data.price}</span>}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline-dark"
                          onClick={() => navigate(`/rrt-form/${encodeURIComponent(rrt.name)}`)}
                        >
                          👁️ View
                        </Button>
                      </div>
                    ))}
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => navigate('/rrt/list')}
                    >
                      View All RRTs
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Access Footer */}
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Body className="py-4">
                <h4 className="text-center mb-4 fw-light">⚡ Quick Access Toolbar</h4>
                <Row className="justify-content-center">
                  <Col md={2} className="mb-3">
                    <div className="d-grid">
                      <Button 
                        variant="outline-dark" 
                        size="lg"
                        onClick={() => navigate('/add-station')}
                      >
                        ➕<br/><small>Add Station</small>
                      </Button>
                    </div>
                  </Col>
                  <Col md={2} className="mb-3">
                    <div className="d-grid">
                      <Button 
                        variant="outline-dark" 
                        size="lg"
                        onClick={() => navigate('/add-operator')}
                      >
                        🚄<br/><small>Add Operator</small>
                      </Button>
                    </div>
                  </Col>
                  <Col md={2} className="mb-3">
                    <div className="d-grid">
                      <Button 
                        variant="outline-dark" 
                        size="lg"
                        onClick={() => navigate('/rrt-form')}
                      >
                        🎫<br/><small>Add RRT</small>
                      </Button>
                    </div>
                  </Col>
                  <Col md={2} className="mb-3">
                    <div className="d-grid">
                      <Button 
                        variant="outline-secondary" 
                        size="lg"
                        onClick={() => navigate('/search')}
                      >
                        🔍<br/><small>Search</small>
                      </Button>
                    </div>
                  </Col>
                  <Col md={2} className="mb-3">
                    <div className="d-grid">
                      <Button 
                        variant="outline-secondary" 
                        size="lg"
                        onClick={() => navigate('/rrt/images')}
                      >
                        🖼️<br/><small>Images</small>
                      </Button>
                    </div>
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

