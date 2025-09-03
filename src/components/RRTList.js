import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Table, Alert, Spinner, Badge, Navbar, Nav, Modal } from 'react-bootstrap';
import { ref, listAll, getBytes, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function RRTList() {
  const [rrtData, setRrtData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rrtToDelete, setRrtToDelete] = useState(null);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    loadRRTData();
  }, []);

  async function loadRRTData() {
    try {
      setLoading(true);
      
      // Read from Firebase Storage - RRT JSON files
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
      setRrtData(validRRTs);
      
    } catch (error) {
      console.error('Error loading RRT data from Storage:', error);
      // If RRT-JSONS folder doesn't exist, try the root storage
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
        setRrtData(validRRTs);
        
      } catch (rootError) {
        console.error('Error loading from root storage:', rootError);
        toast.error('Failed to load RRT data from Storage');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRRT(fileName) {
    try {
      // Delete from Firebase Storage
      const fileRef = ref(storage, `RRT-JSONS/${fileName}`);
      await deleteObject(fileRef);
      
      toast.success('RRT file deleted successfully');
      setShowDeleteModal(false);
      setRrtToDelete(null);
      
      // Reload the list
      loadRRTData();
      
    } catch (error) {
      toast.error('Failed to delete RRT file: ' + error.message);
    }
  }

  function confirmDelete(rrt) {
    setRrtToDelete(rrt);
    setShowDeleteModal(true);
  }

  const filteredRRTs = rrtData.filter(rrt => 
    rrt.data.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rrt.data.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rrt.data.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rrt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <p className="mt-2">Loading RRT data from Firebase Storage...</p>
        </div>
      </Container>
    );
  }

  // Add error boundary for render errors
  try {
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
                <Nav.Link onClick={() => navigate('/add-station')}>Add Station</Nav.Link>
                <Nav.Link onClick={() => navigate('/search')}>Search</Nav.Link>
                <Nav.Link onClick={() => navigate('/rrt')} active>RRT Management</Nav.Link>
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
                <h1>📋 All RRT Data from Storage</h1>
                <div>
                  <Button 
                    variant="primary" 
                    className="me-2"
                    onClick={() => navigate('/rrt-form')}
                  >
                    ➕ Add New RRT
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/rrt')}
                  >
                    ← Back to RRT Dashboard
                  </Button>
                </div>
              </div>
              <p className="lead">Manage all Ranger Rover Travelcard data from Firebase Storage</p>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Search RRTs</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name, area, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end">
              <div className="text-muted">
                Showing {filteredRRTs.length} of {rrtData.length} RRT files
              </div>
            </Col>
          </Row>

          {filteredRRTs.length === 0 ? (
            <Alert variant="info">
              {searchTerm ? 'No RRTs found matching your search.' : 'No RRT data found in Firebase Storage. Add your first travelcard!'}
            </Alert>
          ) : (
            <Card>
              <Card.Body>
                <Table responsive>
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>RRT Name</th>
                      <th>Area</th>
                      <th>Code</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRRTs.map((rrt, index) => (
                      <tr key={index}>
                        <td>
                          <code className="small">{rrt.name}</code>
                          <div className="small text-muted">
                            Size: {(rrt.size / 1024).toFixed(1)} KB
                          </div>
                        </td>
                        <td>
                          <strong>{rrt.data.name || rrt.data.title || 'Unnamed RRT'}</strong>
                          {rrt.data.description && (
                            <div className="small text-muted">{rrt.data.description}</div>
                          )}
                        </td>
                        <td>
                          {rrt.data.area && <Badge bg="primary">{rrt.data.area}</Badge>}
                        </td>
                        <td>
                          {rrt.data.code && <code>{rrt.data.code}</code>}
                        </td>
                        <td>
                          {rrt.data.price && (
                            <span className="text-success fw-bold">£{rrt.data.price}</span>
                          )}
                        </td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="outline-primary" 
                            className="me-2"
                            onClick={() => navigate(`/rrt-form/${encodeURIComponent(rrt.name)}`)}
                          >
                            👁️ View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-warning"
                            className="me-2"
                            onClick={() => navigate(`/rrt-form/${encodeURIComponent(rrt.name)}`)}
                          >
                            ✏️ Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => confirmDelete(rrt)}
                          >
                            🗑️ Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Container>

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete "{rrtToDelete?.name}"?
            <br />
            <strong>This action cannot be undone.</strong>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={() => handleDeleteRRT(rrtToDelete?.name)}
            >
              Delete RRT File
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  } catch (error) {
    console.error('Error rendering RRTList component:', error);
    return (
      <Container>
        <Alert variant="danger">
          An unexpected error occurred while displaying RRT data. Please try again later.
        </Alert>
      </Container>
    );
  }
}
