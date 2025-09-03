import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Navbar, Nav } from 'react-bootstrap';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function ViewOperator() {
  const { operatorId } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [operator, setOperator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (operatorId) {
      loadOperator();
    }
  }, [operatorId]);

  async function loadOperator() {
    try {
      setLoading(true);
      setError('');
      
      const docRef = doc(db, 'toc_operators', operatorId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        setError('Train operator not found');
        return;
      }
      
      const operatorData = docSnap.data();
      setOperator({
        id: docSnap.id,
        ...operatorData
      });
      
    } catch (error) {
      setError('Failed to load operator: ' + error.message);
      toast.error('Failed to load operator');
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
          <p className="mt-2">Loading operator details...</p>
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
          <Button variant="outline-danger" onClick={() => navigate('/operators')}>
            ← Back to Operators
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!operator) {
    return (
      <Container>
        <Alert variant="warning">
          <h4>Operator Not Found</h4>
          <p>No train operator found with ID: {operatorId}</p>
          <Button variant="outline-warning" onClick={() => navigate('/operators')}>
            ← Back to Operators
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
            Rail Statistics
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link onClick={() => navigate('/stations')}>All Stations</Nav.Link>
              <Nav.Link onClick={() => navigate('/operators')}>All Operators</Nav.Link>
              <Nav.Link onClick={() => navigate('/add-station')}>Add Station</Nav.Link>
              <Nav.Link onClick={() => navigate('/add-operator')}>Add Operator</Nav.Link>
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
              <div className="d-flex align-items-center">
                <h1>🚄 {operator.name}</h1>
                {operator.colorHex && (
                  <div 
                    style={{
                      width: '30px',
                      height: '30px',
                      backgroundColor: operator.colorHex,
                      border: '2px solid #ddd',
                      borderRadius: '50%',
                      marginLeft: '15px'
                    }}
                    title={`Brand color: ${operator.colorHex}`}
                  ></div>
                )}
              </div>
              <div>
                <Button 
                  variant="outline-warning" 
                  className="me-2"
                  onClick={() => navigate(`/edit-operator/${operator.id}`)}
                >
                  ✏️ Edit Operator
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/operators')}
                >
                  ← Back to Operators
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={8}>
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">🚄 Operator Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p><strong>Operator Name:</strong></p>
                    <p className="mb-3 fs-5">{operator.name}</p>
                    
                    <p><strong>Operator Type:</strong></p>
                    <p className="mb-3">
                      <Badge bg="primary" className="fs-6">{operator.operatortype || 'N/A'}</Badge>
                    </p>
                  </Col>
                  
                  <Col md={6}>
                    <p><strong>Operating Region:</strong></p>
                    <p className="mb-3">
                      <Badge bg="secondary" className="fs-6">{operator.operatorregion || 'N/A'}</Badge>
                    </p>
                    
                    {operator.uploadedAt && (
                      <>
                        <p><strong>Added:</strong></p>
                        <p className="mb-3">
                          <small>{new Date(operator.uploadedAt).toLocaleDateString()}</small>
                        </p>
                      </>
                    )}
                  </Col>
                </Row>
                
                {operator.colorHex && (
                  <>
                    <hr />
                    <p><strong>Brand Color:</strong></p>
                    <div className="d-flex align-items-center">
                      <div 
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: operator.colorHex,
                          border: '2px solid #ddd',
                          borderRadius: '8px',
                          marginRight: '12px'
                        }}
                      ></div>
                      <div>
                        <p className="mb-0 fw-bold">{operator.colorHex}</p>
                        <small className="text-muted">Hex Color Code</small>
                      </div>
                    </div>
                  </>
                )}

                {operator.notes && (
                  <>
                    <hr />
                    <p><strong>Notes:</strong></p>
                    <p className="mb-0">{operator.notes}</p>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">📊 Operator Details</h6>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <strong>Type:</strong>
                  <br />
                  <Badge bg="primary">{operator.operatortype || 'Unknown'}</Badge>
                </div>
                
                <div className="mb-3">
                  <strong>Region:</strong>
                  <br />
                  <Badge bg="secondary">{operator.operatorregion || 'Unknown'}</Badge>
                </div>

                {operator.colorHex && (
                  <div className="mb-3">
                    <strong>Brand Color:</strong>
                    <br />
                    <div className="d-flex align-items-center mt-1">
                      <div 
                        style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: operator.colorHex,
                          border: '1px solid #ddd',
                          borderRadius: '3px',
                          marginRight: '8px'
                        }}
                      ></div>
                      <span className="small font-monospace">{operator.colorHex}</span>
                    </div>
                  </div>
                )}

                {operator.uploadedAt && (
                  <div className="mb-3">
                    <strong>Added:</strong>
                    <br />
                    <small className="text-muted">
                      {new Date(operator.uploadedAt).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </small>
                  </div>
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
                    onClick={() => navigate(`/edit-operator/${operator.id}`)}
                  >
                    ✏️ Edit Operator
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => navigate('/operators')}
                  >
                    📋 All Operators
                  </Button>
                  <Button 
                    variant="outline-success" 
                    onClick={() => navigate('/add-operator')}
                  >
                    ➕ Add New Operator
                  </Button>
                  <Button 
                    variant="outline-info" 
                    onClick={() => navigate('/search')}
                  >
                    🔍 Search
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
